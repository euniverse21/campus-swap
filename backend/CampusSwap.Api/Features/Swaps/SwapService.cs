using CampusSwap.Api.Data;
using CampusSwap.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CampusSwap.Api.Features.Swaps;

// Every action that changes the state of a swap lives here.
//
// Rule: each action first LOCKS the listing row (SELECT ... FOR UPDATE) inside a transaction.
// Two requests on the same listing (e.g. two "Accept" clicks, or "Accept" + "Withdraw")
// are therefore processed one after the other, and the second one sees the first one's result.
// The database indexes and the Item row version are a second line of defence.
public class SwapService(AppDbContext db)
{
    // Owner accepts one offer: listing + both items become Reserved, other pending offers are rejected
    public async Task<SwapResult> AcceptOfferAsync(int offerId, int studentId, CancellationToken ct = default)
    {
        var listingId = await FindListingIdAsync(offerId, ct);
        if (listingId is null)
            return SwapResult.NotFound();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var listing = await LockListingAsync(listingId.Value, ct);
        if (listing is null)
            return SwapResult.NotFound();
        if (listing.OwnerId != studentId)
            return SwapResult.Forbidden("Only the owner of the listing can accept offers.");
        if (listing.Status != ListingStatus.Open)
            return SwapResult.Conflict("This listing is no longer open. Another offer may have been accepted.");

        var offer = await db.SwapOffers
            .Include(o => o.OfferedItem)
            .SingleAsync(o => o.Id == offerId, ct);
        if (offer.Status != OfferStatus.Pending)
            return SwapResult.Conflict("Only pending offers can be accepted.");

        var listingItem = await db.Items.SingleAsync(i => i.Id == listing.ItemId, ct);
        if (listingItem.Status != ItemStatus.Available ||
            (offer.OfferedItem is not null && offer.OfferedItem.Status != ItemStatus.Available))
            return SwapResult.Conflict("One of the items is no longer available.");

        offer.Status = OfferStatus.Accepted;
        listing.Status = ListingStatus.Reserved;
        listingItem.Status = ItemStatus.Reserved;
        if (offer.OfferedItem is not null)
            offer.OfferedItem.Status = ItemStatus.Reserved;

        try
        {
            await db.SaveChangesAsync(ct);

            await db.SwapOffers
                .Where(o => o.ListingId == listing.Id && o.Id != offer.Id && o.Status == OfferStatus.Pending)
                .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, OfferStatus.Rejected), ct);

            await transaction.CommitAsync(ct);
            return SwapResult.Ok();
        }
        catch (DbUpdateConcurrencyException)
        {
            // An item's row version (xmin) changed since we read it
            return SwapResult.Conflict("Someone changed this swap at the same time. Please refresh and try again.");
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // The "one accepted offer per listing" index stopped a second acceptance
            return SwapResult.Conflict("Another offer has already been accepted for this listing.");
        }
        // Leaving without CommitAsync rolls the transaction back
    }

    // Owner declines one pending offer
    public async Task<SwapResult> RejectOfferAsync(int offerId, int studentId, CancellationToken ct = default)
    {
        var listingId = await FindListingIdAsync(offerId, ct);
        if (listingId is null)
            return SwapResult.NotFound();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var listing = await LockListingAsync(listingId.Value, ct);
        if (listing is null)
            return SwapResult.NotFound();
        if (listing.OwnerId != studentId)
            return SwapResult.Forbidden("Only the owner of the listing can reject offers.");

        var offer = await db.SwapOffers.SingleAsync(o => o.Id == offerId, ct);
        if (offer.Status != OfferStatus.Pending)
            return SwapResult.Conflict("Only pending offers can be rejected.");

        offer.Status = OfferStatus.Rejected;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return SwapResult.Ok();
    }

    // The student who sent a pending offer takes it back
    public async Task<SwapResult> WithdrawOfferAsync(int offerId, int studentId, CancellationToken ct = default)
    {
        var listingId = await FindListingIdAsync(offerId, ct);
        if (listingId is null)
            return SwapResult.NotFound();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Lock so that "Withdraw" and the owner's "Accept" cannot overlap
        if (await LockListingAsync(listingId.Value, ct) is null)
            return SwapResult.NotFound();

        var offer = await db.SwapOffers.SingleAsync(o => o.Id == offerId, ct);
        if (offer.OfferedById != studentId)
            return SwapResult.Forbidden("You can only withdraw your own offers.");
        if (offer.Status != OfferStatus.Pending)
            return SwapResult.Conflict("Only pending offers can be withdrawn. This offer may have just been accepted.");

        offer.Status = OfferStatus.Withdrawn;
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return SwapResult.Ok();
    }

    // Owner cancels an open listing; its pending offers are rejected
    public async Task<SwapResult> CancelListingAsync(int listingId, int studentId, CancellationToken ct = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var listing = await LockListingAsync(listingId, ct);
        if (listing is null)
            return SwapResult.NotFound();
        if (listing.OwnerId != studentId)
            return SwapResult.Forbidden("Only the owner can cancel this listing.");
        if (listing.Status != ListingStatus.Open)
            return SwapResult.Conflict("Only open listings can be cancelled.");

        listing.Status = ListingStatus.Cancelled;
        await db.SaveChangesAsync(ct);

        await db.SwapOffers
            .Where(o => o.ListingId == listingId && o.Status == OfferStatus.Pending)
            .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, OfferStatus.Rejected), ct);

        await transaction.CommitAsync(ct);
        return SwapResult.Ok();
    }

    // After meeting up, each student presses "We swapped".
    // When both have confirmed: offer + listing become Completed and both items Swapped.
    public async Task<SwapResult> ConfirmSwapAsync(int offerId, int studentId, CancellationToken ct = default)
    {
        var listingId = await FindListingIdAsync(offerId, ct);
        if (listingId is null)
            return SwapResult.NotFound();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var listing = await LockListingAsync(listingId.Value, ct);
        if (listing is null)
            return SwapResult.NotFound();

        var offer = await db.SwapOffers
            .Include(o => o.OfferedItem)
            .SingleAsync(o => o.Id == offerId, ct);

        var isOwner = listing.OwnerId == studentId;
        var isOfferer = offer.OfferedById == studentId;
        if (!isOwner && !isOfferer)
            return SwapResult.Forbidden("Only the two students in this swap can confirm it.");
        if (offer.Status != OfferStatus.Accepted)
            return SwapResult.Conflict("Only accepted swaps that are not completed yet can be confirmed.");

        var now = DateTime.UtcNow;
        if (isOwner)
            offer.OwnerConfirmedAt ??= now;
        if (isOfferer)
            offer.OffererConfirmedAt ??= now;

        if (offer.OwnerConfirmedAt is not null && offer.OffererConfirmedAt is not null)
        {
            var listingItem = await db.Items.SingleAsync(i => i.Id == listing.ItemId, ct);

            offer.Status = OfferStatus.Completed;
            listing.Status = ListingStatus.Completed;
            listingItem.Status = ItemStatus.Swapped;
            if (offer.OfferedItem is not null)
                offer.OfferedItem.Status = ItemStatus.Swapped;
        }

        try
        {
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return SwapResult.Ok();
        }
        catch (DbUpdateConcurrencyException)
        {
            return SwapResult.Conflict("Someone changed this swap at the same time. Please refresh and try again.");
        }
    }

    // Either student calls off an accepted swap before it is completed.
    // The listing opens again and both items become available.
    public async Task<SwapResult> CancelSwapAsync(int offerId, int studentId, CancellationToken ct = default)
    {
        var listingId = await FindListingIdAsync(offerId, ct);
        if (listingId is null)
            return SwapResult.NotFound();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var listing = await LockListingAsync(listingId.Value, ct);
        if (listing is null)
            return SwapResult.NotFound();

        var offer = await db.SwapOffers
            .Include(o => o.OfferedItem)
            .SingleAsync(o => o.Id == offerId, ct);

        var isOwner = listing.OwnerId == studentId;
        var isOfferer = offer.OfferedById == studentId;
        if (!isOwner && !isOfferer)
            return SwapResult.Forbidden("Only the two students in this swap can cancel it.");
        if (offer.Status != OfferStatus.Accepted)
            return SwapResult.Conflict("Only accepted swaps that are not completed yet can be cancelled.");

        var listingItem = await db.Items.SingleAsync(i => i.Id == listing.ItemId, ct);

        // Owner backing out = rejected; offerer backing out = withdrawn
        offer.Status = isOwner ? OfferStatus.Rejected : OfferStatus.Withdrawn;
        offer.OwnerConfirmedAt = null;
        offer.OffererConfirmedAt = null;
        listing.Status = ListingStatus.Open;
        listingItem.Status = ItemStatus.Available;
        if (offer.OfferedItem is not null)
            offer.OfferedItem.Status = ItemStatus.Available;

        try
        {
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return SwapResult.Ok();
        }
        catch (DbUpdateConcurrencyException)
        {
            return SwapResult.Conflict("Someone changed this swap at the same time. Please refresh and try again.");
        }
    }

    private Task<int?> FindListingIdAsync(int offerId, CancellationToken ct)
        => db.SwapOffers
            .Where(o => o.Id == offerId)
            .Select(o => (int?)o.ListingId)
            .FirstOrDefaultAsync(ct);

    // SELECT ... FOR UPDATE: other transactions that want this listing wait here until we commit.
    // Must be called inside a transaction, otherwise the lock is released immediately.
    private async Task<Listing?> LockListingAsync(int listingId, CancellationToken ct)
    {
        var rows = await db.Listings
            .FromSql($"""SELECT * FROM "Listings" WHERE "Id" = {listingId} FOR UPDATE""")
            .ToListAsync(ct);

        return rows.SingleOrDefault();
    }

    private static bool IsUniqueViolation(DbUpdateException ex)
        => ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}

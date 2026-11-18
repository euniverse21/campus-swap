using CampusSwap.Api.Data;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Verification;
using CampusSwap.Api.Infrastructure.Http;
using CampusSwap.Api.Infrastructure.Security;
using CampusSwap.Api.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CampusSwap.Api.Features.Offers;

// Every offer endpoint needs a verified student
[ApiController]
[Authorize]
public class OffersController(AppDbContext db, PhotoUploader photoUploader) : ControllerBase
{
    private const int MaxPhotos = 3;
    private const long MaxRequestBytes = 20 * 1024 * 1024;

    // Send an offer: "I'll give you this item for yours"
    [HttpPost("api/listings/{listingId:int}/offers")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<OfferDto>> Create(int listingId, [FromForm] CreateOfferForm form, CancellationToken ct)
    {
        var studentId = User.GetStudentId();

        var listing = await db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == listingId, ct);
        if (listing is null)
            return NotFound();

        if (listing.OwnerId == studentId)
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "You cannot make an offer on your own listing.");

        if (listing.Status != ListingStatus.Open)
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "This listing is no longer accepting offers.");

        // Friendly check first; the database index below is the real guarantee
        var hasPendingOffer = await db.SwapOffers.AnyAsync(
            o => o.ListingId == listingId && o.OfferedById == studentId && o.Status == OfferStatus.Pending, ct);
        if (hasPendingOffer)
            return PendingOfferConflict();

        var (photos, photoError) = await photoUploader.ValidateAsync(form.Photos, MaxPhotos, ct);
        if (photos is null)
        {
            ModelState.AddModelError(nameof(form.Photos), photoError ?? "Invalid photos.");
            return ValidationProblem(ModelState);
        }
        using var validPhotos = photos;

        var savedUrls = await photoUploader.SaveAsync(validPhotos, ct);
        try
        {
            var offer = new SwapOffer
            {
                ListingId = listingId,
                OfferedById = studentId,
                Type = OfferType.Item,
                Message = string.IsNullOrWhiteSpace(form.Message) ? null : form.Message.Trim(),
                OfferedItem = new Item
                {
                    OwnerId = studentId,
                    Name = form.ItemName.Trim(),
                    Description = form.ItemDescription?.Trim() ?? string.Empty,
                    Category = form.Category!.Value,
                    Condition = form.Condition!.Value,
                    Photos = savedUrls
                        .Select((url, index) => new ItemPhoto { Url = url, SortOrder = index })
                        .ToList(),
                },
            };

            db.SwapOffers.Add(offer);
            await db.SaveChangesAsync(ct);

            var created = await LoadOfferAsync(offer.Id, studentId, ct);
            return CreatedAtAction(nameof(GetForListing), new { listingId }, created);
        }
        catch (Exception ex)
        {
            await photoUploader.DeleteAsync(savedUrls);

            // Two requests at the same moment: the unique index rejected the second one
            if (ex is DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } })
                return PendingOfferConflict();

            throw;
        }
    }

    // Offers on a listing. The owner sees every offer; anyone else sees only their own.
    [HttpGet("api/listings/{listingId:int}/offers")]
    public async Task<ActionResult<List<OfferDto>>> GetForListing(int listingId, CancellationToken ct)
    {
        var studentId = User.GetStudentId();

        var listing = await db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == listingId, ct);
        if (listing is null)
            return NotFound();

        var isOwner = listing.OwnerId == studentId;

        var offers = await OffersWithDetails()
            .Where(o => o.ListingId == listingId)
            .Where(o => isOwner
                ? o.Status != OfferStatus.Withdrawn   // owner does not need to see withdrawn offers
                : o.OfferedById == studentId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        return offers.Select(o => ToDto(o, studentId)).ToList();
    }

    // Offers I have sent, newest first
    [HttpGet("api/offers/mine")]
    public async Task<ActionResult<List<SentOfferDto>>> Mine(CancellationToken ct)
    {
        var studentId = User.GetStudentId();

        var offers = await OffersWithDetails()
            .Include(o => o.Listing).ThenInclude(l => l.Item).ThenInclude(i => i.Photos)
            .Include(o => o.Listing).ThenInclude(l => l.Owner)
            .Where(o => o.OfferedById == studentId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        return offers
            .Select(o => new SentOfferDto(
                ToDto(o, studentId),
                new ListingBriefDto(
                    o.Listing.Id,
                    o.Listing.Item.Name,
                    o.Listing.Item.Photos
                        .OrderBy(p => p.SortOrder)
                        .Select(p => Request.ToAbsoluteUrl(p.Url))
                        .FirstOrDefault(),
                    o.Listing.Status.ToString(),
                    o.Listing.Owner.DisplayName)))
            .ToList();
    }

    // The student who sent a pending offer can take it back
    [HttpPost("api/offers/{id:int}/withdraw")]
    public async Task<IActionResult> Withdraw(int id, CancellationToken ct)
    {
        var offer = await db.SwapOffers.FirstOrDefaultAsync(o => o.Id == id, ct);
        if (offer is null)
            return NotFound();

        if (offer.OfferedById != User.GetStudentId())
            return Forbid();

        if (offer.Status != OfferStatus.Pending)
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Only pending offers can be withdrawn.");

        offer.Status = OfferStatus.Withdrawn;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private IQueryable<SwapOffer> OffersWithDetails()
        => db.SwapOffers
            .AsNoTracking()
            .AsSplitQuery() // several photo collections: separate queries avoid duplicated rows
            .Include(o => o.OfferedBy)
            .Include(o => o.OfferedItem).ThenInclude(i => i!.Photos);

    private async Task<OfferDto?> LoadOfferAsync(int offerId, int currentStudentId, CancellationToken ct)
    {
        var offer = await OffersWithDetails().FirstOrDefaultAsync(o => o.Id == offerId, ct);
        return offer is null ? null : ToDto(offer, currentStudentId);
    }

    private OfferDto ToDto(SwapOffer offer, int currentStudentId) => new(
        offer.Id,
        offer.ListingId,
        offer.Status.ToString(),
        offer.Type.ToString(),
        offer.Message,
        offer.CreatedAt,
        new StudentDto(offer.OfferedBy.Id, offer.OfferedBy.DisplayName),
        offer.OfferedItem is null
            ? null
            : new OfferedItemDto(
                offer.OfferedItem.Id,
                offer.OfferedItem.Name,
                offer.OfferedItem.Description,
                offer.OfferedItem.Category.ToString(),
                offer.OfferedItem.Condition.ToString(),
                offer.OfferedItem.Photos
                    .OrderBy(p => p.SortOrder)
                    .Select(p => Request.ToAbsoluteUrl(p.Url))
                    .ToList()),
        IsMine: offer.OfferedById == currentStudentId);

    private ObjectResult PendingOfferConflict() => Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: "You already have a pending offer on this listing. Withdraw it first to send a different one.");
}

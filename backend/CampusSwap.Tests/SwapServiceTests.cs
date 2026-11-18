using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Swaps;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Tests;

[Collection("Postgres")]
public class SwapServiceTests(PostgresFixture fx)
{
    // Owner lists a textbook; Tom and Amy each offer a jacket
    private record Scenario(int OwnerId, int TomId, int AmyId, int ListingId, int TomOfferId, int AmyOfferId);

    private async Task<Scenario> CreateScenarioAsync()
    {
        await using var db = fx.CreateContext();
        var unique = Guid.NewGuid().ToString("N")[..8];

        var owner = new Student { Email = $"owner-{unique}@flinders.edu.au", DisplayName = "Owner" };
        var tom = new Student { Email = $"tom-{unique}@flinders.edu.au", DisplayName = "Tom" };
        var amy = new Student { Email = $"amy-{unique}@flinders.edu.au", DisplayName = "Amy" };

        var listing = new Listing
        {
            Owner = owner,
            WantedDescription = "A winter jacket",
            Item = new Item { Owner = owner, Name = "Database textbook", Category = ItemCategory.Books, Condition = ItemCondition.Good },
        };

        var tomOffer = new SwapOffer
        {
            Listing = listing,
            OfferedBy = tom,
            OfferedItem = new Item { Owner = tom, Name = "Black jacket", Category = ItemCategory.Clothes, Condition = ItemCondition.Good },
        };

        var amyOffer = new SwapOffer
        {
            Listing = listing,
            OfferedBy = amy,
            OfferedItem = new Item { Owner = amy, Name = "Blue jacket", Category = ItemCategory.Clothes, Condition = ItemCondition.LikeNew },
        };

        db.AddRange(owner, tom, amy, listing, tomOffer, amyOffer);
        await db.SaveChangesAsync();

        return new Scenario(owner.Id, tom.Id, amy.Id, listing.Id, tomOffer.Id, amyOffer.Id);
    }

    private async Task<SwapResult> RunAsync(Func<SwapService, Task<SwapResult>> action)
    {
        await using var db = fx.CreateContext();
        return await action(new SwapService(db));
    }

    [Fact]
    public async Task Accept_ReservesListingAndBothItems_AndRejectsOtherOffers()
    {
        var s = await CreateScenarioAsync();

        var result = await RunAsync(swaps => swaps.AcceptOfferAsync(s.TomOfferId, s.OwnerId));

        Assert.True(result.Succeeded);

        await using var db = fx.CreateContext();
        var listing = await db.Listings.Include(l => l.Item).SingleAsync(l => l.Id == s.ListingId);
        var offers = await db.SwapOffers.Include(o => o.OfferedItem).Where(o => o.ListingId == s.ListingId).ToListAsync();
        var tomOffer = offers.Single(o => o.Id == s.TomOfferId);
        var amyOffer = offers.Single(o => o.Id == s.AmyOfferId);

        Assert.Equal(ListingStatus.Reserved, listing.Status);
        Assert.Equal(ItemStatus.Reserved, listing.Item.Status);
        Assert.Equal(OfferStatus.Accepted, tomOffer.Status);
        Assert.Equal(ItemStatus.Reserved, tomOffer.OfferedItem!.Status);
        Assert.Equal(OfferStatus.Rejected, amyOffer.Status);
        Assert.Equal(ItemStatus.Available, amyOffer.OfferedItem!.Status);
    }

    [Fact]
    public async Task Accept_ByAnotherStudent_IsForbidden_AndChangesNothing()
    {
        var s = await CreateScenarioAsync();

        var result = await RunAsync(swaps => swaps.AcceptOfferAsync(s.TomOfferId, s.AmyId));

        Assert.Equal(SwapError.Forbidden, result.Error);
        await using var db = fx.CreateContext();
        Assert.Equal(ListingStatus.Open, (await db.Listings.SingleAsync(l => l.Id == s.ListingId)).Status);
    }

    [Fact]
    public async Task Accept_SecondOffer_AfterOneWasAccepted_IsConflict()
    {
        var s = await CreateScenarioAsync();
        await RunAsync(swaps => swaps.AcceptOfferAsync(s.TomOfferId, s.OwnerId));

        var second = await RunAsync(swaps => swaps.AcceptOfferAsync(s.AmyOfferId, s.OwnerId));

        Assert.Equal(SwapError.Conflict, second.Error);
    }

    [Fact]
    public async Task Accept_TwoOffersAtTheSameTime_OnlyOneSucceeds()
    {
        var s = await CreateScenarioAsync();

        // Two requests on two separate connections, started together
        var results = await Task.WhenAll(
            RunAsync(swaps => swaps.AcceptOfferAsync(s.TomOfferId, s.OwnerId)),
            RunAsync(swaps => swaps.AcceptOfferAsync(s.AmyOfferId, s.OwnerId)));

        Assert.Single(results, r => r.Succeeded);
        Assert.Single(results, r => r.Error == SwapError.Conflict);

        await using var db = fx.CreateContext();
        var acceptedCount = await db.SwapOffers.CountAsync(o => o.ListingId == s.ListingId && o.Status == OfferStatus.Accepted);
        Assert.Equal(1, acceptedCount);
    }

    [Fact]
    public async Task Withdraw_AfterOfferWasAccepted_IsConflict()
    {
        var s = await CreateScenarioAsync();
        await RunAsync(swaps => swaps.AcceptOfferAsync(s.TomOfferId, s.OwnerId));

        var result = await RunAsync(swaps => swaps.WithdrawOfferAsync(s.TomOfferId, s.TomId));

        Assert.Equal(SwapError.Conflict, result.Error);
    }

    [Fact]
    public async Task Withdraw_SomeoneElsesOffer_IsForbidden()
    {
        var s = await CreateScenarioAsync();

        var result = await RunAsync(swaps => swaps.WithdrawOfferAsync(s.TomOfferId, s.AmyId));

        Assert.Equal(SwapError.Forbidden, result.Error);
    }

    [Fact]
    public async Task Reject_KeepsListingOpen_ForOtherOffers()
    {
        var s = await CreateScenarioAsync();

        var result = await RunAsync(swaps => swaps.RejectOfferAsync(s.TomOfferId, s.OwnerId));

        Assert.True(result.Succeeded);
        await using var db = fx.CreateContext();
        Assert.Equal(OfferStatus.Rejected, (await db.SwapOffers.SingleAsync(o => o.Id == s.TomOfferId)).Status);
        Assert.Equal(OfferStatus.Pending, (await db.SwapOffers.SingleAsync(o => o.Id == s.AmyOfferId)).Status);
        Assert.Equal(ListingStatus.Open, (await db.Listings.SingleAsync(l => l.Id == s.ListingId)).Status);
    }

    [Fact]
    public async Task CancelListing_WhenReserved_IsConflict()
    {
        var s = await CreateScenarioAsync();
        await RunAsync(swaps => swaps.AcceptOfferAsync(s.TomOfferId, s.OwnerId));

        var result = await RunAsync(swaps => swaps.CancelListingAsync(s.ListingId, s.OwnerId));

        Assert.Equal(SwapError.Conflict, result.Error);
    }
}

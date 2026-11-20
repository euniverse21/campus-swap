using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Swaps;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CampusSwap.Tests;

// Skills, services and experiences: no category, condition or photos, but the same swap flow as items
[Collection("Postgres")]
public class ExchangeTypeTests(PostgresFixture fx)
{
    private static Student NewStudent(string name) => new()
    {
        Email = $"{name.ToLowerInvariant()}-{Guid.NewGuid():N}@flinders.edu.au",
        DisplayName = name,
    };

    [Fact]
    public async Task Skill_IsSaved_WithoutCategoryConditionOrPhotos()
    {
        int listingId;
        await using (var db = fx.CreateContext())
        {
            var owner = NewStudent("Mina");
            var listing = new Listing
            {
                Owner = owner,
                WantedDescription = "Help with my resume",
                Item = new Item { Owner = owner, Name = "Korean conversation practice", Type = ExchangeType.Skill },
            };
            db.AddRange(owner, listing);
            await db.SaveChangesAsync();
            listingId = listing.Id;
        }

        await using var check = fx.CreateContext();
        var saved = await check.Listings.Include(l => l.Item).SingleAsync(l => l.Id == listingId);
        Assert.Equal(ExchangeType.Skill, saved.Item.Type);
        Assert.Null(saved.Item.Category);
        Assert.Null(saved.Item.Condition);
    }

    [Fact]
    public async Task PhysicalItem_WithoutCategory_IsRejectedByTheDatabase()
    {
        await using var db = fx.CreateContext();
        var owner = NewStudent("Leo");
        db.AddRange(owner, new Item { Owner = owner, Name = "Desk lamp", Type = ExchangeType.Item, Condition = ItemCondition.Good });

        // The check constraint protects the data even if something skips the API's own checks
        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        var postgresError = Assert.IsType<PostgresException>(ex.InnerException);
        Assert.Equal(PostgresErrorCodes.CheckViolation, postgresError.SqlState);
    }

    [Fact]
    public async Task ServiceOffer_OnSkillListing_CanBeAcceptedAndCompleted()
    {
        int ownerId, offererId, offerId;
        await using (var db = fx.CreateContext())
        {
            var owner = NewStudent("Mina");
            var offerer = NewStudent("Jun");
            var listing = new Listing
            {
                Owner = owner,
                WantedDescription = "Help moving a desk",
                Item = new Item { Owner = owner, Name = "Photography lesson", Type = ExchangeType.Skill },
            };
            var offer = new SwapOffer
            {
                Listing = listing,
                OfferedBy = offerer,
                Type = OfferType.Service,
                OfferedItem = new Item { Owner = offerer, Name = "Help moving", Type = ExchangeType.Service },
            };
            db.AddRange(owner, offerer, listing, offer);
            await db.SaveChangesAsync();
            (ownerId, offererId, offerId) = (owner.Id, offerer.Id, offer.Id);
        }

        await using (var db = fx.CreateContext())
            Assert.True((await new SwapService(db).AcceptOfferAsync(offerId, ownerId)).Succeeded);
        await using (var db = fx.CreateContext())
            Assert.True((await new SwapService(db).ConfirmSwapAsync(offerId, ownerId)).Succeeded);
        await using (var db = fx.CreateContext())
            Assert.True((await new SwapService(db).ConfirmSwapAsync(offerId, offererId)).Succeeded);

        await using var check = fx.CreateContext();
        var completed = await check.SwapOffers.SingleAsync(o => o.Id == offerId);
        Assert.Equal(OfferStatus.Completed, completed.Status);
    }
}

using CampusSwap.Api.Data;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Swaps;
using CampusSwap.Api.Features.Verification;
using CampusSwap.Api.Infrastructure.Http;
using CampusSwap.Api.Infrastructure.Security;
using CampusSwap.Api.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Api.Features.Listings;

[ApiController]
[Route("api/listings")]
public class ListingsController(AppDbContext db, PhotoUploader photoUploader, SwapService swaps) : ControllerBase
{
    private const int MaxPhotos = 5;
    private const long MaxRequestBytes = 30 * 1024 * 1024; // whole form

    // Create a listing: verified students only
    [Authorize]
    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ListingDetailDto>> Create([FromForm] CreateListingForm form, CancellationToken ct)
    {
        // 1) Check every photo BEFORE saving anything
        var (photos, photoError) = await photoUploader.ValidateAsync(form.Photos, MaxPhotos, ct);
        if (photos is null)
        {
            ModelState.AddModelError(nameof(form.Photos), photoError ?? "Invalid photos.");
            return ValidationProblem(ModelState);
        }
        using var validPhotos = photos;

        // 2) Save photos, then the item + listing in one database save
        var studentId = User.GetStudentId();
        var savedUrls = await photoUploader.SaveAsync(validPhotos, ct);
        try
        {
            var item = new Item
            {
                OwnerId = studentId,
                Name = form.Name.Trim(),
                Description = form.Description?.Trim() ?? string.Empty,
                Category = form.Category!.Value,
                Condition = form.Condition!.Value,
                Photos = savedUrls
                    .Select((url, index) => new ItemPhoto { Url = url, SortOrder = index })
                    .ToList(),
            };

            var listing = new Listing
            {
                Item = item,
                OwnerId = studentId,
                WantedDescription = form.WantedDescription.Trim(),
                MeetingLocation = string.IsNullOrWhiteSpace(form.MeetingLocation)
                    ? null
                    : form.MeetingLocation.Trim(),
            };

            db.Listings.Add(listing);
            await db.SaveChangesAsync(ct);

            var created = await LoadDetailAsync(listing.Id, ct);
            return CreatedAtAction(nameof(GetById), new { id = listing.Id }, created);
        }
        catch
        {
            // If the database save fails, remove the photo files we just wrote
            await photoUploader.DeleteAsync(savedUrls);
            throw;
        }
    }

    // Browse open listings (anyone). Newest first, optional category filter and name search.
    [HttpGet]
    public async Task<ActionResult<PagedResult<ListingSummaryDto>>> Browse(
        [FromQuery] ItemCategory? category,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.Listings
            .AsNoTracking()
            .Where(l => l.Status == ListingStatus.Open);

        if (category is not null)
            query = query.Where(l => l.Item.Category == category.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(l => EF.Functions.ILike(l.Item.Name, pattern));
        }

        var totalCount = await query.CountAsync(ct);

        var rows = await query
            .OrderByDescending(l => l.CreatedAt)
            .ThenByDescending(l => l.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.Item.Name,
                l.Item.Category,
                l.Item.Condition,
                l.WantedDescription,
                OwnerName = l.Owner.DisplayName,
                PhotoUrls = l.Item.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).ToList(),
                l.CreatedAt,
            })
            .ToListAsync(ct);

        var items = rows
            .Select(r => new ListingSummaryDto(
                r.Id,
                r.Name,
                r.Category.ToString(),
                r.Condition.ToString(),
                r.WantedDescription,
                r.OwnerName,
                r.PhotoUrls.Select(url => Request.ToAbsoluteUrl(url)).ToList(),
                r.CreatedAt))
            .ToList();

        return new PagedResult<ListingSummaryDto>(items, page, pageSize, totalCount);
    }

    // Everything I have listed, newest first, with offer counts and who I'm swapping with
    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<List<MyListingDto>>> Mine(CancellationToken ct)
    {
        var studentId = User.GetStudentId();

        var rows = await db.Listings
            .AsNoTracking()
            .Where(l => l.OwnerId == studentId)
            .OrderByDescending(l => l.CreatedAt)
            .ThenByDescending(l => l.Id)
            .Select(l => new
            {
                l.Id,
                l.Item.Name,
                l.Status,
                l.CreatedAt,
                PhotoUrl = l.Item.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).FirstOrDefault(),
                PendingOfferCount = l.Offers.Count(o => o.Status == OfferStatus.Pending),
                SwapPartnerName = l.Offers
                    .Where(o => o.Status == OfferStatus.Accepted || o.Status == OfferStatus.Completed)
                    .Select(o => o.OfferedBy.DisplayName)
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        return rows
            .Select(r => new MyListingDto(
                r.Id,
                r.Name,
                r.Status.ToString(),
                r.PhotoUrl is null ? null : Request.ToAbsoluteUrl(r.PhotoUrl),
                r.CreatedAt,
                r.PendingOfferCount,
                r.SwapPartnerName))
            .ToList();
    }

    // Anyone can view a listing; IsMine is true when the viewer is the owner
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ListingDetailDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await LoadDetailAsync(id, ct);
        if (dto is null)
            return NotFound();

        return dto;
    }

    // Owner cancels an open listing; pending offers on it are rejected
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
        => this.ToActionResult(await swaps.CancelListingAsync(id, User.GetStudentId(), ct));

    private async Task<ListingDetailDto?> LoadDetailAsync(int id, CancellationToken ct)
    {
        var listing = await db.Listings
            .AsNoTracking()
            .Include(l => l.Owner)
            .Include(l => l.Item).ThenInclude(i => i.Photos)
            .FirstOrDefaultAsync(l => l.Id == id, ct);

        if (listing is null)
            return null;

        var pendingOfferCount = await db.SwapOffers
            .CountAsync(o => o.ListingId == id && o.Status == OfferStatus.Pending, ct);

        var photoUrls = listing.Item.Photos
            .OrderBy(p => p.SortOrder)
            .Select(p => Request.ToAbsoluteUrl(p.Url))
            .ToList();

        return new ListingDetailDto(
            listing.Id,
            listing.Status.ToString(),
            listing.WantedDescription,
            listing.MeetingLocation,
            listing.CreatedAt,
            new StudentDto(listing.Owner.Id, listing.Owner.DisplayName),
            new ItemDto(
                listing.Item.Id,
                listing.Item.Name,
                listing.Item.Description,
                listing.Item.Category.ToString(),
                listing.Item.Condition.ToString(),
                listing.Item.Status.ToString(),
                photoUrls),
            pendingOfferCount,
            IsMine: User.TryGetStudentId() == listing.OwnerId);
    }
}

using CampusSwap.Api.Data;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Verification;
using CampusSwap.Api.Infrastructure.Security;
using CampusSwap.Api.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusSwap.Api.Features.Listings;

[ApiController]
[Route("api/listings")]
public class ListingsController(AppDbContext db, IPhotoStorage photoStorage) : ControllerBase
{
    private const int MaxPhotos = 5;
    private const long MaxPhotoBytes = 5 * 1024 * 1024;        // 5 MB per photo
    private const long MaxRequestBytes = 30 * 1024 * 1024;     // whole form

    // Create a listing: verified students only
    [Authorize]
    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ListingDetailDto>> Create([FromForm] CreateListingForm form, CancellationToken ct)
    {
        if (form.Photos.Count is 0 or > MaxPhotos)
        {
            ModelState.AddModelError(nameof(form.Photos), $"Please add between 1 and {MaxPhotos} photos.");
            return ValidationProblem(ModelState);
        }

        // 1) Check every photo BEFORE saving anything
        var photos = new List<(MemoryStream Content, string Extension)>();
        try
        {
            foreach (var photo in form.Photos)
            {
                if (photo.Length == 0 || photo.Length > MaxPhotoBytes)
                {
                    ModelState.AddModelError(nameof(form.Photos), "Each photo must be smaller than 5 MB.");
                    return ValidationProblem(ModelState);
                }

                var buffer = new MemoryStream();
                await photo.CopyToAsync(buffer, ct);
                photos.Add((buffer, string.Empty));

                var headerLength = (int)Math.Min(buffer.Length, ImageSignature.HeaderLength);
                var extension = ImageSignature.DetectExtension(buffer.GetBuffer().AsSpan(0, headerLength));
                if (extension is null)
                {
                    ModelState.AddModelError(nameof(form.Photos), "Only JPEG, PNG or WebP images are allowed.");
                    return ValidationProblem(ModelState);
                }

                buffer.Position = 0;
                photos[photos.Count - 1] = (buffer, extension);
            }

            // 2) Save photos, then the item + listing
            var studentId = User.GetStudentId();
            var savedUrls = new List<string>();
            try
            {
                foreach (var (content, extension) in photos)
                    savedUrls.Add(await photoStorage.SaveAsync(content, extension, ct));

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
                foreach (var url in savedUrls)
                    await photoStorage.DeleteAsync(url, CancellationToken.None);
                throw;
            }
        }
        finally
        {
            foreach (var (content, _) in photos)
                content.Dispose();
        }
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
    {
        var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == id, ct);
        if (listing is null)
            return NotFound();

        if (listing.OwnerId != User.GetStudentId())
            return Forbid();

        if (listing.Status != ListingStatus.Open)
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Only open listings can be cancelled.");

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        listing.Status = ListingStatus.Cancelled;
        await db.SaveChangesAsync(ct);

        await db.SwapOffers
            .Where(o => o.ListingId == id && o.Status == OfferStatus.Pending)
            .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, OfferStatus.Rejected), ct);

        await transaction.CommitAsync(ct);
        return NoContent();
    }

    private async Task<ListingDetailDto?> LoadDetailAsync(int id, CancellationToken ct)
    {
        var listing = await db.Listings
            .AsNoTracking()
            .Include(l => l.Owner)
            .Include(l => l.Item).ThenInclude(i => i.Photos)
            .FirstOrDefaultAsync(l => l.Id == id, ct);

        if (listing is null)
            return null;

        var photoUrls = listing.Item.Photos
            .OrderBy(p => p.SortOrder)
            .Select(p => ToAbsoluteUrl(p.Url))
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
            IsMine: User.TryGetStudentId() == listing.OwnerId);
    }

    // Local photos are stored as "/uploads/x.jpg"; the frontend needs the full address
    private string ToAbsoluteUrl(string url)
        => url.StartsWith('/') ? $"{Request.Scheme}://{Request.Host}{url}" : url;
}

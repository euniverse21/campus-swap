using System.ComponentModel.DataAnnotations;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Verification;

namespace CampusSwap.Api.Features.Offers;

// An item offered in exchange, sent as multipart/form-data with photos
public class CreateOfferForm
{
    [Required, MaxLength(100)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? ItemDescription { get; set; }

    [Required]
    public ItemCategory? Category { get; set; }

    [Required]
    public ItemCondition? Condition { get; set; }

    [MaxLength(1000)]
    public string? Message { get; set; }

    public List<IFormFile> Photos { get; set; } = [];
}

public record OfferedItemDto(
    int Id,
    string Name,
    string Description,
    string Category,
    string Condition,
    IReadOnlyList<string> PhotoUrls);

public record OfferDto(
    int Id,
    int ListingId,
    string Status,
    string Type,
    string? Message,
    DateTime CreatedAt,
    StudentDto OfferedBy,
    OfferedItemDto? OfferedItem,
    bool IsMine);

// Short description of the listing an offer was sent to (for "My offers")
public record ListingBriefDto(
    int Id,
    string Name,
    string? PhotoUrl,
    string Status,
    string OwnerName);

public record SentOfferDto(OfferDto Offer, ListingBriefDto Listing);

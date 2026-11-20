using System.ComponentModel.DataAnnotations;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Features.Verification;

namespace CampusSwap.Api.Features.Listings;

// Sent as multipart/form-data because it includes photo files
public class CreateListingForm
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    // Item, Skill, Service or Experience. Missing means Item (what older versions of the app send).
    public ExchangeType? Type { get; set; }

    // Required for physical items only (checked by ExchangeRules), ignored for the other types
    public ItemCategory? Category { get; set; }

    public ItemCondition? Condition { get; set; }

    [Required, MaxLength(500)]
    public string WantedDescription { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? MeetingLocation { get; set; }

    public List<IFormFile> Photos { get; set; } = [];
}

public record ItemDto(
    int Id,
    string Name,
    string Description,
    string Type,
    string? Category,
    string? Condition,
    string Status,
    IReadOnlyList<string> PhotoUrls);

public record ListingDetailDto(
    int Id,
    string Status,
    string WantedDescription,
    string? MeetingLocation,
    DateTime CreatedAt,
    StudentDto Owner,
    ItemDto Item,
    int PendingOfferCount,
    bool IsMine);

// One card in the browse grid (field names match the frontend's mock data)
public record ListingSummaryDto(
    int Id,
    string Name,
    string Type,
    string? Category,
    string? Condition,
    string WantedDescription,
    string OwnerName,
    IReadOnlyList<string> PhotoUrls,
    DateTime CreatedAt);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount);

// One row on the "My listings" page
public record MyListingDto(
    int Id,
    string Name,
    string Type,
    string Status,
    string? PhotoUrl,
    DateTime CreatedAt,
    int PendingOfferCount,
    string? SwapPartnerName);

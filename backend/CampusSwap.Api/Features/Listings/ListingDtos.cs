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

    // Nullable so that [Required] can tell "missing" apart from the first enum value
    [Required]
    public ItemCategory? Category { get; set; }

    [Required]
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
    string Category,
    string Condition,
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
    bool IsMine);

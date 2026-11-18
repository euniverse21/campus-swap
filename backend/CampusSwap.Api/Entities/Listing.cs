namespace CampusSwap.Api.Entities;

public class Listing
{
    public int Id { get; set; }

    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;

    public int OwnerId { get; set; }
    public Student Owner { get; set; } = null!;

    public string WantedDescription { get; set; } = string.Empty;
    public string? MeetingLocation { get; set; }
    public ListingStatus Status { get; set; } = ListingStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SwapOffer> Offers { get; set; } = new List<SwapOffer>();
}

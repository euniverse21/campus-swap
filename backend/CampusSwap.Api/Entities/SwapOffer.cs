namespace CampusSwap.Api.Entities;

public class SwapOffer
{
    public int Id { get; set; }

    public int ListingId { get; set; }
    public Listing Listing { get; set; } = null!;

    public int OfferedById { get; set; }
    public Student OfferedBy { get; set; } = null!;

    public OfferType Type { get; set; } = OfferType.Item;
    public int? OfferedItemId { get; set; }
    public Item? OfferedItem { get; set; }

    public string? Message { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Both confirmations set => swap is completed
    public DateTime? OwnerConfirmedAt { get; set; }
    public DateTime? OffererConfirmedAt { get; set; }

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

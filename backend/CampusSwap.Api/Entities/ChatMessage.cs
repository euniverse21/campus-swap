namespace CampusSwap.Api.Entities;

public class ChatMessage
{
    public int Id { get; set; }

    public int OfferId { get; set; }
    public SwapOffer Offer { get; set; } = null!;

    public int SenderId { get; set; }
    public Student Sender { get; set; } = null!;

    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}

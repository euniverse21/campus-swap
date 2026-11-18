namespace CampusSwap.Api.Entities;

// One-time 6-digit code sent to a university email address.
public class EmailVerification
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;     // SHA-256 of the code, never the code itself
    public DateTime ExpiresAt { get; set; }
    public int FailedAttempts { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

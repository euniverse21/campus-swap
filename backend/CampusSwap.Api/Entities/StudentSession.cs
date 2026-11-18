namespace CampusSwap.Api.Entities;

// Issued after a successful verification and kept in the browser.
// The API identifies the student by this token on each request.
public class StudentSession
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;    // SHA-256 of the session token
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

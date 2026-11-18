namespace CampusSwap.Api.Entities;

// A student who has proven they own a university email address.
// No password: identity is confirmed by a one-time code sent to the email.
public class Student
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;        // stored in lower case, never shown publicly
    public string DisplayName { get; set; } = string.Empty;  // nickname shown to other students
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastVerifiedAt { get; set; }

    public ICollection<Item> Items { get; set; } = new List<Item>();
}

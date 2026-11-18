namespace CampusSwap.Api.Features.Verification;

// Bound from the "StudentVerification" section of appsettings.json
public class StudentVerificationOptions
{
    public const string SectionName = "StudentVerification";

    public string[] AllowedEmailDomains { get; set; } = [];
    public int CodeExpiryMinutes { get; set; } = 10;
    public int MaxFailedAttempts { get; set; } = 5;
    public int SessionDays { get; set; } = 30;
}

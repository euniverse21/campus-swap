namespace CampusSwap.Api.Infrastructure.Security;

public static class RateLimitPolicies
{
    // Max 5 code requests per 15 minutes per IP address
    public const string VerificationCode = "verification-code";
}

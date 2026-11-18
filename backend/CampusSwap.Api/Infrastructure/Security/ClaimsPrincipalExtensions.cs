using System.Security.Claims;

namespace CampusSwap.Api.Infrastructure.Security;

public static class ClaimsPrincipalExtensions
{
    // Use on [Authorize] endpoints, where a student is guaranteed
    public static int GetStudentId(this ClaimsPrincipal user)
        => int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("No student id claim on the current user."));

    // Use on public endpoints: returns null for visitors who are not verified
    public static int? TryGetStudentId(this ClaimsPrincipal user)
        => int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}

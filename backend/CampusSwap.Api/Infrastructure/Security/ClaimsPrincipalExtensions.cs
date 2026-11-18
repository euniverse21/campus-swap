using System.Security.Claims;

namespace CampusSwap.Api.Infrastructure.Security;

public static class ClaimsPrincipalExtensions
{
    public static int GetStudentId(this ClaimsPrincipal user)
        => int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("No student id claim on the current user."));
}

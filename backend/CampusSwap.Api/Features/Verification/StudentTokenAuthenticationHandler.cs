using System.Security.Claims;
using System.Text.Encodings.Web;
using CampusSwap.Api.Data;
using CampusSwap.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CampusSwap.Api.Features.Verification;

// Reads "Authorization: Bearer <token>", hashes the token and looks up a valid session.
// If found, the request runs as that student, so [Authorize] works on any endpoint.
public class StudentTokenAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    AppDbContext db)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "StudentToken";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        var token = header["Bearer ".Length..].Trim();
        if (token.Length == 0)
            return AuthenticateResult.NoResult();

        var tokenHash = SecurityTokens.Hash(token);
        var session = await db.StudentSessions
            .AsNoTracking()
            .Include(s => s.Student)
            .FirstOrDefaultAsync(
                s => s.TokenHash == tokenHash && s.ExpiresAt > DateTime.UtcNow,
                Context.RequestAborted);

        if (session is null)
            return AuthenticateResult.Fail("Invalid or expired token.");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, session.StudentId.ToString()),
            new Claim(ClaimTypes.Name, session.Student.DisplayName),
        };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return AuthenticateResult.Success(ticket);
    }
}

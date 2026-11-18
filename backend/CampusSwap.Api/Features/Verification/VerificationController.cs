using CampusSwap.Api.Data;
using CampusSwap.Api.Entities;
using CampusSwap.Api.Infrastructure.Email;
using CampusSwap.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CampusSwap.Api.Features.Verification;

[ApiController]
[Route("api/verification")]
public class VerificationController(
    AppDbContext db,
    IEmailSender emailSender,
    IOptions<StudentVerificationOptions> options) : ControllerBase
{
    private readonly StudentVerificationOptions _options = options.Value;

    // Step 1: student enters their university email -> we send a 6-digit code
    [HttpPost("request-code")]
    [EnableRateLimiting(RateLimitPolicies.VerificationCode)]
    public async Task<IActionResult> RequestCode(RequestCodeRequest request, CancellationToken ct)
    {
        var email = EmailDomainPolicy.Normalize(request.Email);
        if (!EmailDomainPolicy.IsAllowed(email, _options.AllowedEmailDomains))
        {
            ModelState.AddModelError(nameof(request.Email), "Please use your university email address.");
            return ValidationProblem(ModelState);
        }

        var code = SecurityTokens.GenerateVerificationCode();
        db.EmailVerifications.Add(new EmailVerification
        {
            Email = email,
            CodeHash = SecurityTokens.Hash(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_options.CodeExpiryMinutes),
        });
        await db.SaveChangesAsync(ct);

        await emailSender.SendAsync(
            email,
            "Your Campus Swap verification code",
            $"Your verification code is {code}. It expires in {_options.CodeExpiryMinutes} minutes.",
            ct);

        return Accepted(new { message = "A verification code has been sent to your email." });
    }

    // Step 2: student enters the code -> we return a session token for this browser
    [HttpPost("confirm")]
    public async Task<ActionResult<SessionResponse>> Confirm(ConfirmCodeRequest request, CancellationToken ct)
    {
        var email = EmailDomainPolicy.Normalize(request.Email);
        var now = DateTime.UtcNow;

        // Only the most recent, unused, unexpired code counts
        var verification = await db.EmailVerifications
            .Where(v => v.Email == email && v.UsedAt == null && v.ExpiresAt > now)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (verification is null || verification.FailedAttempts >= _options.MaxFailedAttempts)
            return InvalidCode();

        if (!SecurityTokens.HashMatches(request.Code, verification.CodeHash))
        {
            verification.FailedAttempts++;
            await db.SaveChangesAsync(ct);
            return InvalidCode();
        }

        var displayName = request.DisplayName?.Trim();
        var student = await db.Students.FirstOrDefaultAsync(s => s.Email == email, ct);

        if (student is null)
        {
            // First time with this email: a nickname is required
            if (string.IsNullOrWhiteSpace(displayName))
            {
                ModelState.AddModelError(nameof(request.DisplayName), "Please choose a nickname.");
                return ValidationProblem(ModelState);
            }

            student = new Student { Email = email, DisplayName = displayName };
            db.Students.Add(student);
        }
        else if (!string.IsNullOrWhiteSpace(displayName))
        {
            student.DisplayName = displayName;
        }

        verification.UsedAt = now;
        student.LastVerifiedAt = now;

        var token = SecurityTokens.GenerateSessionToken();
        var expiresAt = now.AddDays(_options.SessionDays);
        db.StudentSessions.Add(new StudentSession
        {
            Student = student,
            TokenHash = SecurityTokens.Hash(token),
            ExpiresAt = expiresAt,
        });

        await db.SaveChangesAsync(ct);

        return Ok(new SessionResponse(token, expiresAt, new StudentDto(student.Id, student.DisplayName)));
    }

    // Who am I? (used by the frontend to check if the saved token is still valid)
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<StudentDto>> Me(CancellationToken ct)
    {
        var studentId = User.GetStudentId();
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Id == studentId, ct);
        if (student is null)
            return Unauthorized();

        return new StudentDto(student.Id, student.DisplayName);
    }

    // Sign out on this browser: delete the session so the token stops working
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var token = Request.Headers.Authorization.ToString()["Bearer ".Length..].Trim();
        var tokenHash = SecurityTokens.Hash(token);
        await db.StudentSessions.Where(s => s.TokenHash == tokenHash).ExecuteDeleteAsync(ct);
        return NoContent();
    }

    private ActionResult InvalidCode()
    {
        ModelState.AddModelError("Code", "The code is invalid or has expired. Please request a new one.");
        return ValidationProblem(ModelState);
    }
}

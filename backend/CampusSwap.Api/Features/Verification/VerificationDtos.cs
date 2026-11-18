using System.ComponentModel.DataAnnotations;

namespace CampusSwap.Api.Features.Verification;

public record RequestCodeRequest(
    [Required, EmailAddress, MaxLength(254)] string Email);

public record ConfirmCodeRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, RegularExpression(@"^\d{6}$", ErrorMessage = "The code must be 6 digits.")] string Code,
    [MaxLength(50)] string? DisplayName);

public record StudentDto(int Id, string DisplayName);

public record SessionResponse(string Token, DateTime ExpiresAt, StudentDto Student);

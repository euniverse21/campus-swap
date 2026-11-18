using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace CampusSwap.Api.Infrastructure.Security;

public static class SecurityTokens
{
    // 32 random bytes -> URL-safe string (safe to keep in localStorage and send in a header)
    public static string GenerateSessionToken()
        => Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));

    // Cryptographically random 6-digit code, e.g. "048213"
    public static string GenerateVerificationCode()
        => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    // SHA-256 as 64 lowercase hex characters; only this hash is stored in the database
    public static string Hash(string value)
        => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    // Constant-time comparison so response timing does not leak how many characters matched
    public static bool HashMatches(string value, string expectedHash)
        => CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(Hash(value)),
            Encoding.UTF8.GetBytes(expectedHash));
}

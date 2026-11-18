namespace CampusSwap.Api.Infrastructure.Storage;

// Checks the first bytes of a file ("magic numbers") to find the real image type.
// The file name and Content-Type header come from the user and can be faked; the bytes cannot.
public static class ImageSignature
{
    public const int HeaderLength = 12;

    private static ReadOnlySpan<byte> Png => new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
    private static ReadOnlySpan<byte> Riff => "RIFF"u8;
    private static ReadOnlySpan<byte> Webp => "WEBP"u8;

    // Returns ".jpg", ".png" or ".webp", or null if the bytes are not a supported image
    public static string? DetectExtension(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return ".jpg";

        if (header.Length >= 8 && header[..8].SequenceEqual(Png))
            return ".png";

        if (header.Length >= 12 && header[..4].SequenceEqual(Riff) && header[8..12].SequenceEqual(Webp))
            return ".webp";

        return null;
    }
}

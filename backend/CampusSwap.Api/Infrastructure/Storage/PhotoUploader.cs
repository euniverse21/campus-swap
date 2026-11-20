namespace CampusSwap.Api.Infrastructure.Storage;

// Photos that passed validation, held in memory until they are saved.
public sealed class ValidatedPhotos : IDisposable
{
    private readonly List<(MemoryStream Content, string Extension)> _photos;

    internal ValidatedPhotos(List<(MemoryStream Content, string Extension)> photos) => _photos = photos;

    public IReadOnlyList<(MemoryStream Content, string Extension)> Items => _photos;

    public void Dispose()
    {
        foreach (var (content, _) in _photos)
            content.Dispose();
    }
}

// Shared photo handling for listings and offers:
// validate every file first, then save, and clean up files if a later step fails.
public class PhotoUploader(IPhotoStorage storage)
{
    public const long MaxPhotoBytes = 5 * 1024 * 1024; // 5 MB per photo

    // Returns the photos, or an error message when there are too few/many files, or one is too big or not a real image.
    // minPhotos is 1 for physical items and 0 for skills, services and experiences (photos optional).
    public async Task<(ValidatedPhotos? Photos, string? Error)> ValidateAsync(
        IReadOnlyList<IFormFile> files, int minPhotos, int maxPhotos, CancellationToken ct = default)
    {
        if (files.Count < minPhotos || files.Count > maxPhotos)
            return (null, minPhotos > 0
                ? $"Please add between {minPhotos} and {maxPhotos} photos."
                : $"You can add up to {maxPhotos} photos.");

        var photos = new List<(MemoryStream Content, string Extension)>();
        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > MaxPhotoBytes)
            {
                DisposeAll(photos);
                return (null, "Each photo must be smaller than 5 MB.");
            }

            var buffer = new MemoryStream();
            await file.CopyToAsync(buffer, ct);

            var headerLength = (int)Math.Min(buffer.Length, ImageSignature.HeaderLength);
            var extension = ImageSignature.DetectExtension(buffer.GetBuffer().AsSpan(0, headerLength));
            if (extension is null)
            {
                buffer.Dispose();
                DisposeAll(photos);
                return (null, "Only JPEG, PNG or WebP images are allowed.");
            }

            buffer.Position = 0;
            photos.Add((buffer, extension));
        }

        return (new ValidatedPhotos(photos), null);
    }

    // Saves all photos and returns their URLs (in the same order).
    // If one save fails, the photos already written are removed again.
    public async Task<List<string>> SaveAsync(ValidatedPhotos photos, CancellationToken ct = default)
    {
        var urls = new List<string>();
        try
        {
            foreach (var (content, extension) in photos.Items)
                urls.Add(await storage.SaveAsync(content, extension, ct));
            return urls;
        }
        catch
        {
            await DeleteAsync(urls);
            throw;
        }
    }

    // Used when the database save fails after the files were written
    public async Task DeleteAsync(IEnumerable<string> urls)
    {
        foreach (var url in urls)
            await storage.DeleteAsync(url, CancellationToken.None);
    }

    private static void DisposeAll(List<(MemoryStream Content, string Extension)> photos)
    {
        foreach (var (content, _) in photos)
            content.Dispose();
    }
}

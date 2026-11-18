namespace CampusSwap.Api.Infrastructure.Storage;

// Where uploaded photos are kept. Local disk during development,
// Azure Blob Storage later — only the implementation changes.
public interface IPhotoStorage
{
    // Saves the photo and returns the URL to store in the database
    Task<string> SaveAsync(Stream content, string extension, CancellationToken ct = default);

    Task DeleteAsync(string url, CancellationToken ct = default);
}

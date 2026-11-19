using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace CampusSwap.Api.Infrastructure.Storage;

// Production storage: photos are uploaded to an Azure Blob Storage container
// and served straight from Azure (the API does not have to send the image bytes).
public class BlobPhotoStorage : IPhotoStorage
{
    private readonly BlobContainerClient _container;
    private readonly Lazy<Task> _ensureContainer;

    public BlobPhotoStorage(string connectionString, string containerName)
    {
        _container = new BlobContainerClient(connectionString, containerName);

        // Create the container once, the first time a photo is saved.
        // "Blob" access = anyone with a photo's URL can view it, but nobody can list the container.
        _ensureContainer = new Lazy<Task>(() => _container.CreateIfNotExistsAsync(PublicAccessType.Blob));
    }

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken ct = default)
    {
        await _ensureContainer.Value;

        var blob = _container.GetBlobClient($"{Guid.NewGuid():N}{extension}");
        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders
            {
                ContentType = ContentTypeFor(extension),
                // File names are random and never reused, so browsers may cache them for a year
                CacheControl = "public, max-age=31536000, immutable",
            },
        }, ct);

        return blob.Uri.ToString();
    }

    public async Task DeleteAsync(string url, CancellationToken ct = default)
    {
        // Only the file name part is used, so a URL cannot point outside this container
        var blobName = Path.GetFileName(new Uri(url).AbsolutePath);
        await _container.DeleteBlobIfExistsAsync(blobName, cancellationToken: ct);
    }

    private static string ContentTypeFor(string extension) => extension switch
    {
        ".jpg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        _ => "application/octet-stream",
    };
}

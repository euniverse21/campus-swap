namespace CampusSwap.Api.Infrastructure.Storage;

// Development storage: saves files to backend/CampusSwap.Api/uploads/
// and serves them at http://localhost:5066/uploads/<file>
public class LocalPhotoStorage(IWebHostEnvironment env) : IPhotoStorage
{
    public const string FolderName = "uploads";
    public const string RequestPath = "/uploads";

    public static string GetFolderPath(IWebHostEnvironment env)
        => Path.Combine(env.ContentRootPath, FolderName);

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken ct = default)
    {
        var folder = GetFolderPath(env);
        Directory.CreateDirectory(folder);

        // Never use the uploaded file name: a random name prevents overwriting and path tricks
        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using var file = File.Create(Path.Combine(folder, fileName));
        await content.CopyToAsync(file, ct);

        return $"{RequestPath}/{fileName}";
    }

    public Task DeleteAsync(string url, CancellationToken ct = default)
    {
        // GetFileName strips any "../" so only files inside the uploads folder can be deleted
        var path = Path.Combine(GetFolderPath(env), Path.GetFileName(url));
        if (File.Exists(path))
            File.Delete(path);

        return Task.CompletedTask;
    }
}

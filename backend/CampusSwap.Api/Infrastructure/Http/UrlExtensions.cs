namespace CampusSwap.Api.Infrastructure.Http;

public static class UrlExtensions
{
    // Local photos are stored as "/uploads/x.jpg"; clients need the full address
    public static string ToAbsoluteUrl(this HttpRequest request, string url)
        => url.StartsWith('/') ? $"{request.Scheme}://{request.Host}{url}" : url;
}

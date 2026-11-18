using System.Text;
using CampusSwap.Api.Infrastructure.Storage;

namespace CampusSwap.Tests;

public class ImageSignatureTests
{
    [Fact]
    public void DetectsJpeg()
    {
        byte[] header = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
        Assert.Equal(".jpg", ImageSignature.DetectExtension(header));
    }

    [Fact]
    public void DetectsPng()
    {
        byte[] header = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
        Assert.Equal(".png", ImageSignature.DetectExtension(header));
    }

    [Fact]
    public void DetectsWebp()
    {
        var header = Encoding.ASCII.GetBytes("RIFF\0\0\0\0WEBP");
        Assert.Equal(".webp", ImageSignature.DetectExtension(header));
    }

    [Fact]
    public void RejectsPdfRenamedAsJpg()
    {
        var header = Encoding.ASCII.GetBytes("%PDF-1.7\n%âãÏ");
        Assert.Null(ImageSignature.DetectExtension(header));
    }

    [Fact]
    public void RejectsTooShortFile()
    {
        byte[] header = [0xFF, 0xD8];
        Assert.Null(ImageSignature.DetectExtension(header));
    }
}

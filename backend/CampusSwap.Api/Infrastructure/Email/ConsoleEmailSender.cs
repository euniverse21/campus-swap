namespace CampusSwap.Api.Infrastructure.Email;

// Development only: prints the email to the terminal instead of sending it,
// and keeps a copy in <repo>/.dev/emails.log so codes are easy to find (that folder is git-ignored).
// Swap for a real provider (e.g. Azure Communication Services) when deploying.
public class ConsoleEmailSender(ILogger<ConsoleEmailSender> logger, IWebHostEnvironment env) : IEmailSender
{
    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        logger.LogWarning(
            "\n===== DEV EMAIL (not actually sent) =====\nTo: {To}\nSubject: {Subject}\n{Body}\n=========================================",
            to, subject, body);

        try
        {
            // Outside the project folder so "dotnet watch" does not restart on every email
            var folder = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", ".dev"));
            Directory.CreateDirectory(folder);
            var line = $"[{DateTime.UtcNow:O}] To: {to} | {subject} | {body}{Environment.NewLine}";
            await File.AppendAllTextAsync(Path.Combine(folder, "emails.log"), line, ct);
        }
        catch (IOException ex)
        {
            logger.LogDebug(ex, "Could not write the dev email log.");
        }
    }
}

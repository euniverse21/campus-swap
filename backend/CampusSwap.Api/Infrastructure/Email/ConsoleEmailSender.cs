namespace CampusSwap.Api.Infrastructure.Email;

// Development only: prints the email to the terminal instead of sending it.
// Swap for a real provider (e.g. Azure Communication Services) when deploying.
public class ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        logger.LogWarning(
            "\n===== DEV EMAIL (not actually sent) =====\nTo: {To}\nSubject: {Subject}\n{Body}\n=========================================",
            to, subject, body);
        return Task.CompletedTask;
    }
}

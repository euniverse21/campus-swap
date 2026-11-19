using System.Net;
using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Options;

namespace CampusSwap.Api.Infrastructure.Email;

// Production: sends real emails through Azure Communication Services
public class AcsEmailSender : IEmailSender
{
    private readonly EmailClient _client;
    private readonly string _senderAddress;
    private readonly ILogger<AcsEmailSender> _logger;

    public AcsEmailSender(IOptions<EmailOptions> options, ILogger<AcsEmailSender> logger)
    {
        var settings = options.Value;
        _client = new EmailClient(settings.ConnectionString
            ?? throw new InvalidOperationException("Email:ConnectionString is not set."));
        _senderAddress = settings.SenderAddress
            ?? throw new InvalidOperationException("Email:SenderAddress is not set.");
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        var html = $"<p style=\"font-family:sans-serif;font-size:16px\">{WebUtility.HtmlEncode(body)}</p>";

        // WaitUntil.Started: hand the email to Azure and return straight away; delivery continues in the background
        var operation = await _client.SendAsync(WaitUntil.Started, _senderAddress, to, subject, html, body, ct);

        // The recipient address is deliberately not logged (personal data)
        _logger.LogInformation("Email queued with Azure Communication Services (operation {OperationId})", operation.Id);
    }
}

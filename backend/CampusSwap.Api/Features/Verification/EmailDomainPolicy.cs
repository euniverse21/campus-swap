using System.Net.Mail;

namespace CampusSwap.Api.Features.Verification;

public static class EmailDomainPolicy
{
    public static string Normalize(string email) => email.Trim().ToLowerInvariant();

    // Allows "x@flinders.edu.au" and sub-domains like "x@student.flinders.edu.au",
    // but rejects look-alikes such as "x@flinders.edu.au.evil.com" or "x@notflinders.edu.au".
    public static bool IsAllowed(string email, IEnumerable<string> allowedDomains)
    {
        if (!MailAddress.TryCreate(email, out var address))
            return false;

        // Reject display-name forms like "Name <x@flinders.edu.au>"
        if (!string.Equals(address.Address, email.Trim(), StringComparison.OrdinalIgnoreCase))
            return false;

        var host = address.Host.ToLowerInvariant();
        return allowedDomains.Any(d =>
        {
            var domain = d.Trim().ToLowerInvariant();
            return host == domain || host.EndsWith("." + domain);
        });
    }
}

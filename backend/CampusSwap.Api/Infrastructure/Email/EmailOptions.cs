namespace CampusSwap.Api.Infrastructure.Email;

// Bound from the "Email" settings (set on Azure, empty during local development)
public class EmailOptions
{
    public const string SectionName = "Email";

    public string? ConnectionString { get; set; }
    public string? SenderAddress { get; set; }
}

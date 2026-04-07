namespace HarboredHope.API.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}

/// <summary>
/// Stub email service. Replace with SendGrid or SMTP in production.
/// Set SENDGRID_API_KEY in environment / Azure App Settings.
/// </summary>
public class EmailService(ILogger<EmailService> logger) : IEmailService
{
    public Task SendEmailAsync(string to, string subject, string body)
    {
        // TODO: Wire up SendGrid or Azure Communication Services
        // For now, log to console so development MFA codes are visible
        logger.LogInformation("EMAIL to {To} | Subject: {Subject} | Body: {Body}", to, subject, body);
        return Task.CompletedTask;
    }
}

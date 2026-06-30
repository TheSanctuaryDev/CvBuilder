using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace CvBuilderApi.Services;

/// <summary>
/// Envoie des emails transactionnels via l'API REST Resend.
/// Si Resend:ApiKey est absent ou vide, les appels sont ignorés (non bloquant).
/// </summary>
public class EmailService(HttpClient httpClient, IConfiguration config, ILogger<EmailService> logger)
{
    private readonly string? _apiKey   = config["Resend:ApiKey"];
    private readonly string  _from     = config["Resend:From"] ?? "TheCvBuilder <noreply@thecvbuilder.com>";
    private readonly string  _siteUrl  = config["FrontendUrl"] ?? "http://localhost:3000";

    private async Task SendAsync(string to, string subject, string html)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            logger.LogDebug("[Email] Resend:ApiKey non configuré — email ignoré : {Subject}", subject);
            return;
        }

        try
        {
            httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);

            var payload = new
            {
                from    = _from,
                to      = new[] { to },
                subject,
                html,
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var res = await httpClient.PostAsync("https://api.resend.com/emails", content);

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                logger.LogWarning("[Email] Resend error {Status} pour {Subject} : {Err}", (int)res.StatusCode, subject, err);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[Email] Erreur lors de l'envoi de '{Subject}' à {To}", subject, to);
        }
    }

    // ── Templates ────────────────────────────────────────────────────────────

    public Task SendWelcomeAsync(string to, string name) => SendAsync(
        to,
        "Bienvenue sur TheCvBuilder !",
        $"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h1 style="color:#111;font-size:24px;">Bienvenue, {name} !</h1>
          <p style="color:#555;">Votre compte TheCvBuilder est prêt. Créez votre premier CV professionnel en quelques minutes.</p>
          <a href="{_siteUrl}/cv/nouveau"
             style="display:inline-block;background:#facc15;color:#111;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
            Créer mon CV →
          </a>
          <p style="color:#999;font-size:12px;margin-top:32px;">TheCvBuilder — CV professionnels alimentés par l'IA</p>
        </div>
        """);

    public Task SendCvReadyAsync(string to, string name, string cvId) => SendAsync(
        to,
        "Votre CV est prêt !",
        $"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h1 style="color:#111;font-size:24px;">Bonjour {name},</h1>
          <p style="color:#555;">Votre CV a été généré avec succès par notre IA. Cliquez ci-dessous pour le consulter et le télécharger.</p>
          <a href="{_siteUrl}/cv/{cvId}"
             style="display:inline-block;background:#facc15;color:#111;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
            Voir mon CV →
          </a>
          <p style="color:#999;font-size:12px;margin-top:32px;">TheCvBuilder — CV professionnels alimentés par l'IA</p>
        </div>
        """);

    public Task SendPaymentConfirmedAsync(string to, string name, string cvId) => SendAsync(
        to,
        "Paiement confirmé — CV premium débloqué",
        $"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h1 style="color:#111;font-size:24px;">Merci, {name} !</h1>
          <p style="color:#555;">Votre paiement a été confirmé. Votre CV premium est maintenant débloqué et disponible en téléchargement.</p>
          <a href="{_siteUrl}/cv/{cvId}"
             style="display:inline-block;background:#facc15;color:#111;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
            Télécharger mon CV →
          </a>
          <p style="color:#999;font-size:12px;margin-top:32px;">TheCvBuilder — CV professionnels alimentés par l'IA</p>
        </div>
        """);
}

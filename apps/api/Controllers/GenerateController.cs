using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CvBuilderApi.Data;
using CvBuilderApi.Models;
using CvBuilderApi.Services;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/generate")]
[Authorize]
public class GenerateController(AppDbContext db, AiProviderResolver resolver, EmailService email) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    [HttpPost("{id:guid}")]
    public async Task Generate(Guid id, CancellationToken ct)
    {
        if (CurrentUserId is not Guid userId)
        {
            Response.StatusCode = 401;
            return;
        }

        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, ct);
        if (cv == null)
        {
            Response.StatusCode = 404;
            return;
        }

        // Récupérer les données existantes
        var existingVersion = await db.CvVersions
            .Where(v => v.CvId == id && v.VersionNum == cv.CurrentVersion)
            .FirstOrDefaultAsync(ct);

        JsonElement cvData;
        if (existingVersion?.CvData is { } raw && raw != "{}")
        {
            try { cvData = JsonSerializer.Deserialize<JsonElement>(raw); }
            catch { cvData = JsonSerializer.Deserialize<JsonElement>($"{{\"fullName\":\"{cv.Title}\"}}"); }
        }
        else
        {
            cvData = JsonSerializer.Deserialize<JsonElement>($"{{\"fullName\":\"{cv.Title}\"}}");
        }

        // Configurer SSE
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no";
        Response.Headers["Connection"] = "keep-alive";

        async Task SendEvent(string type, object data)
        {
            var json = JsonSerializer.Serialize(new { type, data });
            await Response.WriteAsync($"data: {json}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }

        try
        {
            await SendEvent("status", new { msg = "Connexion au service IA..." });

            var ai = await resolver.ResolveAsync(ct);

            await SendEvent("status", new { msg = $"Génération via {ai.ProviderName.ToUpper()}..." });

            var userPrompt = CvPromptBuilder.BuildUserPrompt(cvData, cv.TemplateKey);
            var rawResult = await ai.GenerateAsync(CvPromptBuilder.SystemPrompt, userPrompt, ct);

            await SendEvent("status", new { msg = "Analyse du résultat..." });

            // Extraire le JSON de la réponse (l'IA peut mettre des backticks)
            var jsonResult = ExtractJson(rawResult);

            // Sauvegarder la nouvelle version
            var newVersionNum = cv.CurrentVersion + 1;
            var version = await db.CvVersions
                .FirstOrDefaultAsync(v => v.CvId == id && v.VersionNum == newVersionNum, ct);

            if (version == null)
            {
                db.CvVersions.Add(new CvVersion
                {
                    CvId = id,
                    VersionNum = newVersionNum,
                    CvData = jsonResult,
                });
            }
            else
            {
                version.CvData = jsonResult;
            }

            cv.CurrentVersion = newVersionNum;
            cv.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            // Email "CV prêt" (fire-and-forget, non bloquant)
            var userEmail = User.FindFirstValue("email") ?? "";
            var profile   = await db.Profiles.FindAsync([userId], ct);
            var userName  = profile?.FullName ?? userEmail.Split('@')[0];
            if (!string.IsNullOrEmpty(userEmail))
                _ = email.SendCvReadyAsync(userEmail, userName, id.ToString());

            // Désérialiser pour renvoyer au client
            var enrichedData = JsonSerializer.Deserialize<JsonElement>(jsonResult);
            await SendEvent("done", new { cvData = enrichedData, version = newVersionNum, provider = ai.ProviderName });
        }
        catch (Exception ex)
        {
            await SendEvent("error", new { msg = ex.Message });
        }
    }

    private static string ExtractJson(string raw)
    {
        raw = raw.Trim();
        // Retirer les balises markdown ```json ... ```
        if (raw.StartsWith("```"))
        {
            var firstNewline = raw.IndexOf('\n');
            var lastFence = raw.LastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline)
                raw = raw[(firstNewline + 1)..lastFence].Trim();
        }
        // Valider que c'est du JSON
        try { JsonDocument.Parse(raw); return raw; }
        catch { throw new Exception("La réponse de l'IA n'est pas un JSON valide."); }
    }
}

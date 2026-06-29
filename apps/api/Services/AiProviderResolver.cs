using CvBuilderApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CvBuilderApi.Services;

public class AiProviderResolver(AppDbContext db, ClaudeAiService claude, GeminiAiService gemini)
{
    public async Task<IGenerativeAiService> ResolveAsync(CancellationToken ct = default)
    {
        var setting = await db.AppSettings.FindAsync(["ai_provider"], ct);
        return setting?.Value == "gemini" ? gemini : claude;
    }

    public async Task<string> GetActiveProviderNameAsync(CancellationToken ct = default)
    {
        var setting = await db.AppSettings.FindAsync(["ai_provider"], ct);
        return setting?.Value ?? "claude";
    }
}

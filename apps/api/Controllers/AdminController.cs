using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;
using CvBuilderApi.Models;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public partial class AdminController(AppDbContext db) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    [GeneratedRegex(@"^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColorRegex();

    private static readonly HashSet<string> AllowedFonts = ["serif", "sans-serif"];
    private static readonly HashSet<string> AllowedWidths = ["1", "2"];

    // Valide et sanitise les style_tokens avant stockage (prévient CSS injection dans le PDF)
    private static string? SanitizeStyleTokens(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            string SafeColor(string key, string def)
            {
                if (root.TryGetProperty(key, out var el) && HexColorRegex().IsMatch(el.GetString() ?? ""))
                    return el.GetString()!;
                return def;
            }
            string SafeEnum(string key, HashSet<string> allowed, string def)
            {
                if (root.TryGetProperty(key, out var el) && allowed.Contains(el.GetString() ?? ""))
                    return el.GetString()!;
                return def;
            }

            var sanitized = new
            {
                fontFamily   = SafeEnum("fontFamily",   AllowedFonts,   "serif"),
                nameColor    = SafeColor("nameColor",    "#111111"),
                accentColor  = SafeColor("accentColor",  "#6b7280"),
                dividerColor = SafeColor("dividerColor", "#d1d5db"),
                dividerWidth = SafeEnum("dividerWidth",  AllowedWidths,  "1"),
            };
            return System.Text.Json.JsonSerializer.Serialize(sanitized);
        }
        catch { return null; }
    }

    private async Task<bool> IsAdminAsync()
    {
        if (CurrentUserId is not Guid userId) return false;
        return await db.AdminUsers.AnyAsync(a => a.UserId == userId);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        if (!await IsAdminAsync()) return Forbid();

        var totalCvs = await db.Cvs.CountAsync();
        var totalUsers = await db.Profiles.CountAsync();
        var payments = await db.Payments.Where(p => p.Status == "success").ToListAsync();
        var premiumCvs = await db.Cvs.CountAsync(c => c.IsPremium);
        var paidCvs = await db.Cvs.CountAsync(c => c.IsPaid);
        var aiSetting = await db.AppSettings.FindAsync("ai_provider");

        return Ok(new AdminStatsDto(
            TotalCvs: totalCvs,
            TotalUsers: totalUsers,
            TotalPayments: payments.Count,
            TotalRevenueFcfa: payments.Sum(p => p.Amount),
            PremiumCvs: premiumCvs,
            PaidCvs: paidCvs,
            ActiveAiProvider: aiSetting?.Value ?? "claude"
        ));
    }

    [HttpGet("cvs")]
    public async Task<ActionResult<IEnumerable<AdminCvDto>>> GetCvs(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        if (!await IsAdminAsync()) return Forbid();

        var cvs = await db.Cvs
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(c => new AdminCvDto(
                c.Id, c.Title, c.TemplateKey, c.IsPremium,
                c.IsPaid, c.UserId, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(cvs);
    }

    [HttpGet("payments")]
    public async Task<ActionResult<IEnumerable<AdminPaymentDto>>> GetPayments(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        if (!await IsAdminAsync()) return Forbid();

        var payments = await db.Payments
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(p => new AdminPaymentDto(
                p.Id, p.CvId, p.UserId, p.Amount,
                p.Currency, p.Provider, p.Status, p.CreatedAt))
            .ToListAsync();

        return Ok(payments);
    }

    [HttpGet("templates")]
    public async Task<ActionResult<IEnumerable<TemplateDto>>> GetTemplates()
    {
        if (!await IsAdminAsync()) return Forbid();

        var templates = await db.Templates
            .OrderBy(t => t.Name)
            .Select(t => new TemplateDto(t.Id, t.Name, t.TemplateKey, t.IsPremium, t.IsActive, t.PreviewUrl, t.StyleTokens))
            .ToListAsync();

        return Ok(templates);
    }

    [HttpPost("templates/{id:guid}/preview-image")]
    public async Task<IActionResult> UploadPreviewImage(Guid id, IFormFile file)
    {
        if (!await IsAdminAsync()) return Forbid();

        var template = await db.Templates.FindAsync(id);
        if (template == null) return NotFound();

        string[] allowed = ["image/png", "image/jpeg", "image/webp"];
        if (!allowed.Contains(file.ContentType))
            return BadRequest("Format invalide. Accepté : PNG, JPEG, WEBP.");

        if (file.Length > 2 * 1024 * 1024)
            return BadRequest("Image trop grande (max 2 Mo).");

        var ext = file.ContentType switch
        {
            "image/png"  => "png",
            "image/webp" => "webp",
            _            => "jpg",
        };

        // Valider que la clé ne contient que des caractères sûrs (évite path traversal)
        if (!Regex.IsMatch(template.TemplateKey, @"^[a-z0-9\-]+$"))
            return BadRequest("Clé de template invalide.");

        var dir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "template-previews");
        Directory.CreateDirectory(dir);

        var fileName = $"{template.TemplateKey}.{ext}";
        var filePath = Path.Combine(dir, fileName);

        // Vérification canonique : le fichier doit rester dans le répertoire cible
        var canonicalDir = Path.GetFullPath(dir) + Path.DirectorySeparatorChar;
        var canonicalFile = Path.GetFullPath(filePath);
        if (!canonicalFile.StartsWith(canonicalDir, StringComparison.Ordinal))
            return BadRequest("Chemin de fichier invalide.");

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        template.PreviewUrl = $"{baseUrl}/template-previews/{fileName}";
        await db.SaveChangesAsync();

        return Ok(new { previewUrl = template.PreviewUrl });
    }

    [HttpPost("templates")]
    public async Task<ActionResult<TemplateDto>> CreateTemplate(CreateTemplateRequest req)
    {
        if (!await IsAdminAsync()) return Forbid();

        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.TemplateKey))
            return BadRequest("Name et TemplateKey sont requis.");

        var exists = await db.Templates.AnyAsync(t => t.TemplateKey == req.TemplateKey);
        if (exists) return Conflict("Un template avec cette clé existe déjà.");

        var template = new Template
        {
            Name = req.Name.Trim(),
            TemplateKey = req.TemplateKey.Trim().ToLower(),
            IsPremium = req.IsPremium,
            IsActive = true,
            PreviewUrl = req.PreviewUrl?.Trim(),
        };
        if (req.StyleTokens is { } st) template.StyleTokens = SanitizeStyleTokens(st) ?? template.StyleTokens;

        db.Templates.Add(template);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTemplates), null,
            new TemplateDto(template.Id, template.Name, template.TemplateKey,
                template.IsPremium, template.IsActive, template.PreviewUrl, template.StyleTokens));
    }

    [HttpPatch("templates/{id:guid}")]
    public async Task<IActionResult> PatchTemplate(Guid id, PatchTemplateRequest req)
    {
        if (!await IsAdminAsync()) return Forbid();

        var template = await db.Templates.FindAsync(id);
        if (template == null) return NotFound();

        if (req.IsActive.HasValue) template.IsActive = req.IsActive.Value;
        if (req.IsPremium.HasValue) template.IsPremium = req.IsPremium.Value;
        if (req.Name is { } name) template.Name = name.Trim();
        if (req.TemplateKey is { } key) template.TemplateKey = key.Trim().ToLower();
        if (req.PreviewUrl is { } url) template.PreviewUrl = url.Trim();
        if (req.StyleTokens is { } tokens) template.StyleTokens = SanitizeStyleTokens(tokens) ?? template.StyleTokens;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        if (!await IsAdminAsync()) return Forbid();

        var template = await db.Templates.FindAsync(id);
        if (template == null) return NotFound();

        var inUse = await db.Cvs.AnyAsync(c => c.TemplateKey == template.TemplateKey);
        if (inUse) return Conflict("Ce template est utilisé par au moins un CV. Désactivez-le plutôt que de le supprimer.");

        db.Templates.Remove(template);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("settings")]
    public async Task<ActionResult<Dictionary<string, string>>> GetSettings()
    {
        if (!await IsAdminAsync()) return Forbid();

        var settings = await db.AppSettings.ToListAsync();
        return Ok(settings.ToDictionary(s => s.Key, s => s.Value));
    }

    [HttpPatch("settings/{key}")]
    public async Task<IActionResult> PatchSetting(string key, PatchSettingRequest req)
    {
        if (!await IsAdminAsync()) return Forbid();

        var allowed = new[] { "ai_provider" };
        if (!allowed.Contains(key)) return BadRequest("Clé non autorisée.");

        if (key == "ai_provider" && req.Value is not ("claude" or "gemini"))
            return BadRequest("Valeur invalide. Accepté : 'claude' ou 'gemini'.");

        var setting = await db.AppSettings.FindAsync(key);
        if (setting == null)
        {
            db.AppSettings.Add(new AppSetting { Key = key, Value = req.Value, UpdatedAt = DateTime.UtcNow });
        }
        else
        {
            setting.Value = req.Value;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return NoContent();
    }
}

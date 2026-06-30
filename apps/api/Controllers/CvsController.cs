using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;
using CvBuilderApi.Models;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CvsController(AppDbContext db) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CvDto>>> GetCvs()
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        var cvs = await db.Cvs
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new CvDto(
                c.Id, c.Title, c.TemplateKey, c.IsPremium,
                c.IsPaid, c.CurrentVersion, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(cvs);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CvDetailDto>> GetCv(Guid id)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cv == null) return NotFound();

        var latestVersion = await db.CvVersions
            .Where(v => v.CvId == id && v.VersionNum == cv.CurrentVersion)
            .FirstOrDefaultAsync();

        JsonElement? cvData = null;
        if (latestVersion?.CvData is { } raw && raw != "{}")
        {
            try { cvData = JsonSerializer.Deserialize<JsonElement>(raw); }
            catch { /* CvData corrompu — on retourne null */ }
        }

        return Ok(new CvDetailDto(
            cv.Id, cv.Title, cv.TemplateKey, cv.IsPremium,
            cv.IsPaid, cv.CurrentVersion, cv.CreatedAt, cv.UpdatedAt,
            cvData));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> PatchCv(Guid id, PatchCvRequest request)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cv == null) return NotFound();

        if (request.CvData.HasValue)
        {
            var cvDataJson = request.CvData.Value.GetRawText();
            var version = await db.CvVersions
                .FirstOrDefaultAsync(v => v.CvId == id && v.VersionNum == cv.CurrentVersion);

            if (version == null)
                db.CvVersions.Add(new CvVersion { CvId = id, VersionNum = cv.CurrentVersion, CvData = cvDataJson });
            else
                version.CvData = cvDataJson;
        }

        if (request.TemplateKey is { } newKey)
            cv.TemplateKey = newKey;

        cv.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<CvDto>> CreateCv(CreateCvRequest request)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();

        // Créer le profil si inexistant (première action de l'utilisateur)
        if (!await db.Profiles.AnyAsync(p => p.Id == userId))
        {
            db.Profiles.Add(new Profile { Id = userId });
            await db.SaveChangesAsync();
        }

        var cv = new Cv
        {
            UserId = userId,
            Title = request.Title,
            TemplateKey = request.TemplateKey,
            IsPremium = request.IsPremium
        };

        db.Cvs.Add(cv);
        await db.SaveChangesAsync();

        var dto = new CvDto(
            cv.Id, cv.Title, cv.TemplateKey, cv.IsPremium,
            cv.IsPaid, cv.CurrentVersion, cv.CreatedAt, cv.UpdatedAt);

        return CreatedAtAction(nameof(GetCv), new { id = cv.Id }, dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCv(Guid id)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (cv == null) return NotFound();

        db.Cvs.Remove(cv);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<ActionResult<IEnumerable<CvVersionSummaryDto>>> GetVersions(Guid id)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        if (!await db.Cvs.AnyAsync(c => c.Id == id && c.UserId == userId)) return NotFound();

        var versions = await db.CvVersions
            .Where(v => v.CvId == id)
            .OrderByDescending(v => v.VersionNum)
            .Select(v => new CvVersionSummaryDto(v.Id, v.VersionNum, v.CreatedAt))
            .ToListAsync();

        return Ok(versions);
    }

    [HttpGet("{id:guid}/versions/{vnum:int}")]
    public async Task<ActionResult<CvVersionDetailDto>> GetVersion(Guid id, int vnum)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        if (!await db.Cvs.AnyAsync(c => c.Id == id && c.UserId == userId)) return NotFound();

        var version = await db.CvVersions
            .FirstOrDefaultAsync(v => v.CvId == id && v.VersionNum == vnum);

        if (version == null) return NotFound();

        JsonElement? cvData = null;
        if (version.CvData is { } raw && raw != "{}")
        {
            try { cvData = JsonSerializer.Deserialize<JsonElement>(raw); }
            catch { /* données corrompues */ }
        }

        return Ok(new CvVersionDetailDto(version.Id, version.VersionNum, version.CreatedAt, cvData));
    }

    [HttpPost("{id:guid}/restore/{vnum:int}")]
    public async Task<IActionResult> RestoreVersion(Guid id, int vnum)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cv == null) return NotFound();

        var targetVersion = await db.CvVersions
            .FirstOrDefaultAsync(v => v.CvId == id && v.VersionNum == vnum);
        if (targetVersion == null) return NotFound();

        // Créer une nouvelle version avec le contenu de la version cible
        var newVersionNum = cv.CurrentVersion + 1;
        db.CvVersions.Add(new CvVersion
        {
            CvId = id,
            VersionNum = newVersionNum,
            CvData = targetVersion.CvData,
            HtmlContent = targetVersion.HtmlContent,
        });

        cv.CurrentVersion = newVersionNum;
        cv.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { restoredFrom = vnum, newVersionNum });
    }
}

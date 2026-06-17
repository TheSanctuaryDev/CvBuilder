using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;
using CvBuilderApi.Models;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CvsController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CvDto>>> GetCvs()
    {
        var userId = CurrentUserId;
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
    public async Task<ActionResult<CvDto>> GetCv(Guid id)
    {
        var userId = CurrentUserId;
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (cv == null) return NotFound();

        return Ok(new CvDto(
            cv.Id, cv.Title, cv.TemplateKey, cv.IsPremium,
            cv.IsPaid, cv.CurrentVersion, cv.CreatedAt, cv.UpdatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<CvDto>> CreateCv(CreateCvRequest request)
    {
        var userId = CurrentUserId;

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
        var userId = CurrentUserId;
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (cv == null) return NotFound();

        db.Cvs.Remove(cv);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

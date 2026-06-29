using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TemplateDto>>> GetTemplates()
    {
        var templates = await db.Templates
            .Where(t => t.IsActive)
            .OrderBy(t => t.IsPremium)
            .ThenBy(t => t.Name)
            .Select(t => new TemplateDto(t.Id, t.Name, t.TemplateKey, t.IsPremium, t.IsActive))
            .ToListAsync();

        return Ok(templates);
    }
}

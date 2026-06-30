using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CvBuilderApi.Data;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController(AppDbContext db, IConfiguration config, IHttpClientFactory httpFactory) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    /// <summary>
    /// Supprime toutes les données CV de l'utilisateur (payments, cvs, cv_versions, profile)
    /// mais conserve le compte Supabase Auth.
    /// </summary>
    [HttpDelete("data")]
    public async Task<IActionResult> DeleteData()
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();

        await db.Payments.Where(p => p.UserId == userId).ExecuteDeleteAsync();
        await db.Cvs.Where(c => c.UserId == userId).ExecuteDeleteAsync(); // cascade → cv_versions
        await db.Profiles.Where(p => p.Id == userId).ExecuteDeleteAsync();

        return NoContent();
    }

    /// <summary>
    /// Supprime toutes les données ET le compte Supabase Auth.
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> DeleteAccount()
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();

        // 1. Supprimer le compte Supabase d'abord — si ça échoue, les données locales restent intactes
        var serviceRoleKey = config["Supabase:ServiceRoleKey"]
            ?? throw new InvalidOperationException("Supabase:ServiceRoleKey manquant");
        var projectRef = config["Supabase:ProjectRef"]
            ?? throw new InvalidOperationException("Supabase:ProjectRef manquant");

        var http = httpFactory.CreateClient();
        var req = new HttpRequestMessage(
            HttpMethod.Delete,
            $"https://{projectRef}.supabase.co/auth/v1/admin/users/{userId}");
        req.Headers.Add("apikey", serviceRoleKey);
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", serviceRoleKey);

        var resp = await http.SendAsync(req);

        // 404 = déjà supprimé, on considère ça comme un succès
        if (!resp.IsSuccessStatusCode && resp.StatusCode != System.Net.HttpStatusCode.NotFound)
        {
            var body = await resp.Content.ReadAsStringAsync();
            return StatusCode(502, new { error = "Échec de la suppression du compte auth.", detail = body });
        }

        // 2. Supprimer les données PostgreSQL seulement après succès Supabase
        await db.Payments.Where(p => p.UserId == userId).ExecuteDeleteAsync();
        await db.Cvs.Where(c => c.UserId == userId).ExecuteDeleteAsync();
        await db.Profiles.Where(p => p.Id == userId).ExecuteDeleteAsync();

        return NoContent();
    }
}

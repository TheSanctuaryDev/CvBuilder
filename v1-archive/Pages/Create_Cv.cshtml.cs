using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using CvBuilderApp.Data;
using CvBuilderApp.Models;
using CvBuilderApp.Services;
using Microsoft.EntityFrameworkCore;

namespace CvBuilderApp.Pages
{
    public class Create_CvModel : PageModel
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ICvGeneratorService _cvGeneratorService;
        private readonly ILogger<Create_CvModel> _logger;

        public Create_CvModel(
            AppDbContext context,
            IWebHostEnvironment environment,
            ICvGeneratorService cvGeneratorService,
            ILogger<Create_CvModel> logger)
        {
            _context = context;
            _environment = environment;
            _cvGeneratorService = cvGeneratorService;
            _logger = logger;
        }

        [BindProperty]
        public CvData CvData { get; set; } = new();

        [BindProperty]
        public IFormFile? PhotoUpload { get; set; }

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            // ✅ Supprimer les champs non requis de la validation
            ModelState.Remove("CvData.PhotoPath");
            ModelState.Remove("PhotoUpload");
            ModelState.Remove("CvData.HtmlContent");
            ModelState.Remove("CvData.SelectedTemplate");
            ModelState.Remove("CvData.Summary");
            ModelState.Remove("CvData.Email");


            // ✅ Parsing des champs raw
            string formationText = Request.Form["FormationRaw"];
            string experienceText = Request.Form["ExperienceRaw"];
            string skillsText = Request.Form["SkillsRaw"];
            string contestsText = Request.Form["ContestsWonRaw"];
            string referencesText = Request.Form["ReferencesRaw"];
            string interestsText = Request.Form["InterestsRaw"];

            if (!string.IsNullOrEmpty(formationText))
                CvData.Formation = formationText
                    .Split('\n')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();

            if (!string.IsNullOrEmpty(experienceText))
                CvData.Experience = experienceText
                    .Split('\n')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();

            if (!string.IsNullOrEmpty(skillsText))
                CvData.Skills = skillsText
                    .Split('\n')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();

            if (!string.IsNullOrEmpty(contestsText))
                CvData.ContestsWon = contestsText
                    .Split('\n')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();

            if (!string.IsNullOrEmpty(referencesText))
                CvData.References = referencesText
                    .Split('\n')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();

            if (!string.IsNullOrEmpty(interestsText))
                CvData.Interests = interestsText
                    .Split('\n')
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();

            // ✅ Nettoyage du numéro de téléphone
            // intl-tel-input envoie le format E.164 ex: +22961000000
            if (!string.IsNullOrEmpty(CvData.Phone))
                CvData.Phone = CvData.Phone.Trim();

            if (!ModelState.IsValid)
            {
                Response.StatusCode = 400;
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return Content(string.Join("\n", errors));
            }

            // ✅ Upload photo avec nettoyage en cas d'erreur
            string? uploadedFilePath = null;

            if (PhotoUpload != null)
            {
                try
                {
                    // Validation taille (max 5MB)
                    if (PhotoUpload.Length > 5 * 1024 * 1024)
                    {
                        Response.StatusCode = 400;
                        return Content("La photo ne doit pas dépasser 5MB.");
                    }

                    // Validation extension
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                    string ext = Path.GetExtension(PhotoUpload.FileName).ToLower();
                    if (!allowedExtensions.Contains(ext))
                    {
                        Response.StatusCode = 400;
                        return Content("Format de photo non supporté. Utilisez JPG, PNG ou WebP.");
                    }

                    string fileName = Guid.NewGuid().ToString() + ext;
                    string uploadsFolder = Path.Combine(_environment.WebRootPath, "img");
                    uploadedFilePath = Path.Combine(uploadsFolder, fileName);

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    using (var stream = new FileStream(uploadedFilePath, FileMode.Create))
                        await PhotoUpload.CopyToAsync(stream);

                    CvData.PhotoPath = fileName;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur upload photo pour {FullName}", CvData.FullName);
                    Response.StatusCode = 500;
                    return Content("Erreur lors de l'upload de la photo. Veuillez réessayer.");
                }
            }

            try
            {
                string category = CvData.IsPremium ? "premium" : "free";
                string templateId = string.IsNullOrEmpty(CvData.SelectedTemplate)
                    ? "_mod-1"
                    : CvData.SelectedTemplate;

                _logger.LogInformation(
                    "Génération CV démarrée — Template: {TemplateId} | Catégorie: {Category} | Client: {FullName}",
                    templateId, category, CvData.FullName);

                // ✅ Sauvegarder les données originales
                string originalFullName = CvData.FullName;
                string? originalSummary = CvData.Summary;
                List<string>? originalExperience = CvData.Experience;
                List<string>? originalFormation = CvData.Formation;
                List<string>? originalSkills = CvData.Skills;
                string? originalLanguages = CvData.Languages;
                string? originalFieldOfActivity = CvData.FieldOfActivity;
                List<string>? originalInterests = CvData.Interests;

                var generationResult = await _cvGeneratorService.GenerateCvHtmlAsync(
                    CvData, category, templateId);

                var optimized = generationResult.Data;

                // ✅ Appliquer les données optimisées par l'IA
                // en gardant les originales si l'IA renvoie vide
                CvData.FullName = !string.IsNullOrEmpty(optimized?.FullName)
                    ? optimized.FullName : originalFullName;

                CvData.Summary = !string.IsNullOrEmpty(optimized?.Summary)
                    ? optimized.Summary : originalSummary;

                CvData.Experience = optimized?.Experience?.Any() == true
                    ? optimized.Experience : originalExperience;

                CvData.Formation = optimized?.Formation?.Any() == true
                    ? optimized.Formation : originalFormation;

                CvData.Skills = optimized?.Skills?.Any() == true
                    ? optimized.Skills : originalSkills;

                CvData.Languages = !string.IsNullOrEmpty(optimized?.Languages)
                    ? optimized.Languages : originalLanguages;

                CvData.FieldOfActivity = !string.IsNullOrEmpty(optimized?.FieldOfActivity)
                    ? optimized.FieldOfActivity : originalFieldOfActivity;

                CvData.Interests = optimized?.Interests?.Any() == true
                    ? optimized.Interests : originalInterests;

                CvData.HtmlContent = generationResult.HtmlContent;
                CvData.SelectedTemplate = templateId;
                CvData.CreatedAt = DateTime.Now;

                _context.CVs.Add(CvData);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "CV généré avec succès — ID: {CvId} | Client: {FullName}",
                    CvData.Id, CvData.FullName);

                // ✅ Retourner l'URL de redirection via header
                var redirectUrl = Url.Page("/Preview", new { id = CvData.Id });
                Response.Headers["X-Redirect-Url"] = redirectUrl;
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                // ✅ Nettoyage photo si erreur après upload
                if (uploadedFilePath != null && System.IO.File.Exists(uploadedFilePath))
                {
                    try { System.IO.File.Delete(uploadedFilePath); }
                    catch { /* ignore */ }
                }

                // ✅ Log détaillé de l'erreur
                _logger.LogError(ex,
                    "Erreur génération CV — Template: {Template} | Client: {FullName}",
                    CvData.SelectedTemplate, CvData.FullName);

                var realError = ex.InnerException?.Message ?? ex.Message;
                Response.StatusCode = 500;
                return Content(realError);
            }
        }
    }
}
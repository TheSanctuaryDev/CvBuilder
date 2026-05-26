using CvBuilderApp.Data;
using CvBuilderApp.Models;
using CvBuilderApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace CvBuilderApp.Pages
{
    public class PreviewModel : PageModel
    {
        private readonly AppDbContext _context;
        private readonly PdfService _pdfService;

        public PreviewModel(AppDbContext context, PdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        public CvData? Cv { get; set; }
        public string PdfUrl { get; set; } = string.Empty;
        public bool IsPaid { get; set; } = false;
        public bool TriggerAutoDownload { get; set; } = false;

        public async Task<IActionResult> OnGetAsync(int id)
        {
            Cv = await _context.CVs.FirstOrDefaultAsync(m => m.Id == id);
            if (Cv == null) return NotFound();

            // ✅ Vérification DB en priorité, puis session en fallback
            IsPaid = Cv.IsPaid || HttpContext.Session.GetString($"IsPaid_{id}") == "true";

            if (HttpContext.Session.GetString($"AutoDownload_{id}") == "true")
            {
                TriggerAutoDownload = true;
                HttpContext.Session.Remove($"AutoDownload_{id}");
            }

            PdfUrl = Url.Page("/Preview", "RenderPdf", new { id = Cv.Id }, protocol: "https") ?? string.Empty;
            if (!string.IsNullOrEmpty(PdfUrl)) PdfUrl += "#toolbar=0&navpanes=0&scrollbar=0";

            return Page();
        }

        public async Task<IActionResult> OnGetConfirmPaymentAsync(string transactionId, int id)
        {
            var cv = await _context.CVs.FirstOrDefaultAsync(m => m.Id == id);
            if (cv == null) return NotFound();

            // ✅ Stocker le paiement en DB — persistant même après expiration de session
            cv.IsPaid = true;
            cv.PaidAt = DateTime.UtcNow;
            cv.TransactionId = transactionId;
            await _context.SaveChangesAsync();

            // Garder aussi la session pour l'auto-download
            HttpContext.Session.SetString($"IsPaid_{id}", "true");
            HttpContext.Session.SetString($"AutoDownload_{id}", "true");

            return RedirectToPage(new { id = id });
        }

        /// <summary>
        /// Preview du CV :
        /// - CV gratuit → PDF propre sans filigrane
        /// - CV premium non payé → PDF avec filigrane
        /// - CV premium payé → PDF propre sans filigrane
        /// </summary>
        public async Task<IActionResult> OnGetRenderPdfAsync(int id)
        {
            var cv = await _context.CVs.FirstOrDefaultAsync(m => m.Id == id);
            if (cv == null || string.IsNullOrEmpty(cv.HtmlContent)) return NotFound();

            try
            {
                string htmlToRender = ProcessHtmlImages(cv.HtmlContent);

                // ✅ Vérification DB en priorité, puis session en fallback
                bool isPaid = cv.IsPaid || HttpContext.Session.GetString($"IsPaid_{id}") == "true";
                bool avecFiligrane = cv.IsPremium && !isPaid;

                if (avecFiligrane)
                    htmlToRender = AjouterFiligrane(htmlToRender);

                var pdfBytes = await _pdfService.GeneratePdfFromHtmlAsync(htmlToRender);
                return File(pdfBytes, "application/pdf");
            }
            catch (Exception ex)
            {
                return Content("Erreur lors de la génération : " + ex.Message);
            }
        }

        /// <summary>
        /// Téléchargement protégé — PDF propre sans filigrane.
        /// Bloqué côté serveur si CV premium non payé.
        /// </summary>
        public async Task<IActionResult> OnGetDownloadPdfAsync(int id)
        {
            var cv = await _context.CVs.FirstOrDefaultAsync(m => m.Id == id);
            if (cv == null || string.IsNullOrEmpty(cv.HtmlContent)) return NotFound();

            // ✅ Vérification stricte : DB en priorité, puis session en fallback
            if (cv.IsPremium)
            {
                bool alreadyPaid = cv.IsPaid || HttpContext.Session.GetString($"IsPaid_{id}") == "true";
                if (!alreadyPaid)
                    return RedirectToPage(new { id = id });
            }

            try
            {
                string htmlFinal = ProcessHtmlImages(cv.HtmlContent);
                var pdfBytes = await _pdfService.GeneratePdfFromHtmlAsync(htmlFinal);
                string fileName = $"CV_{cv.FullName.Replace(" ", "_")}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return Content("Erreur lors de la génération : " + ex.Message);
            }
        }

        private string AjouterFiligrane(string html)
        {
            string filigrane = @"
            <div style='
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999;
                pointer-events: none;
                overflow: hidden;
            '>
                <div style='
                    position: absolute;
                    top: 30%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 72px;
                    font-weight: 900;
                    color: rgba(0, 0, 0, 0.15);
                    white-space: nowrap;
                    font-family: Arial, sans-serif;
                    letter-spacing: 4px;
                    user-select: none;
                '>CV Premium Non Payé</div>

                <div style='
                    position: absolute;
                    top: 8%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 48px;
                    font-weight: 900;
                    color: rgba(0, 0, 0, 0.15);
                    white-space: nowrap;
                    font-family: Arial, sans-serif;
                    letter-spacing: 4px;
                    user-select: none;
                '>Thebuildercv.site</div>

                <div style='
                    position: absolute;
                    top: 70%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 48px;
                    font-weight: 900;
                    color: rgba(0, 0, 0, 0.15);
                    white-space: nowrap;
                    font-family: Arial, sans-serif;
                    letter-spacing: 4px;
                    user-select: none;
                '>CV Premium Non Payé</div>
            </div>";

            return html.Replace("</body>", filigrane + "</body>");
        }

        private string ProcessHtmlImages(string html)
        {
            string webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var imgRegex = new Regex("<img.+?src=[\"'](.+?)[\"'].*?>", RegexOptions.IgnoreCase);
            html = imgRegex.Replace(html, m =>
            {
                string src = m.Groups[1].Value;
                return m.Value.Replace(src, GetBase64FromLocalPath(src, webRootPath));
            });

            var styleRegex = new Regex("url\\([\"']?(.+?)[\"']?\\)", RegexOptions.IgnoreCase);
            html = styleRegex.Replace(html, m =>
            {
                string src = m.Groups[1].Value;
                return $"url('{GetBase64FromLocalPath(src, webRootPath)}')";
            });

            return html;
        }

        private string GetBase64FromLocalPath(string src, string webRootPath)
        {
            try
            {
                if (src.StartsWith("/"))
                {
                    string filePath = Path.Combine(webRootPath, src.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        byte[] imageBytes = System.IO.File.ReadAllBytes(filePath);
                        string ext = Path.GetExtension(filePath).Replace(".", "").ToLower();
                        return $"data:image/{(ext == "jpg" ? "jpeg" : ext)};base64,{Convert.ToBase64String(imageBytes)}";
                    }
                }
            }
            catch { }
            return src;
        }
    }
}
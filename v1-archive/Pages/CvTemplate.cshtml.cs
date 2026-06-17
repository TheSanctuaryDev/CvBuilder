using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Collections.Generic;
using CvBuilderApp.Models;

namespace CvBuilderApp.Pages
{
    public class CvTemplateModel : PageModel
    {
        // La liste qui sera affichée dans  vue Razor (.cshtml)
        public List<CvTemplate> TemplatesList { get; set; } = new();

        public void OnGet()
        {
            // On initialise la liste des templates disponibles.
            // Note : Ces TemplateKey doivent correspondre aux noms de tes dossiers dans /Templates
            TemplatesList = new List<CvTemplate>
            {
                //  --- TEMPLATES PREMIUM ---   
                new CvTemplate
                {
                    Name = "Recruiter Friendly",
                    TemplateKey = "_mod-13",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-13/preview.jpg"
                },
                // --- TEMPLATES GRATUITS ---
                new CvTemplate
                {
                    Name = "Modern Clean",
                    TemplateKey = "_mod-1", // Correspond à ton dossier /Templates/free/_mod-1
                    IsPremium = false,
                    PreviewImage = "/templates/free/_mod-1/preview.jpg"
                },
               
                 new CvTemplate
                {
                    Name = "Mini",
                    TemplateKey = "_mod-9",
                    IsPremium = false,
                    PreviewImage = "/templates/free/_mod-9/preview.jpg"
                },

                // --- TEMPLATES PREMIUM ---
                new CvTemplate
                {
                    Name = "Executive Corporate pink",
                    TemplateKey = "_mod-1", // Correspond à ton dossier /Templates/premium/_corp-1
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-1/preview.jpg"
                },
                  new CvTemplate
                {
                    Name = "Optimal Corporate Etudiant",
                    TemplateKey = "_mod-7",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-7/preview.jpg"
                },
                  new CvTemplate
                {
                    Name = "ATS Optimized",
                    TemplateKey = "_mod-14",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-14/preview.jpg"
                },
                new CvTemplate
                {
                    Name = "Creative Chocolate",
                    TemplateKey = "_mod-2",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-2/preview.jpg"
                },
                 new CvTemplate
                {
                    Name = "Creative Dark",
                    TemplateKey = "_mod-3",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-3/preview.jpg"
                },
                   new CvTemplate
                {
                    Name = "Optimal Corporate Stage",
                    TemplateKey = "_mod-6",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-6/preview.jpg"
                },
                   new CvTemplate
                {
                    Name = "Optimal Corporate Senior",
                    TemplateKey = "_mod-4",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-4/preview.jpg"
                },
                  new CvTemplate
                {
                    Name = "Executive Corporate Aera ",
                    TemplateKey = "_mod-8",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-8/preview.jpg"
                },
                   new CvTemplate
                {
                    Name = "Modern Minimal",
                    TemplateKey = "_mod-12",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-12/preview.jpg"
                },
                new CvTemplate
                {
                    Name = "Professional Executive Corporate",
                    TemplateKey = "_mod-22",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-22/preview.jpg"
                },
                 new CvTemplate
                {
                    Name = "Optimal Corporate",
                    TemplateKey = "_mod-5",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-5/preview.jpg"
                },
                 new CvTemplate
                {
                    Name = "95% ATS Optimized",
                    TemplateKey = "_mod-15",
                    IsPremium = true,
                    PreviewImage = "/templates/premium/_mod-15/preview.jpg"
                }
            };
        }
    }
}
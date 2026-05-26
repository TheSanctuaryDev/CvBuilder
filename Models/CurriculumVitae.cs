using System.ComponentModel.DataAnnotations;
namespace CvBuilderApp.Models
{
    public class CurriculumVitae
    {
        [Key]
        public int Id { get; set; }

        // Meta data
        public string SelectedTemplate { get; set; } // Récupéré du LocalStorage au moment du submit
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // STEP 1: Personal Info
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? LinkedIn { get; set; }
        public string? GitHub { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }

        // STEP 2: Profile
        public string? Summary { get; set; }
        public string? FieldOfActivity { get; set; } // Domaine
        public string? PhotoPath { get; set; } // On stocke le chemin de l'image, pas l'image elle-même

        // STEP 3: Experience
        public List<string>? Experience { get; set; } = new();

        // STEP 4: Formation
        public List<string>? Formation { get; set; } = new();
        public string? Languages { get; set; }

        // STEP 5: Skills & More
        public List<string>? Skills { get; set; } = new();
        public List<string>? ContestsWon { get; set; } = new();
        public List<string>? References { get; set; } = new();
        public List<string>? Interests { get; set; } = new();

        // Paiement
        public bool IsPremium { get; set; } = false;
        public string? AiOptimizedSummary { get; set; }
        public string? AiOptimizedExperience { get; set; }
        public string? AiOptimizedSkills { get; set; }
        // Indique si l'IA a fini son travail
        public bool IsProcessingDone { get; set; } = false;
    }
}

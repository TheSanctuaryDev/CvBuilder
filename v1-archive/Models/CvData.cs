using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using CvBuilderApp.Models;

namespace CvBuilderApp.Models
{
    public class CvData
    {
        [Key]
        public int Id { get; set; }

        // --- Personal Info & Meta ---
        [Required(ErrorMessage = "Le nom complet est obligatoire.")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string FullName { get; set; }

       
        [EmailAddress(ErrorMessage = "Format d'email invalide.")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? Email { get; set; }

        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? LinkedIn { get; set; }

        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? GitHub { get; set; }

        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? Phone { get; set; }

        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? Address { get; set; }

        // --- Profile ---
        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? Summary { get; set; }

        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? FieldOfActivity { get; set; }

        public string? PhotoPath { get; set; }

        public bool IsPaid { get; set; } = false;
        public DateTime? PaidAt { get; set; }

        [Column(TypeName = "nvarchar(MAX)")]
        public string? TransactionId { get; set; }

        // --- Core Content ---
        [Required(ErrorMessage = "L'expérience professionnelle est obligatoire.")]
        [JsonConverter(typeof(FlexibleStringListConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public List<string>? Experience { get; set; } = new();

        [JsonConverter(typeof(FlexibleStringListConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public List<string>? Formation { get; set; } = new();

        [JsonConverter(typeof(FlexibleStringConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public string? Languages { get; set; }

        // --- Skills & More ---
        [JsonConverter(typeof(FlexibleStringListConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public List<string>? Skills { get; set; } = new();

        [JsonConverter(typeof(FlexibleStringListConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public List<string>? ContestsWon { get; set; } = new();

        [JsonConverter(typeof(FlexibleStringListConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public List<string>? References { get; set; } = new();

        [JsonConverter(typeof(FlexibleStringListConverter))]
        [Column(TypeName = "nvarchar(MAX)")]
        public List<string>? Interests { get; set; } = new();

        // --- Logic & Rendering ---
        [Column(TypeName = "nvarchar(MAX)")]
        public string? SelectedTemplate { get; set; }

        public bool IsPremium { get; set; }

        // ✅ Champ critique — HTML généré par Gemini (peut être très volumineux)
        [Column(TypeName = "nvarchar(MAX)")]
        public string? HtmlContent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
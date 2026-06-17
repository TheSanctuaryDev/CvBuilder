// Models/TemplateBlueprintCache.cs
namespace CvBuilderApp.Models
{
    public class TemplateBlueprintCache
    {
        public int Id { get; set; }
        public string TemplateKey { get; set; } = string.Empty; 
        public string BlueprintJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
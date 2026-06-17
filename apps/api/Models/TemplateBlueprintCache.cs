namespace CvBuilderApi.Models;

public class TemplateBlueprintCache
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TemplateKey { get; set; } = string.Empty;
    public string Blueprint { get; set; } = "{}";  // JSONB
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

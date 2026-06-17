namespace CvBuilderApi.Models;

public class Template
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string TemplateKey { get; set; } = string.Empty;
    public bool IsPremium { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public string? PreviewUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

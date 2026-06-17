namespace CvBuilderApi.Models;

public class CvVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CvId { get; set; }
    public int VersionNum { get; set; }
    public string CvData { get; set; } = "{}";  // JSONB stocké en string
    public string? HtmlContent { get; set; }
    public string? PhotoPath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cv? Cv { get; set; }
}

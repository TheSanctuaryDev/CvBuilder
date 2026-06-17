namespace CvBuilderApi.Models;

public class Cv
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = "Mon CV";
    public string TemplateKey { get; set; } = string.Empty;
    public bool IsPremium { get; set; } = false;
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }
    public string? TransactionId { get; set; }
    public int CurrentVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Profile? User { get; set; }
    public ICollection<CvVersion> Versions { get; set; } = new List<CvVersion>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

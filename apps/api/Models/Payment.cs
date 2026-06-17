namespace CvBuilderApi.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CvId { get; set; }
    public Guid UserId { get; set; }
    public int Amount { get; set; } = 2000;
    public string Currency { get; set; } = "XOF";
    public string Provider { get; set; } = string.Empty;  // "stripe" | "fedapay"
    public string? ProviderTxId { get; set; }
    public string Status { get; set; } = "pending";  // "pending" | "success" | "failed"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cv? Cv { get; set; }
    public Profile? User { get; set; }
}

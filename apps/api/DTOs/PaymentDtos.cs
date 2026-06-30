namespace CvBuilderApi.DTOs;

public record InitPaymentRequest(Guid CvId);

public record InitPaymentResponse(string PaymentUrl, Guid PaymentId);

// FedaPay utilise "name" pour le type d'événement (ex: "transaction.approved")
// mais certaines versions peuvent utiliser "type" — on supporte les deux.
public record FedaPayWebhookEvent(
    string Id,
    string? Name,
    string? Type,
    FedaPayWebhookData Data
)
{
    public string EventType => Name ?? Type ?? string.Empty;
};

public record FedaPayWebhookData(FedaPayWebhookTransaction Object);

public record FedaPayWebhookTransaction(
    long Id,
    string Reference,
    string Status,
    int Amount
);

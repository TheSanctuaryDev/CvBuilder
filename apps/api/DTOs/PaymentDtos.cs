namespace CvBuilderApi.DTOs;

public record InitPaymentRequest(Guid CvId);

public record InitPaymentResponse(string PaymentUrl, Guid PaymentId);

public record FedaPayWebhookEvent(
    string Id,
    string Type,
    FedaPayWebhookData Data
);

public record FedaPayWebhookData(FedaPayWebhookTransaction Object);

public record FedaPayWebhookTransaction(
    long Id,
    string Reference,
    string Status,
    int Amount
);

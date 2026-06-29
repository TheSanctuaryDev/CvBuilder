namespace CvBuilderApi.DTOs;

public record AdminStatsDto(
    int TotalCvs,
    int TotalUsers,
    int TotalPayments,
    int TotalRevenueFcfa,
    int PremiumCvs,
    int PaidCvs,
    string ActiveAiProvider
);

public record AdminCvDto(
    Guid Id,
    string Title,
    string TemplateKey,
    bool IsPremium,
    bool IsPaid,
    Guid UserId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record AdminPaymentDto(
    Guid Id,
    Guid CvId,
    Guid UserId,
    int Amount,
    string Currency,
    string Provider,
    string Status,
    DateTime CreatedAt
);

public record PatchTemplateRequest(bool? IsActive, bool? IsPremium, string? Name);

public record PatchSettingRequest(string Value);

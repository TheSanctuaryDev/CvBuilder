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

public record CreateTemplateRequest(string Name, string TemplateKey, bool IsPremium, string? PreviewUrl, string? StyleTokens);

public record PatchTemplateRequest(bool? IsActive, bool? IsPremium, string? Name, string? TemplateKey, string? PreviewUrl, string? StyleTokens);

public record PatchSettingRequest(string Value);

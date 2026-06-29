namespace CvBuilderApi.DTOs;

public record TemplateDto(
    Guid Id,
    string Name,
    string TemplateKey,
    bool IsPremium,
    bool IsActive,
    string? PreviewUrl,
    string StyleTokens
);

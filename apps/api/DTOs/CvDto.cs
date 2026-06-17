namespace CvBuilderApi.DTOs;

public record CvDto(
    Guid Id,
    string Title,
    string TemplateKey,
    bool IsPremium,
    bool IsPaid,
    int CurrentVersion,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

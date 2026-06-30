using System.Text.Json;

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

public record CvDetailDto(
    Guid Id,
    string Title,
    string TemplateKey,
    bool IsPremium,
    bool IsPaid,
    int CurrentVersion,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    JsonElement? CvData
);

public record CvVersionSummaryDto(
    Guid Id,
    int VersionNum,
    DateTime CreatedAt
);

public record CvVersionDetailDto(
    Guid Id,
    int VersionNum,
    DateTime CreatedAt,
    JsonElement? CvData
);

using System.ComponentModel.DataAnnotations;

namespace CvBuilderApi.DTOs;

public record CreateCvRequest(
    [Required] string Title,
    [Required] string TemplateKey,
    bool IsPremium
);

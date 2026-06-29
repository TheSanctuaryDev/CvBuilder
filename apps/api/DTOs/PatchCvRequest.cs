using System.Text.Json;

namespace CvBuilderApi.DTOs;

public record PatchCvRequest(JsonElement CvData);

namespace CvBuilderApi.Services;

public interface IGenerativeAiService
{
    string ProviderName { get; }
    Task<string> GenerateAsync(string systemPrompt, string userPrompt, CancellationToken ct = default);
}

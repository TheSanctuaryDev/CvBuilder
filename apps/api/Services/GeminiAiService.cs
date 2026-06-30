using System.Text;
using System.Text.Json;

namespace CvBuilderApi.Services;

public class GeminiAiService(IHttpClientFactory httpFactory, IConfiguration config) : IGenerativeAiService
{
    public string ProviderName => "gemini";

    public async Task<string> GenerateAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        var apiKey = config["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini:ApiKey manquant");

        var http = httpFactory.CreateClient();
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";

        var body = JsonSerializer.Serialize(new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[] { new { role = "user", parts = new[] { new { text = userPrompt } } } },
            generationConfig = new { maxOutputTokens = 4096, temperature = 0.7 }
        });

        var req = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        var resp = await http.SendAsync(req, ct);
        var json = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
            throw new Exception($"Gemini API error {resp.StatusCode}: {json}");

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }
}

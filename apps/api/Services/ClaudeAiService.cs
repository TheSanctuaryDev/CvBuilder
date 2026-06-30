using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace CvBuilderApi.Services;

public class ClaudeAiService(IHttpClientFactory httpFactory, IConfiguration config) : IGenerativeAiService
{
    public string ProviderName => "claude";

    public async Task<string> GenerateAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        var apiKey = config["Claude:ApiKey"]
            ?? throw new InvalidOperationException("Claude:ApiKey manquant");

        var http = httpFactory.CreateClient();
        http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var body = JsonSerializer.Serialize(new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 4096,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userPrompt } }
        });

        var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        var resp = await http.SendAsync(req, ct);
        var json = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
            throw new Exception($"Claude API error {resp.StatusCode}: {json}");

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }
}

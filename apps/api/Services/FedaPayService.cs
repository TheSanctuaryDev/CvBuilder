using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CvBuilderApi.Services;

public class FedaPayTransactionResult
{
    public long Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class FedaPayTokenResult
{
    public string Token { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class FedaPayService(HttpClient httpClient, IConfiguration config)
{
    private readonly string _secretKey = config["FedaPay:SecretKey"] ?? throw new InvalidOperationException("FedaPay:SecretKey manquant");
    private readonly string _environment = config["FedaPay:Environment"] ?? "sandbox";

    private string BaseUrl => _environment == "live"
        ? "https://api.fedapay.com/v1"
        : "https://sandbox-api.fedapay.com/v1";

    private void SetAuthHeader() =>
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _secretKey);

    public async Task<FedaPayTransactionResult> CreateTransactionAsync(
        int amount, string description, string callbackUrl, string? customerEmail = null)
    {
        SetAuthHeader();

        var body = new Dictionary<string, object>
        {
            ["description"] = description,
            ["amount"] = amount,
            ["currency"] = new { iso = "XOF" },
            ["callback_url"] = callbackUrl,
        };

        if (!string.IsNullOrEmpty(customerEmail))
            body["customer"] = new { email = customerEmail };

        var content = new StringContent(
            JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync($"{BaseUrl}/transactions", content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        // FedaPay wraps the object under "v1/transaction" or "transaction"
        JsonElement tx;
        if (doc.RootElement.TryGetProperty("v1/transaction", out tx) ||
            doc.RootElement.TryGetProperty("transaction", out tx))
        {
            // found
        }
        else
        {
            tx = doc.RootElement; // fallback: response is the object itself
        }

        return new FedaPayTransactionResult
        {
            Id = tx.GetProperty("id").GetInt64(),
            Reference = tx.TryGetProperty("reference", out var refProp) ? refProp.GetString() ?? string.Empty : string.Empty,
            Status = tx.TryGetProperty("status", out var statusProp) ? statusProp.GetString() ?? string.Empty : string.Empty,
        };
    }

    public async Task<FedaPayTokenResult> GetPaymentUrlAsync(long transactionId)
    {
        SetAuthHeader();

        var response = await httpClient.PostAsync(
            $"{BaseUrl}/transactions/{transactionId}/token",
            new StringContent("{}", Encoding.UTF8, "application/json"));
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        return new FedaPayTokenResult
        {
            Token = doc.RootElement.GetProperty("token").GetString() ?? string.Empty,
            Url = doc.RootElement.GetProperty("url").GetString() ?? string.Empty,
        };
    }
}

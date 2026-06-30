using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;
using CvBuilderApi.Models;
using CvBuilderApi.Services;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(AppDbContext db, FedaPayService fedaPay, IConfiguration config) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var value = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    [HttpPost("init")]
    [Authorize]
    public async Task<ActionResult<InitPaymentResponse>> InitPayment(InitPaymentRequest request)
    {
        if (CurrentUserId is not Guid userId) return Unauthorized();

        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == request.CvId && c.UserId == userId);
        if (cv == null) return NotFound();
        if (!cv.IsPremium) return BadRequest("Ce CV n'est pas premium.");
        if (cv.IsPaid) return BadRequest("Ce CV est déjà payé.");

        var frontendUrl = config["FrontendUrl"] ?? "http://localhost:3000";
        var callbackUrl = $"{frontendUrl}/cv/{cv.Id}?payment=success";

        FedaPayTransactionResult tx;
        FedaPayTokenResult tokenResult;

        try
        {
            tx = await fedaPay.CreateTransactionAsync(2000, "CV Premium TheCvBuilder", callbackUrl);
            tokenResult = await fedaPay.GetPaymentUrlAsync(tx.Id);
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = "Erreur FedaPay", detail = ex.Message });
        }

        var payment = new Payment
        {
            CvId = cv.Id,
            UserId = userId,
            Amount = 2000,
            Currency = "XOF",
            Provider = "fedapay",
            ProviderTxId = tx.Id.ToString(),
            Status = "pending",
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        return Ok(new InitPaymentResponse(tokenResult.Url, payment.Id));
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        var webhookSecret = config["FedaPay:WebhookSecret"]
            ?? throw new InvalidOperationException("FedaPay:WebhookSecret non configuré");

        // Lire le body brut pour vérification de signature
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync();

        var signature = Request.Headers["X-FEDAPAY-SIGNATURE"].FirstOrDefault();
        if (string.IsNullOrEmpty(signature) || !VerifySignature(rawBody, signature, webhookSecret))
            return Unauthorized();

        FedaPayWebhookEvent? evt;
        try
        {
            evt = JsonSerializer.Deserialize<FedaPayWebhookEvent>(rawBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return BadRequest();
        }

        if (evt == null) return BadRequest();

        if (evt.Type == "transaction.approved")
        {
            var txId = evt.Data.Object.Id.ToString();
            var payment = await db.Payments
                .Include(p => p.Cv)
                .FirstOrDefaultAsync(p => p.ProviderTxId == txId && p.Status == "pending");

            if (payment != null)
            {
                payment.Status = "success";

                if (payment.Cv != null)
                {
                    payment.Cv.IsPaid = true;
                    payment.Cv.PaidAt = DateTime.UtcNow;
                    payment.Cv.TransactionId = txId;
                }

                await db.SaveChangesAsync();
            }
        }
        else if (evt.Type == "transaction.canceled" || evt.Type == "transaction.declined")
        {
            var txId = evt.Data.Object.Id.ToString();
            var payment = await db.Payments
                .FirstOrDefaultAsync(p => p.ProviderTxId == txId && p.Status == "pending");

            if (payment != null)
            {
                payment.Status = "failed";
                await db.SaveChangesAsync();
            }
        }

        return Ok();
    }

    private static bool VerifySignature(string payload, string signatureHeader, string secret)
    {
        // Format: t=timestamp,v1=hmac_hex
        var parts = signatureHeader.Split(',');
        string? timestamp = null;
        string? v1 = null;

        foreach (var part in parts)
        {
            if (part.StartsWith("t=")) timestamp = part[2..];
            if (part.StartsWith("v1=")) v1 = part[3..];
        }

        if (timestamp == null || v1 == null) return false;

        // BUG-11 : fenêtre anti-replay réduite à 60s (300s était trop large)
        if (!long.TryParse(timestamp, out var ts)) return false;
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(now - ts) > 60) return false;

        var signedPayload = $"{timestamp}.{payload}";
        var key = Encoding.UTF8.GetBytes(secret);
        var data = Encoding.UTF8.GetBytes(signedPayload);

        var expectedHex = Convert.ToHexString(
            HMACSHA256.HashData(key, data)).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedHex),
            Encoding.UTF8.GetBytes(v1.ToLowerInvariant()));
    }
}

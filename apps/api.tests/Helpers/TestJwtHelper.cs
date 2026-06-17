using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace CvBuilderApi.Tests.Helpers;

public static class TestJwtHelper
{
    private const string TestSecret = "test-secret-key-at-least-32-characters-long!!";

    public static string GenerateToken(Guid userId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "https://test.supabase.co/auth/v1",
            audience: "authenticated",
            claims: new[] { new Claim("sub", userId.ToString()) },
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

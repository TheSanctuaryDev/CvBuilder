using System.Net;
using System.Net.Http.Json;
using CvBuilderApi.DTOs;
using CvBuilderApi.Tests.Helpers;
using FluentAssertions;

namespace CvBuilderApi.Tests.Controllers;

public class CvsControllerTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetCvs_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/cvs");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCvs_WithValidAuth_ReturnsOwnCvsOnly()
    {
        // Arrange : authentifier avec un faux token de test
        var userId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", TestJwtHelper.GenerateToken(userId));

        // Act
        var response = await _client.GetAsync("/api/cvs");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cvs = await response.Content.ReadFromJsonAsync<CvDto[]>();
        cvs.Should().NotBeNull().And.BeEmpty();  // Nouveau user = 0 CVs
    }

    [Fact]
    public async Task CreateCv_WithValidAuth_ReturnsCv()
    {
        var userId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", TestJwtHelper.GenerateToken(userId));

        var request = new CreateCvRequest("Mon CV Dev", "free/_mod-1", false);
        var response = await _client.PostAsJsonAsync("/api/cvs", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var cv = await response.Content.ReadFromJsonAsync<CvDto>();
        cv.Should().NotBeNull();
        cv!.Title.Should().Be("Mon CV Dev");
        cv.TemplateKey.Should().Be("free/_mod-1");
    }

    [Fact]
    public async Task GetCv_OtherUsersCv_Returns404()
    {
        // Arrange: User A creates a CV
        var userA = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", TestJwtHelper.GenerateToken(userA));

        var request = new CreateCvRequest("User A CV", "free/_mod-1", false);
        var createResponse = await _client.PostAsJsonAsync("/api/cvs", request);
        var cvDto = await createResponse.Content.ReadFromJsonAsync<CvDto>();
        var cvId = cvDto!.Id;

        // Act: User B tries to access User A's CV
        var userB = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", TestJwtHelper.GenerateToken(userB));

        var response = await _client.GetAsync($"/api/cvs/{cvId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteCv_ValidAuth_Returns204()
    {
        // Arrange: Create a CV
        var userId = Guid.NewGuid();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", TestJwtHelper.GenerateToken(userId));

        var request = new CreateCvRequest("CV to Delete", "free/_mod-1", false);
        var createResponse = await _client.PostAsJsonAsync("/api/cvs", request);
        var cvDto = await createResponse.Content.ReadFromJsonAsync<CvDto>();
        var cvId = cvDto!.Id;

        // Act: Delete the CV
        var response = await _client.DeleteAsync($"/api/cvs/{cvId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}

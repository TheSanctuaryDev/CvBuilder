using System.Net;
using System.Net.Http.Json;
using CvBuilderApi.DTOs;
using CvBuilderApi.Tests.Helpers;
using FluentAssertions;

namespace CvBuilderApi.Tests.Controllers;

public class TemplatesControllerTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetTemplates_ReturnsOnlyActiveTemplates()
    {
        var response = await _client.GetAsync("/api/templates");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var templates = await response.Content.ReadFromJsonAsync<TemplateDto[]>();
        templates.Should().NotBeNull();
        templates!.Should().HaveCount(2); // Modern Clean + Premium Dark (pas Inactive)
        templates.Should().NotContain(t => t.TemplateKey == "free/_mod-99");
    }

    [Fact]
    public async Task GetTemplates_DoesNotRequireAuth()
    {
        // Pas de header Authorization
        var response = await _client.GetAsync("/api/templates");
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
    }
}

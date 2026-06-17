using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using CvBuilderApi.Data;
using CvBuilderApi.Models;

namespace CvBuilderApi.Tests.Helpers;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remplace Npgsql par InMemory pour les tests
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_Templates"));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Seed templates de test via le conteneur DI de l hote construit
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        if (!db.Templates.Any())
        {
            db.Templates.AddRange(
                new Template { Name = "Modern Clean", TemplateKey = "free/_mod-1", IsPremium = false, IsActive = true },
                new Template { Name = "Premium Dark", TemplateKey = "premium/_mod-3", IsPremium = true, IsActive = true },
                new Template { Name = "Inactive", TemplateKey = "free/_mod-99", IsPremium = false, IsActive = false }
            );
            db.SaveChanges();
        }

        return host;
    }
}

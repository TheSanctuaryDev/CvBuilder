using Microsoft.EntityFrameworkCore;
using CvBuilderApi.Data;
using CvBuilderApi.Models;
using FluentAssertions;

namespace CvBuilderApi.Tests;

public class AppDbContextTests
{
    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    // --- DbSet presence ---

    [Fact]
    public void AppDbContext_ExposesProfilesDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.Profiles.Should().NotBeNull();
    }

    [Fact]
    public void AppDbContext_ExposesCvsDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.Cvs.Should().NotBeNull();
    }

    [Fact]
    public void AppDbContext_ExposesCvVersionsDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.CvVersions.Should().NotBeNull();
    }

    [Fact]
    public void AppDbContext_ExposesPaymentsDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.Payments.Should().NotBeNull();
    }

    [Fact]
    public void AppDbContext_ExposesTemplatesDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.Templates.Should().NotBeNull();
    }

    [Fact]
    public void AppDbContext_ExposesBlueprintCachesDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.BlueprintCaches.Should().NotBeNull();
    }

    [Fact]
    public void AppDbContext_ExposesAdminUsersDbSet()
    {
        using var ctx = CreateInMemoryContext();
        ctx.AdminUsers.Should().NotBeNull();
    }

    // --- CRUD round-trips ---

    [Fact]
    public async Task CanAddAndRetrieveProfile()
    {
        using var ctx = CreateInMemoryContext();
        var profile = new Profile { Id = Guid.NewGuid(), FullName = "Jean Dupont" };
        ctx.Profiles.Add(profile);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.Profiles.FindAsync(profile.Id);
        retrieved.Should().NotBeNull();
        retrieved!.FullName.Should().Be("Jean Dupont");
    }

    [Fact]
    public async Task CanAddAndRetrieveCv()
    {
        using var ctx = CreateInMemoryContext();
        var profile = new Profile { Id = Guid.NewGuid(), FullName = "Test User" };
        ctx.Profiles.Add(profile);

        var cv = new Cv { UserId = profile.Id, Title = "Mon Super CV", TemplateKey = "modern" };
        ctx.Cvs.Add(cv);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.Cvs.FindAsync(cv.Id);
        retrieved.Should().NotBeNull();
        retrieved!.Title.Should().Be("Mon Super CV");
        retrieved.TemplateKey.Should().Be("modern");
        retrieved.IsPremium.Should().BeFalse();
        retrieved.IsPaid.Should().BeFalse();
        retrieved.CurrentVersion.Should().Be(1);
    }

    [Fact]
    public async Task CanAddAndRetrieveCvVersion()
    {
        using var ctx = CreateInMemoryContext();
        var profile = new Profile { Id = Guid.NewGuid() };
        var cv = new Cv { UserId = profile.Id };
        ctx.Profiles.Add(profile);
        ctx.Cvs.Add(cv);

        var version = new CvVersion
        {
            CvId = cv.Id,
            VersionNum = 1,
            CvData = "{\"name\":\"Jean\"}",
            HtmlContent = "<html></html>"
        };
        ctx.CvVersions.Add(version);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.CvVersions.FindAsync(version.Id);
        retrieved.Should().NotBeNull();
        retrieved!.CvData.Should().Be("{\"name\":\"Jean\"}");
        retrieved.VersionNum.Should().Be(1);
    }

    [Fact]
    public async Task CanAddAndRetrievePayment()
    {
        using var ctx = CreateInMemoryContext();
        var profile = new Profile { Id = Guid.NewGuid() };
        var cv = new Cv { UserId = profile.Id };
        ctx.Profiles.Add(profile);
        ctx.Cvs.Add(cv);

        var payment = new Payment
        {
            CvId = cv.Id,
            UserId = profile.Id,
            Amount = 2000,
            Currency = "XOF",
            Provider = "fedapay",
            Status = "success"
        };
        ctx.Payments.Add(payment);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.Payments.FindAsync(payment.Id);
        retrieved.Should().NotBeNull();
        retrieved!.Amount.Should().Be(2000);
        retrieved.Currency.Should().Be("XOF");
        retrieved.Provider.Should().Be("fedapay");
        retrieved.Status.Should().Be("success");
    }

    [Fact]
    public async Task CanAddAndRetrieveTemplate()
    {
        using var ctx = CreateInMemoryContext();
        var template = new Template
        {
            Name = "Modern",
            TemplateKey = "modern",
            IsPremium = false,
            IsActive = true
        };
        ctx.Templates.Add(template);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.Templates.FindAsync(template.Id);
        retrieved.Should().NotBeNull();
        retrieved!.Name.Should().Be("Modern");
        retrieved.TemplateKey.Should().Be("modern");
        retrieved.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CanAddAndRetrieveBlueprintCache()
    {
        using var ctx = CreateInMemoryContext();
        var cache = new TemplateBlueprintCache
        {
            TemplateKey = "modern",
            Blueprint = "{\"sections\":[\"header\",\"experience\"]}"
        };
        ctx.BlueprintCaches.Add(cache);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.BlueprintCaches.FindAsync(cache.Id);
        retrieved.Should().NotBeNull();
        retrieved!.TemplateKey.Should().Be("modern");
        retrieved.Blueprint.Should().Contain("header");
    }

    [Fact]
    public async Task CanAddAndRetrieveAdminUser()
    {
        using var ctx = CreateInMemoryContext();
        var adminId = Guid.NewGuid();
        var admin = new AdminUser { UserId = adminId };
        ctx.AdminUsers.Add(admin);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.AdminUsers.FindAsync(adminId);
        retrieved.Should().NotBeNull();
        retrieved!.UserId.Should().Be(adminId);
    }

    // --- Default values ---

    [Fact]
    public void Cv_DefaultValues_AreCorrect()
    {
        var cv = new Cv();
        cv.Title.Should().Be("Mon CV");
        cv.TemplateKey.Should().BeEmpty();
        cv.IsPremium.Should().BeFalse();
        cv.IsPaid.Should().BeFalse();
        cv.CurrentVersion.Should().Be(1);
        cv.PaidAt.Should().BeNull();
        cv.TransactionId.Should().BeNull();
        cv.Versions.Should().BeEmpty();
        cv.Payments.Should().BeEmpty();
    }

    [Fact]
    public void CvVersion_DefaultValues_AreCorrect()
    {
        var version = new CvVersion();
        version.CvData.Should().Be("{}");
        version.HtmlContent.Should().BeNull();
        version.PhotoPath.Should().BeNull();
    }

    [Fact]
    public void Payment_DefaultValues_AreCorrect()
    {
        var payment = new Payment();
        payment.Amount.Should().Be(2000);
        payment.Currency.Should().Be("XOF");
        payment.Provider.Should().BeEmpty();
        payment.Status.Should().Be("pending");
        payment.ProviderTxId.Should().BeNull();
    }

    [Fact]
    public void Template_DefaultValues_AreCorrect()
    {
        var template = new Template();
        template.Name.Should().BeEmpty();
        template.TemplateKey.Should().BeEmpty();
        template.IsPremium.Should().BeFalse();
        template.IsActive.Should().BeTrue();
        template.PreviewUrl.Should().BeNull();
    }

    [Fact]
    public void TemplateBlueprintCache_DefaultValues_AreCorrect()
    {
        var cache = new TemplateBlueprintCache();
        cache.TemplateKey.Should().BeEmpty();
        cache.Blueprint.Should().Be("{}");
    }

    [Fact]
    public void Profile_DefaultCollections_AreEmpty()
    {
        var profile = new Profile();
        profile.Cvs.Should().BeEmpty();
    }
}

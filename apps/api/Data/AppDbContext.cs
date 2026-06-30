using Microsoft.EntityFrameworkCore;
using CvBuilderApi.Models;

namespace CvBuilderApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Cv> Cvs => Set<Cv>();
    public DbSet<CvVersion> CvVersions => Set<CvVersion>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Template> Templates => Set<Template>();
    public DbSet<TemplateBlueprintCache> BlueprintCaches => Set<TemplateBlueprintCache>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Profile>().ToTable("profiles");
        modelBuilder.Entity<Cv>().ToTable("cvs");
        modelBuilder.Entity<CvVersion>().ToTable("cv_versions")
            .HasIndex(v => new { v.CvId, v.VersionNum }).IsUnique();
        modelBuilder.Entity<CvVersion>()
            .Property(v => v.CvData)
            .HasColumnType("jsonb");
        modelBuilder.Entity<Payment>().ToTable("payments");
        modelBuilder.Entity<Template>().ToTable("templates")
            .HasIndex(t => t.TemplateKey).IsUnique();
        modelBuilder.Entity<TemplateBlueprintCache>().ToTable("template_blueprint_cache")
            .HasIndex(c => c.TemplateKey).IsUnique();
        modelBuilder.Entity<AdminUser>().ToTable("admin_users")
            .HasKey(a => a.UserId);
        modelBuilder.Entity<AppSetting>().ToTable("app_settings")
            .HasKey(s => s.Key);

        // Snake_case pour PostgreSQL
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string name)
    {
        return string.Concat(name.Select((c, i) =>
            i > 0 && char.IsUpper(c) ? "_" + char.ToLower(c) : char.ToLower(c).ToString()));
    }
}

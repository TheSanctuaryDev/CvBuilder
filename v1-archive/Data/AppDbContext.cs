using Microsoft.EntityFrameworkCore;
using CvBuilderApp.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace CvBuilderApp.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<TemplateBlueprintCache> TemplateBlueprintCaches { get; set; }
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=CvBuilderDb;Trusted_Connection=True;");
            }
        }

        public DbSet<CvData> CVs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Configuration du contenu HTML (Poids lourd)
            modelBuilder.Entity<CvData>()
                .Property(c => c.HtmlContent)
                .HasColumnType("nvarchar(max)");

            // 2. Configuration des conversions JSON pour les listes
            // On définit comment C# doit transformer une List<string> en texte pour SQL et vice-versa

            var listConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<List<string>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>()
            );

            // Comparateur pour aider EF Core à détecter les changements dans les listes
            var listComparer = new ValueComparer<List<string>>(
                (c1, c2) => c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList()
            );

            // Application de la conversion aux colonnes de listes
            // Ajoute ici toutes tes propriétés qui sont des List<string>

            modelBuilder.Entity<CvData>(entity =>
            {
                entity.Property(e => e.Formation)
                    .HasConversion(listConverter)
                    .Metadata.SetValueComparer(listComparer);

                entity.Property(e => e.Experience) // Assure-toi que le nom correspond à ton modèle CvData
                    .HasConversion(listConverter)
                    .Metadata.SetValueComparer(listComparer);

                entity.Property(e => e.Skills) // Idem pour les compétences
                    .HasConversion(listConverter)
                    .Metadata.SetValueComparer(listComparer);

                entity.Property(e => e.Interests)
                   .HasConversion(listConverter)
                   .Metadata.SetValueComparer(listComparer);

                // On autorise explicitement ces colonnes à être vides (NULL dans la BD)
                entity.Property(e => e.Formation).IsRequired(false);
                entity.Property(e => e.Experience).IsRequired(false);
                entity.Property(e => e.Skills).IsRequired(false);
                entity.Property(e => e.Interests).IsRequired(false);
                entity.Property(e => e.FieldOfActivity).IsRequired(false);
                entity.Property(e => e.Summary).IsRequired(false);
                entity.Property(e => e.PhotoPath).IsRequired(false);
                entity.Property(e => e.LinkedIn).IsRequired(false);
                entity.Property(e => e.GitHub).IsRequired(false);
                entity.Property(e => e.Phone).IsRequired(false);
                entity.Property(e => e.Address).IsRequired(false);
                entity.Property(e => e.Languages).IsRequired(false);
                entity.Property(e => e.SelectedTemplate).IsRequired(false);
                entity.Property(e => e.HtmlContent).IsRequired(false);
                entity.Property(e => e.ContestsWon).IsRequired(false);
                entity.Property(e => e.References).IsRequired(false);
            });
        }
    }
}
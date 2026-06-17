using CvBuilderApp.Data;
using CvBuilderApp.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- 1. ENREGISTREMENT DES SERVICES ---

// Configuration de la Base de Données
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.CommandTimeout(360)
    ));

// Configuration de la Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(90);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Services de l'application
builder.Services.AddRazorPages();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50MB
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 52428800; // 50MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
});

// Client HTTP Typé pour Gemini
builder.Services.AddHttpClient<ICvGeneratorService, CvGeneratorService>();

// Service PDF Playwright (Singleton — le navigateur démarre une seule fois)
builder.Services.AddSingleton<PdfService>();

var app = builder.Build();

// --- MIGRATION AUTOMATIQUE AU DÉMARRAGE ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var pending = db.Database.GetPendingMigrations().ToList();

        if (pending.Count != 0)
        {
            logger.LogInformation("Application de {Count} migration(s) en attente : {Migrations}",
                pending.Count,
                string.Join(", ", pending));

            db.Database.Migrate();

            logger.LogInformation("Migrations appliquées avec succès.");
        }
        else
        {
            logger.LogInformation("Base de données à jour — aucune migration en attente.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de l'application des migrations. L'application va continuer mais peut être instable.");
        // On ne throw pas — l'app démarre quand même pour ne pas boucler en SIGABRT
    }
}

// --- 2. CONFIGURATION DU PIPELINE ---

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Access-Control-Expose-Headers", "X-Redirect-Url");
    await next();
});
app.UseAuthorization();
app.MapRazorPages();

app.Run();
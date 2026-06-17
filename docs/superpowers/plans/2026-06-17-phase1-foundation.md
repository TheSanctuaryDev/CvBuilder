# TheCvBuilder v2 — Phase 1 : Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la fondation complète de la v2 : mono-repo structuré, .NET 8 Web API authentifié via Supabase JWT, base de données PostgreSQL sur Supabase avec schéma complet, shell Next.js 15 avec authentification Supabase fonctionnelle, Docker local, CI/CD GitHub Actions, déploiement Railway.

**Architecture:** Mono-repo `apps/api` (.NET 8 Web API) + `apps/web` (Next.js 15 App Router). Le token JWT émis par Supabase Auth est validé par le middleware Next.js (routes protégées) ET par le middleware .NET API (endpoints authentifiés). La base de données PostgreSQL tourne sur Supabase cloud, consommée via Npgsql + EF Core.

**Tech Stack:** .NET 8 Web API · Npgsql.EntityFrameworkCore.PostgreSQL · Microsoft.AspNetCore.Authentication.JwtBearer · xUnit · Next.js 15 (App Router, TypeScript) · @supabase/ssr · Tailwind CSS · Vitest · Docker · Railway · GitHub Actions

## Global Constraints

- .NET target framework : `net8.0`
- Next.js version : `15.x` (App Router uniquement — zéro Pages Router)
- TypeScript `strict: true` dans tsconfig.json
- Tous les endpoints `/api/*` sauf `GET /api/templates` requièrent un JWT Bearer valide
- Un utilisateur ne peut accéder qu'à ses propres CVs (vérification `user_id` dans chaque controller)
- Rôle admin : `user_id` doit être présent dans la table `admin_users` (pas de claim JWT custom)
- Variables d'environnement sensibles : jamais commitées — toujours via `.env.local` ou Railway Variables
- Format UUID pour toutes les clés primaires (Guid en C#, uuid en PostgreSQL)

---

## Structure des fichiers — Phase 1

```
CvBuilderApp/                          ← racine du repo existant
├── apps/
│   ├── api/                           ← NOUVEAU projet .NET Web API
│   │   ├── CvBuilderApi.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Dockerfile
│   │   ├── Controllers/
│   │   │   ├── TemplatesController.cs
│   │   │   └── CvsController.cs
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── AppDbContextFactory.cs
│   │   ├── Models/
│   │   │   ├── Cv.cs
│   │   │   ├── CvVersion.cs
│   │   │   ├── Payment.cs
│   │   │   ├── Template.cs
│   │   │   ├── Profile.cs
│   │   │   ├── AdminUser.cs
│   │   │   └── TemplateBlueprintCache.cs
│   │   ├── DTOs/
│   │   │   ├── CvDto.cs
│   │   │   ├── CreateCvRequest.cs
│   │   │   └── TemplateDto.cs
│   │   └── Extensions/
│   │       └── AuthExtensions.cs
│   │
│   ├── api.tests/                     ← NOUVEAU projet xUnit
│   │   ├── CvBuilderApi.Tests.csproj
│   │   ├── Helpers/
│   │   │   └── TestWebApplicationFactory.cs
│   │   ├── Controllers/
│   │   │   ├── TemplatesControllerTests.cs
│   │   │   └── CvsControllerTests.cs
│   │   └── Middleware/
│   │       └── AuthMiddlewareTests.cs
│   │
│   └── web/                           ← NOUVEAU projet Next.js 15
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── .env.local.example
│       ├── middleware.ts
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── (auth)/
│       │   │   ├── layout.tsx
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   └── (dashboard)/
│       │       ├── layout.tsx
│       │       └── dashboard/page.tsx
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts
│       │   │   └── server.ts
│       │   └── api.ts
│       ├── types/
│       │   └── index.ts
│       └── components/
│           ├── CvCard.tsx
│           └── NavBar.tsx
│
├── v1-archive/                        ← CODE V1 archivé (déplacé depuis racine)
├── docker-compose.yml                 ← NOUVEAU
├── .gitignore                         ← MIS À JOUR
└── .github/workflows/
    ├── deploy-api.yml                 ← NOUVEAU
    └── deploy-web.yml                 ← NOUVEAU
```

---

## Task 1 : Archiver la v1 et initialiser la structure mono-repo

**Files:**
- Modify: `.gitignore` (racine)
- Create: `v1-archive/` (déplacement du code existant)
- Create: `apps/api/` (dossier vide)
- Create: `apps/web/` (dossier vide)

**Interfaces:**
- Consumes: rien
- Produces: structure de dossiers prête pour les tâches suivantes

- [ ] **Step 1 : Créer la structure de dossiers**

```bash
mkdir -p apps/api apps/web v1-archive
```

- [ ] **Step 2 : Déplacer le code v1 dans l'archive**

Depuis la racine du repo, déplacer tous les fichiers et dossiers existants (sauf `.git`, `.github`, `docs`, `apps`) vers `v1-archive/` :

```bash
# Windows PowerShell
$exclude = @('.git', '.github', 'docs', 'apps', 'v1-archive')
Get-ChildItem -Path . -Exclude $exclude | Move-Item -Destination v1-archive/
```

- [ ] **Step 3 : Mettre à jour .gitignore à la racine**

Créer le fichier `.gitignore` à la racine avec ce contenu :

```gitignore
# .NET
apps/api/bin/
apps/api/obj/
apps/api.tests/bin/
apps/api.tests/obj/
apps/api/appsettings.Development.json

# Next.js
apps/web/.next/
apps/web/node_modules/
apps/web/.env.local

# Docker
.dockerignore

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 4 : Vérifier la structure**

```bash
# Attendu :
# apps/
# docs/
# v1-archive/
# .gitignore
# .github/
ls -la
```

- [ ] **Step 5 : Commit**

```bash
git add .
git commit -m "chore: archiver v1 et initialiser structure mono-repo apps/"
```

---

## Task 2 : Créer le projet .NET 8 Web API

**Files:**
- Create: `apps/api/CvBuilderApi.csproj`
- Create: `apps/api/Program.cs`
- Create: `apps/api/appsettings.json`
- Create: `apps/api/appsettings.Development.json`
- Create: `apps/api.tests/CvBuilderApi.Tests.csproj`

**Interfaces:**
- Consumes: rien
- Produces: `http://localhost:5000` avec Swagger sur `/swagger`, CORS autorisé pour `http://localhost:3000`

- [ ] **Step 1 : Créer le projet Web API**

```bash
cd apps
dotnet new webapi -n CvBuilderApi -o api --no-https -f net8.0
dotnet new xunit -n CvBuilderApi.Tests -o api.tests -f net8.0
cd ..
```

- [ ] **Step 2 : Ajouter les packages NuGet au projet API**

```bash
cd apps/api

dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.4
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.6
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.6
dotnet add package Swashbuckle.AspNetCore --version 6.6.2

cd ../..
```

- [ ] **Step 3 : Ajouter les packages NuGet au projet Tests**

```bash
cd apps/api.tests

dotnet add package Microsoft.AspNetCore.Mvc.Testing --version 8.0.6
dotnet add package Microsoft.EntityFrameworkCore.InMemory --version 8.0.6
dotnet add reference ../api/CvBuilderApi.csproj
dotnet add package FluentAssertions --version 6.12.0

cd ../..
```

- [ ] **Step 4 : Créer la solution**

```bash
dotnet new sln -n CvBuilderV2 -o .
dotnet sln add apps/api/CvBuilderApi.csproj
dotnet sln add apps/api.tests/CvBuilderApi.Tests.csproj
```

- [ ] **Step 5 : Écrire Program.cs**

Remplacer le contenu de `apps/api/Program.cs` par :

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CvBuilderApi.Data;

var builder = WebApplication.CreateBuilder(args);

// CORS — Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJs", policy =>
    {
        policy.WithOrigins(
                builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Base de données PostgreSQL (Supabase)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Supabase")));

// JWT Auth Supabase (HS256)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Supabase:JwtSecret"]!)),
            ValidateIssuer = true,
            ValidIssuer = $"https://{builder.Configuration["Supabase:ProjectRef"]}.supabase.co/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("NextJs");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
```

- [ ] **Step 6 : Écrire appsettings.json**

```json
{
  "ConnectionStrings": {
    "Supabase": "Host=db.<project-ref>.supabase.co;Database=postgres;Username=postgres;Password=<db-password>;SSL Mode=Require;"
  },
  "Supabase": {
    "ProjectRef": "<your-project-ref>",
    "JwtSecret": "<your-jwt-secret>"
  },
  "AllowedOrigins": "https://thecvbuilder.vercel.app",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

- [ ] **Step 7 : Écrire appsettings.Development.json** (ce fichier est dans .gitignore)

```json
{
  "ConnectionStrings": {
    "Supabase": "Host=db.<project-ref>.supabase.co;Database=postgres;Username=postgres;Password=<db-password>;SSL Mode=Require;"
  },
  "Supabase": {
    "ProjectRef": "<your-project-ref>",
    "JwtSecret": "<your-jwt-secret>"
  },
  "AllowedOrigins": "http://localhost:3000"
}
```

- [ ] **Step 8 : Vérifier que le projet compile et démarre**

```bash
cd apps/api
dotnet build
dotnet run
# Attendu : Swagger accessible sur http://localhost:5000/swagger
```

- [ ] **Step 9 : Commit**

```bash
git add apps/api/ apps/api.tests/ CvBuilderV2.sln
git commit -m "feat: initialiser projet .NET 8 Web API avec JWT Supabase et CORS"
```

---

## Task 3 : Créer le schéma Supabase

**Files:**
- Create: `apps/api/Database/schema.sql`
- Create: `apps/api/Database/seed.sql`
- Create: `apps/api/Database/rls.sql`

**Interfaces:**
- Consumes: un projet Supabase existant (créer sur supabase.com)
- Produces: tables `profiles`, `cvs`, `cv_versions`, `payments`, `templates`, `template_blueprint_cache`, `admin_users` créées en DB

**Pré-requis manuel :**
1. Aller sur https://supabase.com → créer un nouveau projet
2. Récupérer dans Settings > API :
   - `Project URL` : `https://<ref>.supabase.co`
   - `Project Ref` : `<ref>`
   - `JWT Secret` (Settings > API > JWT Settings)
3. Récupérer le mot de passe DB (Settings > Database > Connection string)

- [ ] **Step 1 : Créer le dossier**

```bash
mkdir -p apps/api/Database
```

- [ ] **Step 2 : Écrire schema.sql**

Créer `apps/api/Database/schema.sql` :

```sql
-- Profils utilisateurs (lié à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CVs
CREATE TABLE IF NOT EXISTS cvs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL DEFAULT 'Mon CV',
  template_key     TEXT NOT NULL,
  is_premium       BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid          BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at          TIMESTAMPTZ,
  transaction_id   TEXT,
  current_version  INT NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Versions des CVs
CREATE TABLE IF NOT EXISTS cv_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  version_num  INT NOT NULL,
  cv_data      JSONB NOT NULL DEFAULT '{}',
  html_content TEXT,
  photo_path   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cv_id, version_num)
);

-- Paiements
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id           UUID NOT NULL REFERENCES cvs(id),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  amount          INT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'XOF',
  provider        TEXT NOT NULL,
  provider_tx_id  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  template_key  TEXT NOT NULL UNIQUE,
  is_premium    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  preview_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Cache blueprint Claude
CREATE TABLE IF NOT EXISTS template_blueprint_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key  TEXT NOT NULL UNIQUE,
  blueprint     JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admin_users (
  user_id  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE
);

-- Trigger : créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 3 : Écrire rls.sql**

Créer `apps/api/Database/rls.sql` :

```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_blueprint_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture propre profil uniquement
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- CVs : CRUD propres CVs uniquement
CREATE POLICY "cvs_select_own" ON cvs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cvs_insert_own" ON cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_update_own" ON cvs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cvs_delete_own" ON cvs
  FOR DELETE USING (auth.uid() = user_id);

-- CV Versions : via CV owner
CREATE POLICY "cv_versions_select_own" ON cv_versions
  FOR SELECT USING (
    cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid())
  );

CREATE POLICY "cv_versions_insert_own" ON cv_versions
  FOR INSERT WITH CHECK (
    cv_id IN (SELECT id FROM cvs WHERE user_id = auth.uid())
  );

-- Payments : lecture propres paiements
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Templates : lecture publique
CREATE POLICY "templates_select_all" ON templates
  FOR SELECT USING (true);

-- Blueprint cache : lecture publique
CREATE POLICY "blueprint_cache_select_all" ON template_blueprint_cache
  FOR SELECT USING (true);
```

- [ ] **Step 4 : Écrire seed.sql**

Créer `apps/api/Database/seed.sql` :

```sql
INSERT INTO templates (name, template_key, is_premium, preview_url) VALUES
  ('Modern Clean',                  'free/_mod-1',     FALSE, '/templates/free/_mod-1/preview.jpg'),
  ('Mini',                          'free/_mod-9',     FALSE, '/templates/free/_mod-9/preview.jpg'),
  ('Recruiter Friendly',            'premium/_mod-13', TRUE,  '/templates/premium/_mod-13/preview.jpg'),
  ('Executive Corporate Pink',      'premium/_mod-1',  TRUE,  '/templates/premium/_mod-1/preview.jpg'),
  ('Optimal Corporate Etudiant',    'premium/_mod-7',  TRUE,  '/templates/premium/_mod-7/preview.jpg'),
  ('ATS Optimized',                 'premium/_mod-14', TRUE,  '/templates/premium/_mod-14/preview.jpg'),
  ('Creative Chocolate',            'premium/_mod-2',  TRUE,  '/templates/premium/_mod-2/preview.jpg'),
  ('Creative Dark',                 'premium/_mod-3',  TRUE,  '/templates/premium/_mod-3/preview.jpg'),
  ('Optimal Corporate Stage',       'premium/_mod-6',  TRUE,  '/templates/premium/_mod-6/preview.jpg'),
  ('Optimal Corporate Senior',      'premium/_mod-4',  TRUE,  '/templates/premium/_mod-4/preview.jpg'),
  ('Executive Corporate Aera',      'premium/_mod-8',  TRUE,  '/templates/premium/_mod-8/preview.jpg'),
  ('Modern Minimal',                'premium/_mod-12', TRUE,  '/templates/premium/_mod-12/preview.jpg'),
  ('Professional Executive',        'premium/_mod-22', TRUE,  '/templates/premium/_mod-22/preview.jpg'),
  ('Optimal Corporate',             'premium/_mod-5',  TRUE,  '/templates/premium/_mod-5/preview.jpg'),
  ('95% ATS Optimized',             'premium/_mod-15', TRUE,  '/templates/premium/_mod-15/preview.jpg')
ON CONFLICT (template_key) DO NOTHING;
```

- [ ] **Step 5 : Exécuter les scripts dans Supabase**

Dans le dashboard Supabase → SQL Editor, exécuter dans cet ordre :
1. `schema.sql`
2. `rls.sql`
3. `seed.sql`

Vérifier que les tables apparaissent dans Table Editor.

- [ ] **Step 6 : Commit**

```bash
git add apps/api/Database/
git commit -m "feat: ajouter schema SQL Supabase, RLS et seed templates"
```

---

## Task 4 : Modèles EF Core et AppDbContext

**Files:**
- Create: `apps/api/Models/Cv.cs`
- Create: `apps/api/Models/CvVersion.cs`
- Create: `apps/api/Models/Payment.cs`
- Create: `apps/api/Models/Template.cs`
- Create: `apps/api/Models/Profile.cs`
- Create: `apps/api/Models/AdminUser.cs`
- Create: `apps/api/Models/TemplateBlueprintCache.cs`
- Create: `apps/api/Data/AppDbContext.cs`
- Create: `apps/api/Data/AppDbContextFactory.cs`

**Interfaces:**
- Consumes: tables créées à la Task 3
- Produces: `AppDbContext` injectable avec `DbSet<Cv>`, `DbSet<Template>`, etc.

- [ ] **Step 1 : Écrire les modèles**

`apps/api/Models/Cv.cs` :
```csharp
namespace CvBuilderApi.Models;

public class Cv
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = "Mon CV";
    public string TemplateKey { get; set; } = string.Empty;
    public bool IsPremium { get; set; } = false;
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }
    public string? TransactionId { get; set; }
    public int CurrentVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Profile? User { get; set; }
    public ICollection<CvVersion> Versions { get; set; } = new List<CvVersion>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
```

`apps/api/Models/CvVersion.cs` :
```csharp
namespace CvBuilderApi.Models;

public class CvVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CvId { get; set; }
    public int VersionNum { get; set; }
    public string CvData { get; set; } = "{}";  // JSONB stocké en string
    public string? HtmlContent { get; set; }
    public string? PhotoPath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cv? Cv { get; set; }
}
```

`apps/api/Models/Payment.cs` :
```csharp
namespace CvBuilderApi.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CvId { get; set; }
    public Guid UserId { get; set; }
    public int Amount { get; set; } = 2000;
    public string Currency { get; set; } = "XOF";
    public string Provider { get; set; } = string.Empty;  // "stripe" | "fedapay"
    public string? ProviderTxId { get; set; }
    public string Status { get; set; } = "pending";  // "pending" | "success" | "failed"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Cv? Cv { get; set; }
    public Profile? User { get; set; }
}
```

`apps/api/Models/Template.cs` :
```csharp
namespace CvBuilderApi.Models;

public class Template
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string TemplateKey { get; set; } = string.Empty;
    public bool IsPremium { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public string? PreviewUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

`apps/api/Models/Profile.cs` :
```csharp
namespace CvBuilderApi.Models;

public class Profile
{
    public Guid Id { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Cv> Cvs { get; set; } = new List<Cv>();
}
```

`apps/api/Models/AdminUser.cs` :
```csharp
namespace CvBuilderApi.Models;

public class AdminUser
{
    public Guid UserId { get; set; }
    public Profile? User { get; set; }
}
```

`apps/api/Models/TemplateBlueprintCache.cs` :
```csharp
namespace CvBuilderApi.Models;

public class TemplateBlueprintCache
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TemplateKey { get; set; } = string.Empty;
    public string Blueprint { get; set; } = "{}";  // JSONB
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 2 : Écrire AppDbContext**

`apps/api/Data/AppDbContext.cs` :
```csharp
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profile>().ToTable("profiles");
        modelBuilder.Entity<Cv>().ToTable("cvs");
        modelBuilder.Entity<CvVersion>().ToTable("cv_versions")
            .HasIndex(v => new { v.CvId, v.VersionNum }).IsUnique();
        modelBuilder.Entity<Payment>().ToTable("payments");
        modelBuilder.Entity<Template>().ToTable("templates")
            .HasIndex(t => t.TemplateKey).IsUnique();
        modelBuilder.Entity<TemplateBlueprintCache>().ToTable("template_blueprint_cache")
            .HasIndex(c => c.TemplateKey).IsUnique();
        modelBuilder.Entity<AdminUser>().ToTable("admin_users")
            .HasKey(a => a.UserId);

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
```

- [ ] **Step 3 : Écrire AppDbContextFactory (pour les migrations EF)**

`apps/api/Data/AppDbContextFactory.cs` :
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CvBuilderApi.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(config.GetConnectionString("Supabase"));
        return new AppDbContext(optionsBuilder.Options);
    }
}
```

- [ ] **Step 4 : Vérifier que le projet compile**

```bash
cd apps/api
dotnet build
# Attendu : Build succeeded, 0 errors
```

- [ ] **Step 5 : Commit**

```bash
git add apps/api/Models/ apps/api/Data/
git commit -m "feat: ajouter modèles EF Core et AppDbContext pour Supabase PostgreSQL"
```

---

## Task 5 : DTOs et endpoint Templates

**Files:**
- Create: `apps/api/DTOs/TemplateDto.cs`
- Create: `apps/api/Controllers/TemplatesController.cs`
- Create: `apps/api.tests/Controllers/TemplatesControllerTests.cs`
- Create: `apps/api.tests/Helpers/TestWebApplicationFactory.cs`

**Interfaces:**
- Consumes: `AppDbContext.Templates`
- Produces: `GET /api/templates` → `TemplateDto[]` (public, pas d'auth requise)

- [ ] **Step 1 : Écrire TemplateDto**

`apps/api/DTOs/TemplateDto.cs` :
```csharp
namespace CvBuilderApi.DTOs;

public record TemplateDto(
    Guid Id,
    string Name,
    string TemplateKey,
    bool IsPremium,
    string? PreviewUrl
);
```

- [ ] **Step 2 : Écrire le test avant le controller**

`apps/api.tests/Helpers/TestWebApplicationFactory.cs` :
```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
                options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid()));

            // Seed templates de test
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
            db.Templates.AddRange(
                new Template { Name = "Modern Clean", TemplateKey = "free/_mod-1", IsPremium = false, IsActive = true },
                new Template { Name = "Premium Dark", TemplateKey = "premium/_mod-3", IsPremium = true, IsActive = true },
                new Template { Name = "Inactive", TemplateKey = "free/_mod-99", IsPremium = false, IsActive = false }
            );
            db.SaveChanges();
        });
    }
}
```

`apps/api.tests/Controllers/TemplatesControllerTests.cs` :
```csharp
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
```

- [ ] **Step 3 : Lancer le test pour vérifier qu'il échoue (pas encore de controller)**

```bash
cd apps/api.tests
dotnet test --filter "TemplatesControllerTests" -v
# Attendu : FAIL — 404 Not Found (route inexistante)
```

- [ ] **Step 4 : Écrire TemplatesController**

`apps/api/Controllers/TemplatesController.cs` :
```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TemplateDto>>> GetTemplates()
    {
        var templates = await db.Templates
            .Where(t => t.IsActive)
            .OrderBy(t => t.IsPremium)
            .ThenBy(t => t.Name)
            .Select(t => new TemplateDto(t.Id, t.Name, t.TemplateKey, t.IsPremium, t.PreviewUrl))
            .ToListAsync();

        return Ok(templates);
    }
}
```

- [ ] **Step 5 : Lancer les tests pour vérifier qu'ils passent**

```bash
dotnet test --filter "TemplatesControllerTests" -v
# Attendu : PASS (2 tests)
```

- [ ] **Step 6 : Commit**

```bash
git add apps/api/Controllers/TemplatesController.cs apps/api/DTOs/ apps/api.tests/
git commit -m "feat: ajouter endpoint GET /api/templates avec tests"
```

---

## Task 6 : CVs CRUD endpoints (authentifiés)

**Files:**
- Create: `apps/api/DTOs/CvDto.cs`
- Create: `apps/api/DTOs/CreateCvRequest.cs`
- Create: `apps/api/Controllers/CvsController.cs`
- Create: `apps/api.tests/Controllers/CvsControllerTests.cs`

**Interfaces:**
- Consumes: `AppDbContext.Cvs`, JWT Bearer token (claim `sub` = UUID utilisateur)
- Produces:
  - `GET /api/cvs` → `CvDto[]` (CVs de l'utilisateur connecté)
  - `POST /api/cvs` → `CvDto` (créer un CV vide)
  - `GET /api/cvs/{id}` → `CvDto`
  - `DELETE /api/cvs/{id}` → `204 No Content`

- [ ] **Step 1 : Écrire les DTOs**

`apps/api/DTOs/CvDto.cs` :
```csharp
namespace CvBuilderApi.DTOs;

public record CvDto(
    Guid Id,
    string Title,
    string TemplateKey,
    bool IsPremium,
    bool IsPaid,
    int CurrentVersion,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
```

`apps/api/DTOs/CreateCvRequest.cs` :
```csharp
using System.ComponentModel.DataAnnotations;

namespace CvBuilderApi.DTOs;

public record CreateCvRequest(
    [Required] string Title,
    [Required] string TemplateKey,
    bool IsPremium
);
```

- [ ] **Step 2 : Écrire les tests avant le controller**

`apps/api.tests/Controllers/CvsControllerTests.cs` :
```csharp
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
}
```

Ajouter `apps/api.tests/Helpers/TestJwtHelper.cs` :
```csharp
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
```

Mettre à jour `TestWebApplicationFactory` pour utiliser le secret de test :
```csharp
// Dans ConfigureWebHost, ajouter :
builder.ConfigureAppConfiguration(config =>
{
    config.AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["Supabase:JwtSecret"] = "test-secret-key-at-least-32-characters-long!!",
        ["Supabase:ProjectRef"] = "test"
    });
});
```

- [ ] **Step 3 : Lancer les tests pour vérifier qu'ils échouent**

```bash
dotnet test --filter "CvsControllerTests" -v
# Attendu : FAIL
```

- [ ] **Step 4 : Écrire CvsController**

`apps/api/Controllers/CvsController.cs` :
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CvBuilderApi.Data;
using CvBuilderApi.DTOs;
using CvBuilderApi.Models;

namespace CvBuilderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CvsController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CvDto>>> GetCvs()
    {
        var userId = CurrentUserId;
        var cvs = await db.Cvs
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new CvDto(
                c.Id, c.Title, c.TemplateKey, c.IsPremium,
                c.IsPaid, c.CurrentVersion, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(cvs);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CvDto>> GetCv(Guid id)
    {
        var userId = CurrentUserId;
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (cv == null) return NotFound();

        return Ok(new CvDto(
            cv.Id, cv.Title, cv.TemplateKey, cv.IsPremium,
            cv.IsPaid, cv.CurrentVersion, cv.CreatedAt, cv.UpdatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<CvDto>> CreateCv(CreateCvRequest request)
    {
        var userId = CurrentUserId;

        // Créer le profil si inexistant (première action de l'utilisateur)
        if (!await db.Profiles.AnyAsync(p => p.Id == userId))
        {
            db.Profiles.Add(new Profile { Id = userId });
            await db.SaveChangesAsync();
        }

        var cv = new Cv
        {
            UserId = userId,
            Title = request.Title,
            TemplateKey = request.TemplateKey,
            IsPremium = request.IsPremium
        };

        db.Cvs.Add(cv);
        await db.SaveChangesAsync();

        var dto = new CvDto(
            cv.Id, cv.Title, cv.TemplateKey, cv.IsPremium,
            cv.IsPaid, cv.CurrentVersion, cv.CreatedAt, cv.UpdatedAt);

        return CreatedAtAction(nameof(GetCv), new { id = cv.Id }, dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCv(Guid id)
    {
        var userId = CurrentUserId;
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (cv == null) return NotFound();

        db.Cvs.Remove(cv);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
```

- [ ] **Step 5 : Lancer les tests**

```bash
dotnet test --filter "CvsControllerTests" -v
# Attendu : PASS (3 tests)
```

- [ ] **Step 6 : Lancer tous les tests**

```bash
dotnet test -v
# Attendu : PASS (5 tests au total)
```

- [ ] **Step 7 : Commit**

```bash
git add apps/api/Controllers/CvsController.cs apps/api/DTOs/ apps/api.tests/
git commit -m "feat: ajouter CRUD /api/cvs authentifié avec tests JWT"
```

---

## Task 7 : Initialiser le projet Next.js 15

**Files:**
- Create: `apps/web/` (projet Next.js complet)
- Create: `apps/web/.env.local.example`
- Create: `apps/web/types/index.ts`
- Create: `apps/web/lib/supabase/client.ts`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `apps/web/lib/api.ts`

**Interfaces:**
- Consumes: variables d'environnement Supabase
- Produces: app Next.js démarrant sur `http://localhost:3000`, Supabase Auth fonctionnel

- [ ] **Step 1 : Créer le projet Next.js**

```bash
cd apps
npx create-next-app@15 web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
cd ..
```

- [ ] **Step 2 : Installer les dépendances Supabase**

```bash
cd apps/web
npm install @supabase/supabase-js @supabase/ssr
cd ../..
```

- [ ] **Step 3 : Créer .env.local.example**

`apps/web/.env.local.example` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Copier en `.env.local` et remplir avec les vraies valeurs Supabase.

- [ ] **Step 4 : Créer les types partagés**

`apps/web/types/index.ts` :
```typescript
export type Template = {
  id: string
  name: string
  templateKey: string
  isPremium: boolean
  previewUrl: string | null
}

export type Cv = {
  id: string
  title: string
  templateKey: string
  isPremium: boolean
  isPaid: boolean
  currentVersion: number
  createdAt: string
  updatedAt: string
}

export type CvVersion = {
  id: string
  cvId: string
  versionNum: number
  cvData: CvData
  htmlContent: string | null
  photoPath: string | null
  createdAt: string
}

export type CvData = {
  fullName: string
  email?: string
  phone?: string
  address?: string
  linkedIn?: string
  gitHub?: string
  summary?: string
  fieldOfActivity?: string
  experience?: string[]
  formation?: string[]
  skills?: string[]
  languages?: string
  contestsWon?: string[]
  references?: string[]
  interests?: string[]
  selectedTemplate?: string
  isPremium?: boolean
}
```

- [ ] **Step 5 : Créer les clients Supabase**

`apps/web/lib/supabase/client.ts` :
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

`apps/web/lib/supabase/server.ts` :
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 6 : Créer le wrapper API**

`apps/web/lib/api.ts` :
```typescript
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

export async function fetchTemplates() {
  const res = await fetch(`${API_URL}/api/templates`)
  if (!res.ok) throw new Error('Erreur chargement templates')
  return res.json()
}

export async function fetchCvs() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs`, { headers })
  if (!res.ok) throw new Error('Erreur chargement CVs')
  return res.json()
}

export async function createCv(data: { title: string; templateKey: string; isPremium: boolean }) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Erreur création CV')
  return res.json()
}

export async function deleteCv(id: string) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/cvs/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error('Erreur suppression CV')
}
```

- [ ] **Step 7 : Créer le middleware Supabase Auth**

`apps/web/middleware.ts` :
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rediriger vers /login si non authentifié sur routes dashboard
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rediriger vers /dashboard si déjà connecté sur pages auth
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register'
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

- [ ] **Step 8 : Vérifier que Next.js démarre**

```bash
cd apps/web
cp .env.local.example .env.local
# Remplir .env.local avec les vraies valeurs
npm run dev
# Attendu : http://localhost:3000 accessible
```

- [ ] **Step 9 : Commit**

```bash
git add apps/web/
git commit -m "feat: initialiser Next.js 15 avec Supabase SSR, types et wrapper API"
```

---

## Task 8 : Pages auth (Login + Register) et layout dashboard

**Files:**
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/(auth)/layout.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/register/page.tsx`
- Create: `apps/web/app/(dashboard)/layout.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/web/components/NavBar.tsx`
- Create: `apps/web/components/CvCard.tsx`

**Interfaces:**
- Consumes: `lib/supabase/client.ts`, `lib/api.ts`, types `Cv`
- Produces: pages `/login`, `/register`, `/dashboard` fonctionnelles

- [ ] **Step 1 : Layout racine**

`apps/web/app/layout.tsx` :
```tsx
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'TheCvBuilder',
  description: 'Créez votre CV professionnel en quelques minutes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${playfair.variable} font-sans bg-neutral-950 text-white`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2 : Page racine (redirect)**

`apps/web/app/page.tsx` :
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}
```

- [ ] **Step 3 : Layout auth**

`apps/web/app/(auth)/layout.tsx` :
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-serif text-center mb-8 text-amber-400">TheCvBuilder</h1>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Page Login**

`apps/web/app/(auth)/login/page.tsx` :
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
      <h2 className="text-xl font-semibold mb-6">Connexion</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-400 text-black font-semibold rounded-lg px-4 py-3 hover:bg-amber-300 disabled:opacity-50 transition"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-neutral-400 text-sm mt-6">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-amber-400 hover:underline">S&apos;inscrire</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 5 : Page Register**

`apps/web/app/(auth)/register/page.tsx` :
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
      <h2 className="text-xl font-semibold mb-6">Créer un compte</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-400 text-black font-semibold rounded-lg px-4 py-3 hover:bg-amber-300 disabled:opacity-50 transition"
        >
          {loading ? 'Création...' : "Créer mon compte"}
        </button>
      </form>

      <p className="text-center text-neutral-400 text-sm mt-6">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-amber-400 hover:underline">Se connecter</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 6 : NavBar**

`apps/web/components/NavBar.tsx` :
```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NavBar() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-serif text-amber-400">
          TheCvBuilder
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-neutral-400 hover:text-white transition text-sm">
            Mes CVs
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 7 : CvCard**

`apps/web/components/CvCard.tsx` :
```tsx
import type { Cv } from '@/types'
import Link from 'next/link'

export default function CvCard({ cv }: { cv: Cv }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-white truncate">{cv.title}</h3>
        {cv.isPremium && (
          <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full px-2 py-0.5 ml-2 shrink-0">
            Premium
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-500 mb-1">Template : {cv.templateKey}</p>
      <p className="text-xs text-neutral-500 mb-4">
        {new Date(cv.updatedAt).toLocaleDateString('fr-FR')}
      </p>

      <div className="flex gap-2">
        <Link
          href={`/cv/${cv.id}`}
          className="flex-1 text-center text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 transition"
        >
          Voir
        </Link>
        <Link
          href={`/cv/${cv.id}/edit`}
          className="flex-1 text-center text-sm bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 rounded-lg px-3 py-2 transition"
        >
          Modifier
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 8 : Layout et page Dashboard**

`apps/web/app/(dashboard)/layout.tsx` :
```tsx
import NavBar from '@/components/NavBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

`apps/web/app/(dashboard)/dashboard/page.tsx` :
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CvCard from '@/components/CvCard'
import Link from 'next/link'
import type { Cv } from '@/types'

async function getCvs(accessToken: string): Promise<Cv[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cvs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: { session } } = await supabase.auth.getSession()
  const cvs = session ? await getCvs(session.access_token) : []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif">Mes CVs</h1>
        <Link
          href="/cv/nouveau"
          className="bg-amber-400 text-black font-semibold rounded-lg px-5 py-2.5 hover:bg-amber-300 transition"
        >
          + Nouveau CV
        </Link>
      </div>

      {cvs.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <p className="text-lg mb-4">Vous n&apos;avez pas encore de CV.</p>
          <Link href="/cv/nouveau" className="text-amber-400 hover:underline">
            Créer votre premier CV →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map(cv => <CvCard key={cv.id} cv={cv} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 9 : Vérifier visuellement**

```bash
cd apps/web
npm run dev
```

Tester manuellement :
- `http://localhost:3000` → redirige vers `/login`
- `/login` → formulaire visible, connexion possible
- `/register` → formulaire visible, inscription possible
- Après connexion → `/dashboard` avec liste CVs (vide pour un nouvel user)
- Clic Déconnexion → retour `/login`

- [ ] **Step 10 : Commit**

```bash
git add apps/web/
git commit -m "feat: ajouter pages auth (login/register) et dashboard avec liste CVs"
```

---

## Task 9 : Docker et docker-compose

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: `apps/api/` compilé
- Produces: `docker compose up` → API accessible sur `http://localhost:5000`

- [ ] **Step 1 : Écrire le Dockerfile .NET**

`apps/api/Dockerfile` :
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["apps/api/CvBuilderApi.csproj", "apps/api/"]
RUN dotnet restore "apps/api/CvBuilderApi.csproj"
COPY apps/api/ apps/api/
WORKDIR "/src/apps/api"
RUN dotnet build "CvBuilderApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CvBuilderApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CvBuilderApi.dll"]
```

- [ ] **Step 2 : Écrire docker-compose.yml**

`docker-compose.yml` (racine du repo) :
```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Supabase=${SUPABASE_CONNECTION_STRING}
      - Supabase__ProjectRef=${SUPABASE_PROJECT_REF}
      - Supabase__JwtSecret=${SUPABASE_JWT_SECRET}
      - AllowedOrigins=http://localhost:3000
    restart: unless-stopped
```

- [ ] **Step 3 : Créer .dockerignore**

`.dockerignore` (racine) :
```
**/bin/
**/obj/
**/.git/
**/node_modules/
**/.next/
**/v1-archive/
```

- [ ] **Step 4 : Créer .env pour docker-compose**

Créer `.env` à la racine (dans .gitignore) :
```env
SUPABASE_CONNECTION_STRING=Host=db.<ref>.supabase.co;Database=postgres;Username=postgres;Password=<pwd>;SSL Mode=Require;
SUPABASE_PROJECT_REF=<ref>
SUPABASE_JWT_SECRET=<secret>
```

- [ ] **Step 5 : Tester le build Docker**

```bash
docker compose build
docker compose up
# Attendu : API disponible sur http://localhost:5000/swagger
```

- [ ] **Step 6 : Commit**

```bash
git add apps/api/Dockerfile docker-compose.yml .dockerignore
git commit -m "feat: ajouter Dockerfile .NET et docker-compose pour dev local"
```

---

## Task 10 : GitHub Actions CI/CD + Railway

**Files:**
- Create: `.github/workflows/deploy-api.yml`
- Create: `.github/workflows/deploy-web.yml`

**Interfaces:**
- Consumes: secrets GitHub : `RAILWAY_TOKEN`, `RAILWAY_API_SERVICE_ID`, `RAILWAY_WEB_SERVICE_ID`
- Produces: déploiement automatique sur Railway à chaque push sur `main`

- [ ] **Step 1 : Configurer Railway**

1. Aller sur https://railway.app → créer un projet `thecvbuilder`
2. Ajouter un service "api" → déploiement depuis GitHub, dossier `apps/api/`
3. Ajouter un service "web" → déploiement depuis GitHub, dossier `apps/web/`
4. Dans chaque service, configurer les variables d'environnement
5. Récupérer le token Railway : Account Settings → Tokens → Create Token
6. Récupérer les Service IDs depuis les settings de chaque service Railway

- [ ] **Step 2 : Ajouter les secrets GitHub**

Dans le repo GitHub → Settings → Secrets → Actions :
- `RAILWAY_TOKEN` : token Railway
- `RAILWAY_API_SERVICE_ID` : ID du service "api"
- `RAILWAY_WEB_SERVICE_ID` : ID du service "web"

- [ ] **Step 3 : Écrire deploy-api.yml**

`.github/workflows/deploy-api.yml` :
```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - '.github/workflows/deploy-api.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore -c Release

      - name: Test
        run: dotnet test --no-build -c Release --verbosity normal

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy API to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway up --service ${{ secrets.RAILWAY_API_SERVICE_ID }} --detach
```

- [ ] **Step 4 : Écrire deploy-web.yml**

`.github/workflows/deploy-web.yml` :
```yaml
name: Deploy Web

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - '.github/workflows/deploy-web.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: apps/web

      - name: Build
        run: npm run build
        working-directory: apps/web
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy Web to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway up --service ${{ secrets.RAILWAY_WEB_SERVICE_ID }} --detach
        working-directory: apps/web
```

- [ ] **Step 5 : Ajouter les secrets Supabase dans GitHub**

Dans GitHub Secrets ajouter :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (URL du service api sur Railway)

- [ ] **Step 6 : Pousser et vérifier le déploiement**

```bash
git add .github/workflows/
git commit -m "feat: ajouter CI/CD GitHub Actions pour déploiement Railway API et Web"
git push origin main
# Vérifier dans GitHub Actions que les workflows se déclenchent
# Vérifier dans Railway que les services se déploient
```

---

## Self-Review

**Couverture spec :**
- ✅ Mono-repo structuré `apps/api` + `apps/web` (Task 1)
- ✅ .NET 8 Web API avec JWT Supabase (Tasks 2, 4, 5, 6)
- ✅ Supabase DB schema + RLS + seed (Task 3)
- ✅ EF Core modèles complets (Task 4)
- ✅ `GET /api/templates` public (Task 5)
- ✅ `GET/POST/DELETE /api/cvs` authentifié (Task 6)
- ✅ Next.js 15 App Router + TypeScript (Task 7)
- ✅ Supabase Auth (login/register/middleware) (Tasks 7, 8)
- ✅ Dashboard avec liste CVs (Task 8)
- ✅ Docker local (Task 9)
- ✅ GitHub Actions CI/CD + Railway (Task 10)

**Ce qui est reporté à la Phase suivante (hors scope Phase 1) :**
- Génération Claude (Phase 3)
- Stripe + FedaPay (Phase 3)
- `/cv/nouveau` formulaire complet (Phase 2)
- `/cv/[id]` preview PDF (Phase 2)
- Admin dashboard (Phase 4)
- Resend emails (Phase 4)
- PostHog (Phase 4)

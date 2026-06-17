# TheCvBuilder v2 — Design Document

**Date :** 2026-06-17  
**Auteur :** TheSanctuaryDev  
**Statut :** Approuvé

---

## Contexte

TheCvBuilder est une application web de création de CV professionnels alimentée par l'IA. La v1 est une application ASP.NET Core Razor Pages avec Gemini AI, SQL Server et un déploiement VPS basique. La v2 est une réécriture complète vers une architecture moderne avec comptes utilisateurs, Claude AI, Supabase, Next.js et Railway.

**Stratégie de migration :** Progressive (le site v1 reste en ligne pendant la construction de la v2). Les données existantes ne sont pas migrées (repartir à zéro sur la nouvelle DB).

---

## Stack technique v2

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Backend | ASP.NET Core 8 Web API |
| Auth | Supabase Auth (JWT) |
| Base de données | Supabase (PostgreSQL) via EF Core |
| IA | Claude API (claude-sonnet-4-6) |
| PDF | Microsoft Playwright (Chromium headless) |
| Paiement | Stripe (international) + FedaPay (Mobile Money) |
| Emails | Resend |
| Analytics | PostHog |
| Infrastructure | Docker + Railway |
| CI/CD | GitHub Actions |

---

## Architecture globale

### Structure du repo (Mono-repo structuré)

```
CvBuilderApp/
├── apps/
│   ├── web/                        → Next.js 15 (App Router, TypeScript)
│   │   ├── app/
│   │   │   ├── (auth)/             → login, register, reset-password
│   │   │   ├── (dashboard)/        → dashboard, mes-cvs, cv/[id]
│   │   │   ├── (public)/           → accueil, templates, tarifs, privacy
│   │   │   └── api/                → routes Next.js (webhooks Stripe/FedaPay)
│   │   └── components/
│   │
│   └── api/                        → ASP.NET Core 8 Web API
│       ├── Controllers/
│       │   ├── CvsController
│       │   ├── GenerateController
│       │   ├── PaymentController
│       │   └── AdminController
│       ├── Services/               → Claude, PDF, Payment, Email
│       └── Data/                   → Supabase PostgreSQL via EF Core
│
├── docker-compose.yml              → dev local
└── .github/workflows/
    ├── deploy-web.yml              → déclenché si apps/web/** change
    └── deploy-api.yml              → déclenché si apps/api/** change
```

### Flux de données principal

```
Browser → Next.js → .NET API → Supabase DB
                  → Claude API (streaming SSE)
                  → Playwright PDF
                  → Stripe / FedaPay
                  → Resend (emails)
```

### Auth flow

```
Browser → Supabase Auth (JWT)
        → Next.js middleware valide le token
        → .NET API valide le même JWT Supabase sur chaque requête
```

---

## Base de données (Supabase PostgreSQL)

```sql
-- Géré par Supabase Auth
auth.users (id, email, created_at, ...)

-- Profil public
profiles (
  id          uuid PRIMARY KEY  -- = auth.users.id
  full_name   text
  avatar_url  text
  created_at  timestamptz
)

-- CVs
cvs (
  id                uuid PRIMARY KEY
  user_id           uuid REFERENCES profiles(id)
  title             text
  template_key      text
  is_premium        bool
  is_paid           bool DEFAULT false
  paid_at           timestamptz
  transaction_id    text
  current_version   int
  created_at        timestamptz
  updated_at        timestamptz
)

-- Versions des CVs (historique)
cv_versions (
  id            uuid PRIMARY KEY
  cv_id         uuid REFERENCES cvs(id)
  version_num   int
  cv_data       jsonb         -- toutes les données utilisateur
  html_content  text          -- HTML généré par Claude
  photo_path    text
  created_at    timestamptz
)

-- Paiements
payments (
  id              uuid PRIMARY KEY
  cv_id           uuid REFERENCES cvs(id)
  user_id         uuid REFERENCES profiles(id)
  amount          int           -- en FCFA (2000)
  currency        text          -- 'XOF' ou 'EUR'
  provider        text          -- 'stripe' | 'fedapay'
  provider_tx_id  text
  status          text          -- 'pending' | 'success' | 'failed'
  created_at      timestamptz
)

-- Templates (gérés en DB, plus hardcodés)
templates (
  id            uuid PRIMARY KEY
  name          text
  template_key  text UNIQUE
  is_premium    bool
  is_active     bool DEFAULT true
  preview_url   text
  created_at    timestamptz
)

-- Cache blueprint Claude (migré depuis SQL Server)
template_blueprint_cache (
  id            uuid PRIMARY KEY
  template_key  text UNIQUE
  blueprint     jsonb
  created_at    timestamptz
  updated_at    timestamptz
)
```

**Sécurité :** Supabase Row Level Security activé — un utilisateur ne voit que ses propres CVs et paiements.

**Rôle admin :** géré via une table `admin_users (user_id uuid)` en DB. Le middleware .NET vérifie la présence du user_id dans cette table avant d'autoriser les routes `/api/admin/*`.

**Compte requis :** un utilisateur doit être connecté pour générer tout CV (gratuit ou premium). Les templates gratuits restent à 0 FCFA mais nécessitent un compte.

---

## Pages Next.js & flux utilisateur

### Routes

```
(public)/
  /                     → Landing page
  /templates            → Galerie des templates
  /tarifs               → Pricing (Gratuit 0 FCFA / Premium 2000 FCFA)
  /privacy              → Confidentialité & contact

(auth)/
  /login                → Connexion
  /register             → Inscription
  /reset-password       → Réinitialisation

(dashboard)/
  /dashboard            → Accueil utilisateur (ses CVs, stats)
  /cv/nouveau           → Formulaire multi-steps création CV
  /cv/[id]              → Preview + téléchargement
  /cv/[id]/edit         → Modifier données + régénérer
  /cv/[id]/versions     → Historique des versions

(admin)/
  /admin                → Stats globales
  /admin/cvs            → Tous les CVs générés
  /admin/paiements      → Historique paiements
  /admin/templates      → Gestion templates
```

### Flux utilisateur complet

1. Visiteur → choisit un template → redirigé vers `/login` si non connecté
2. Connecté → `/cv/nouveau` → formulaire multi-steps → soumet
3. `.NET API` reçoit → Claude génère HTML (streaming SSE → progress bar)
4. CV sauvegardé en DB → redirect `/cv/[id]`
5. Preview PDF (avec filigrane si premium non payé)
6. User paie → webhook → `cvs.is_paid = true`
7. Téléchargement PDF propre
8. `/dashboard` → liste tous ses CVs
9. `/cv/[id]/edit` → modifie données ou change template → régénère → nouvelle version
10. `/cv/[id]/versions` → voir et restaurer l'historique

---

## API .NET — Endpoints

```
MIDDLEWARE
  → Validation JWT Supabase sur toutes les routes /api/*

CVS
  GET    /api/cvs                          → liste CVs de l'user connecté
  POST   /api/cvs                          → créer un CV
  GET    /api/cvs/{id}                     → détail d'un CV
  DELETE /api/cvs/{id}                     → supprimer un CV

VERSIONS
  GET    /api/cvs/{id}/versions            → historique des versions
  GET    /api/cvs/{id}/versions/{vnum}     → détail d'une version
  POST   /api/cvs/{id}/restore/{vnum}      → restaurer une version

GÉNÉRATION (SSE streaming)
  POST   /api/generate                     → générer un nouveau CV
  POST   /api/generate/{id}/regenerate     → régénérer avec nouvelles données

PDF
  GET    /api/cvs/{id}/pdf                 → PDF (filigrane si non payé)
  GET    /api/cvs/{id}/pdf/download        → PDF propre (bloqué si non payé)

PAIEMENT
  POST   /api/payments/stripe/create       → session Stripe Checkout
  POST   /api/payments/fedapay/create      → transaction FedaPay
  POST   /api/payments/stripe/webhook      → webhook Stripe
  POST   /api/payments/fedapay/webhook     → webhook FedaPay

TEMPLATES
  GET    /api/templates                    → liste templates actifs

ADMIN (rôle admin requis)
  GET    /api/admin/stats                  → CVs, revenus, taux conversion
  GET    /api/admin/cvs                    → tous les CVs
  GET    /api/admin/payments               → tous les paiements
  PATCH  /api/admin/templates/{id}         → activer/désactiver template
```

---

## Claude AI & Streaming

### Migration Gemini → Claude

- **Modèle :** `claude-sonnet-4-6`
- **SDK :** Anthropic .NET SDK
- **Streaming :** SSE natif via SDK → chunks renvoyés au browser via Next.js
- **Blueprint cache :** conservé, migré vers PostgreSQL (jsonb)
- **Retry avec backoff exponentiel :** conservé (4 tentatives)

### Flux streaming

```
Next.js /cv/nouveau
  → POST /api/generate (SSE)
  → .NET ouvre stream Claude
  → chunks HTML renvoyés en temps réel
  → Progress bar visible dans le browser
  → Détection "</html>" → sauvegarde DB → redirect /cv/[id]
```

---

## Paiement dual (Stripe + FedaPay)

**Tarif :** 2000 FCFA par CV premium (≈ 3.05 EUR pour Stripe)

### Flux

```
/cv/[id] → "Débloquer ce CV"
  → Choix : Stripe (carte) ou FedaPay (Mobile Money MTN/Moov)
  → POST /api/payments/{provider}/create
  → URL checkout renvoyée
  → User paie sur page provider
  → Webhook reçu → signature vérifiée
  → cvs.is_paid = true + payment enregistré
  → Redirect /cv/[id] → PDF propre disponible
```

---

## Admin Dashboard + Emails + Analytics

### Admin (`/admin`)

- Stats : CVs générés, revenus FCFA/EUR, taux conversion, templates populaires, taux d'erreur Claude
- Tables : derniers CVs, derniers paiements, gestion templates (sans redeploy)

### Emails transactionnels (Resend)

1. **Bienvenue** → à l'inscription
2. **CV prêt** → "Votre CV est généré, cliquez pour le voir"
3. **Paiement confirmé** → "Votre CV premium est débloqué"
4. **Rappel J+3** → "Votre CV vous attend" (si pas téléchargé)

### Analytics (PostHog)

Events trackés :
- `template_selected`
- `cv_generation_started`
- `cv_generation_success` / `cv_generation_failed`
- `payment_initiated` (+ provider)
- `payment_success`
- `pdf_downloaded`

→ Funnel de conversion visible dans PostHog dashboard

---

## Infrastructure (Docker + Railway)

### Dev local

```yaml
# docker-compose.yml
services:
  api:
    build: ./apps/api
    ports: ["5000:8080"]
    environment:
      - SUPABASE_CONNECTION_STRING=...
      - CLAUDE_API_KEY=...
      - STRIPE_SECRET_KEY=...
      - FEDAPAY_SECRET_KEY=...
      - RESEND_API_KEY=...
```

### Production (Railway)

```
Projet Railway "thecvbuilder"
  ├── Service "api"  → apps/api/  → .NET 8 Docker
  └── Service "web"  → apps/web/  → Next.js (auto-détecté)
```

### CI/CD (GitHub Actions)

```yaml
# deploy-api.yml  → déclenché si apps/api/** change
# deploy-web.yml  → déclenché si apps/web/** change
# Déploiements indépendants : front peut déployer sans toucher le back
```

---

## Phases de livraison

| Phase | Contenu | Priorité |
|-------|---------|----------|
| 1 | Mono-repo + Supabase DB + Auth + .NET Web API + Docker + Railway | Fondation |
| 2 | Next.js frontend (toutes les pages publiques + dashboard) | Frontend |
| 3 | Claude AI + Stripe + FedaPay | Features |
| 4 | Admin dashboard + Resend + PostHog | Business |

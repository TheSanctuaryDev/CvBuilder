-- =============================================================================
-- TheCvBuilder — Schéma PostgreSQL complet
-- Compatible PostgreSQL 14+
-- À exécuter sur un VPS PostgreSQL frais
-- =============================================================================

-- gen_random_uuid() est natif depuis PostgreSQL 13.
-- Si vous êtes sur PG < 13 : CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Profils utilisateurs
-- L'id correspond à l'UUID de l'utilisateur Supabase Auth (JWT sub claim)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CVs
CREATE TABLE IF NOT EXISTS cvs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL DEFAULT 'Mon CV',
  template_key     TEXT        NOT NULL,
  is_premium       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_paid          BOOLEAN     NOT NULL DEFAULT FALSE,
  paid_at          TIMESTAMPTZ,
  transaction_id   TEXT,
  current_version  INT         NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Versions des CVs (contenu JSON éditable)
CREATE TABLE IF NOT EXISTS cv_versions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id        UUID        NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  version_num  INT         NOT NULL,
  cv_data      JSONB       NOT NULL DEFAULT '{}',
  html_content TEXT,
  photo_path   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cv_id, version_num)
);

-- Paiements
-- ON DELETE CASCADE sur user_id et cv_id : la suppression d'un profil ou d'un CV
-- nettoie automatiquement les paiements associés.
CREATE TABLE IF NOT EXISTS payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id           UUID        NOT NULL REFERENCES cvs(id)      ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  amount          INT         NOT NULL DEFAULT 2000,
  currency        TEXT        NOT NULL DEFAULT 'XOF',
  provider        TEXT        NOT NULL DEFAULT 'fedapay',
  provider_tx_id  TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'success', 'failed', 'canceled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates de CV
CREATE TABLE IF NOT EXISTS templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  template_key  TEXT        NOT NULL UNIQUE,
  is_premium    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  preview_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cache de blueprint (layout JSON par template, généré une seule fois)
CREATE TABLE IF NOT EXISTS template_blueprint_cache (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key  TEXT        NOT NULL UNIQUE,
  blueprint     JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Administrateurs
CREATE TABLE IF NOT EXISTS admin_users (
  user_id  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE
);

-- Paramètres applicatifs (clé/valeur)
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valeur par défaut : Claude
INSERT INTO app_settings (key, value) VALUES ('ai_provider', 'claude') ON CONFLICT DO NOTHING;

-- =============================================================================
-- INDEX DE PERFORMANCE
-- =============================================================================

-- CVs par utilisateur (la requête la plus fréquente)
CREATE INDEX IF NOT EXISTS idx_cvs_user_id
  ON cvs (user_id);

-- Versions par CV (tri par version_num)
CREATE INDEX IF NOT EXISTS idx_cv_versions_cv_id
  ON cv_versions (cv_id, version_num DESC);

-- Paiements par utilisateur (pour la suppression de compte)
CREATE INDEX IF NOT EXISTS idx_payments_user_id
  ON payments (user_id);

-- Paiements par CV (pour le webhook FedaPay)
CREATE INDEX IF NOT EXISTS idx_payments_cv_id
  ON payments (cv_id);

-- Paiements en attente (lookup webhook)
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx_id
  ON payments (provider_tx_id)
  WHERE provider_tx_id IS NOT NULL;

-- Templates actifs (requête publique fréquente)
CREATE INDEX IF NOT EXISTS idx_templates_active
  ON templates (is_premium, name)
  WHERE is_active = TRUE;

-- =============================================================================
-- DONNÉES INITIALES — Templates
-- =============================================================================
-- 2 templates gratuits + 13 templates premium (cf. page Tarifs)
-- ON CONFLICT DO NOTHING : safe à réexécuter

INSERT INTO templates (name, template_key, is_premium, is_active) VALUES
  -- Gratuits
  ('Classique',      'classique',    FALSE, TRUE),
  ('Moderne',        'moderne',      FALSE, TRUE),

  -- Premium
  ('Élégant',        'elegant',      TRUE,  TRUE),
  ('Exécutif',       'executif',     TRUE,  TRUE),
  ('Minimaliste',    'minimaliste',  TRUE,  TRUE),
  ('Créatif',        'creatif',      TRUE,  TRUE),
  ('Tech',           'tech',         TRUE,  TRUE),
  ('Académique',     'academique',   TRUE,  TRUE),
  ('Professionnel',  'professionnel',TRUE,  TRUE),
  ('Bold',           'bold',         TRUE,  TRUE),
  ('Startuper',      'startuper',    TRUE,  TRUE),
  ('Designer',       'designer',     TRUE,  TRUE),
  ('Consultant',     'consultant',   TRUE,  TRUE),
  ('Manager',        'manager',      TRUE,  TRUE),
  ('Ingénieur',      'ingenieur',    TRUE,  TRUE)
ON CONFLICT (template_key) DO NOTHING;

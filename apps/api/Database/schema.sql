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

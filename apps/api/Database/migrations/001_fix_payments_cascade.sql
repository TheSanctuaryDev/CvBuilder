-- Migration 001 : Ajouter ON DELETE CASCADE sur la table payments
-- À exécuter UNIQUEMENT si la base de données existe déjà (avant le nouveau schema.sql)
-- Si vous partez d'un VPS neuf, utilisez directement schema.sql — ce fichier est inutile.

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey,
  ADD CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_cv_id_fkey,
  ADD CONSTRAINT payments_cv_id_fkey
    FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE;

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

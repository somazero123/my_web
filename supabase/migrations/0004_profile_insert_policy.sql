CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "app_settings_insert_own" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


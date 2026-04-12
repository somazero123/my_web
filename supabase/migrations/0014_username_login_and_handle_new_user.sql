ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_key_unique ON public.profiles (username_key);

CREATE OR REPLACE FUNCTION public.superadmin_get_users()
RETURNS TABLE(id uuid, username text, email text, display_name text, points_balance integer, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id,
         p.username,
         u.email::text,
         p.display_name,
         p.points_balance,
         p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE public.is_superadmin();
$$;

REVOKE ALL ON FUNCTION public.superadmin_get_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.superadmin_get_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text := 'admin';
  v_username text;
  v_username_key text;
BEGIN
  v_username := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''), split_part(NEW.email, '@', 1));
  v_username_key := lower(v_username);

  IF v_username_key = 'admin' OR NEW.email = 'admin@admin.com' THEN
    v_role := 'superadmin';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, points_balance, username, username_key)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    0,
    v_username,
    v_username_key
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.app_settings (user_id, parent_secret_hash)
  VALUES (NEW.id, public.pg_crypt('parent', public.pg_gen_salt('bf')))
  ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.ensure_default_tasks(NEW.id);

  RETURN NEW;
END;
$$;

UPDATE public.profiles p
SET role = 'superadmin'
WHERE p.username_key = 'admin';


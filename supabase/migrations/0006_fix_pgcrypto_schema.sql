CREATE OR REPLACE FUNCTION public.pg_crypt(p text, s text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = extensions, public
AS $$
  SELECT crypt(p, s);
$$;

CREATE OR REPLACE FUNCTION public.pg_gen_salt(algo text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = extensions, public
AS $$
  SELECT gen_salt(algo);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, points_balance)
  VALUES (NEW.id, 'admin', COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.app_settings (user_id, parent_secret_hash)
  VALUES (NEW.id, public.pg_crypt('parent', public.pg_gen_salt('bf')))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_setup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, points_balance)
  VALUES (uid, 'admin', '', 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.app_settings (user_id, parent_secret_hash)
  VALUES (uid, public.pg_crypt('parent', public.pg_gen_salt('bf')))
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_points_with_secret(p_delta integer, p_reason text, p_secret text)
RETURNS TABLE(new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  ok boolean;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'invalid delta';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;

  SELECT (public.pg_crypt(p_secret, s.parent_secret_hash) = s.parent_secret_hash)
    INTO ok
  FROM public.app_settings s
  WHERE s.user_id = uid;

  IF ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'invalid secret';
  END IF;

  INSERT INTO public.points_ledger(user_id, delta, reason)
  VALUES (uid, p_delta, trim(p_reason));

  UPDATE public.profiles
  SET points_balance = points_balance + p_delta
  WHERE id = uid
  RETURNING points_balance INTO new_balance;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_parent_secret(p_old text, p_new text)
RETURNS TABLE(ok boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  valid boolean;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_new IS NULL OR length(trim(p_new)) = 0 THEN
    RAISE EXCEPTION 'invalid new secret';
  END IF;

  SELECT (public.pg_crypt(p_old, s.parent_secret_hash) = s.parent_secret_hash)
    INTO valid
  FROM public.app_settings s
  WHERE s.user_id = uid;

  IF valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'invalid old secret';
  END IF;

  UPDATE public.app_settings
  SET parent_secret_hash = public.pg_crypt(trim(p_new), public.pg_gen_salt('bf')),
      updated_at = NOW()
  WHERE user_id = uid;

  ok := true;
  RETURN;
END;
$$;


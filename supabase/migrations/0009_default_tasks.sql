CREATE OR REPLACE FUNCTION public.ensure_default_tasks(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.tasks (user_id, title, delta, sort_order)
  VALUES
    (p_user_id, '数学题', 1, 0),
    (p_user_id, '读中文绘本', 1, 1),
    (p_user_id, '英文绘本', 1, 2),
    (p_user_id, '自觉洗漱', 1, 3),
    (p_user_id, '穿衣服', 1, 4),
    (p_user_id, '老师表扬', 5, 5)
  ON CONFLICT (user_id, title) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_default_tasks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_default_tasks(uuid) TO authenticated;

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

  PERFORM public.ensure_default_tasks(NEW.id);

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

  PERFORM public.ensure_default_tasks(uid);
END;
$$;

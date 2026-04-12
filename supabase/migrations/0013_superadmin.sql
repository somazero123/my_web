-- 添加 superadmin 角色
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'superadmin'));

-- 判断是否为超管的函数
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'superadmin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- 为超级管理员开放所有表的 RLS 权限 (ALL)
DROP POLICY IF EXISTS "profiles_superadmin_all" ON public.profiles;
DROP POLICY IF EXISTS "points_ledger_superadmin_all" ON public.points_ledger;
DROP POLICY IF EXISTS "app_settings_superadmin_all" ON public.app_settings;
DROP POLICY IF EXISTS "tasks_superadmin_all" ON public.tasks;
DROP POLICY IF EXISTS "redemptions_superadmin_all" ON public.redemptions;
CREATE POLICY "profiles_superadmin_all" ON public.profiles FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "points_ledger_superadmin_all" ON public.points_ledger FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "app_settings_superadmin_all" ON public.app_settings FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "tasks_superadmin_all" ON public.tasks FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "redemptions_superadmin_all" ON public.redemptions FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- 超级管理员获取所有用户的 RPC
CREATE OR REPLACE FUNCTION public.superadmin_get_users()
RETURNS TABLE(id uuid, email text, display_name text, points_balance integer, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, u.email::text, p.display_name, p.points_balance, p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE public.is_superadmin();
$$;

REVOKE ALL ON FUNCTION public.superadmin_get_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.superadmin_get_users() TO authenticated;

-- 超级管理员直接修改积分的 RPC (无密码)
CREATE OR REPLACE FUNCTION public.superadmin_set_points(p_user_id uuid, p_target integer, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance integer;
  diff integer;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  
  IF p_target IS NULL OR p_target < 0 THEN
    RAISE EXCEPTION 'invalid target points';
  END IF;

  SELECT points_balance INTO current_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  diff := p_target - current_balance;

  IF diff != 0 THEN
    INSERT INTO public.points_ledger(user_id, delta, reason) VALUES (p_user_id, diff, trim(p_reason));
    UPDATE public.profiles SET points_balance = p_target WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.superadmin_set_points(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.superadmin_set_points(uuid, integer, text) TO authenticated;

-- 更新新用户触发器，自动识别 admin@admin.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text := 'admin';
BEGIN
  IF NEW.email = 'admin@admin.com' THEN
    v_role := 'superadmin';
  END IF;

  INSERT INTO public.profiles (id, role, display_name, points_balance)
  VALUES (NEW.id, v_role, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.app_settings (user_id, parent_secret_hash)
  VALUES (NEW.id, public.pg_crypt('parent', public.pg_gen_salt('bf')))
  ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.ensure_default_tasks(NEW.id);

  RETURN NEW;
END;
$$;

-- 自动升级现有的 admin@admin.com 为 superadmin（如果已经注册）
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- 改造 add_points_with_secret，支持 p_user_id
DROP FUNCTION IF EXISTS public.add_points_with_secret(integer, text, text);
CREATE OR REPLACE FUNCTION public.add_points_with_secret(p_delta integer, p_reason text, p_secret text, p_user_id uuid DEFAULT NULL)
RETURNS TABLE(new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  ok boolean;
BEGIN
  uid := coalesce(p_user_id, auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  
  IF uid != auth.uid() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'invalid delta';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;

  -- 验证密钥（超管免密）
  IF public.is_superadmin() THEN
    ok := true;
  ELSE
    SELECT (public.pg_crypt(p_secret, s.parent_secret_hash) = s.parent_secret_hash)
      INTO ok
    FROM public.app_settings s
    WHERE s.user_id = uid;
  END IF;

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

REVOKE ALL ON FUNCTION public.add_points_with_secret(integer, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_points_with_secret(integer, text, text, uuid) TO authenticated;

-- 改造 set_points_with_secret，支持 p_user_id
DROP FUNCTION IF EXISTS public.set_points_with_secret(integer, text, text);
CREATE OR REPLACE FUNCTION public.set_points_with_secret(p_target integer, p_reason text, p_secret text, p_user_id uuid DEFAULT NULL)
RETURNS TABLE(new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  ok boolean;
  current_balance integer;
  diff integer;
BEGIN
  uid := coalesce(p_user_id, auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF uid != auth.uid() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF p_target IS NULL OR p_target < 0 THEN
    RAISE EXCEPTION 'invalid target points';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;

  -- 验证密钥（超管免密）
  IF public.is_superadmin() THEN
    ok := true;
  ELSE
    SELECT (public.pg_crypt(p_secret, s.parent_secret_hash) = s.parent_secret_hash)
      INTO ok
    FROM public.app_settings s
    WHERE s.user_id = uid;
  END IF;

  IF ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'invalid secret';
  END IF;

  SELECT points_balance INTO current_balance
  FROM public.profiles
  WHERE id = uid
  FOR UPDATE;

  diff := p_target - current_balance;

  IF diff != 0 THEN
    INSERT INTO public.points_ledger(user_id, delta, reason)
    VALUES (uid, diff, trim(p_reason));

    UPDATE public.profiles
    SET points_balance = p_target
    WHERE id = uid
    RETURNING points_balance INTO new_balance;
  ELSE
    new_balance := current_balance;
  END IF;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.set_points_with_secret(integer, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_points_with_secret(integer, text, text, uuid) TO authenticated;

-- 改造 redeem_product，支持 p_user_id
DROP FUNCTION IF EXISTS public.redeem_product(uuid);
CREATE OR REPLACE FUNCTION public.redeem_product(p_product_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS TABLE(ok boolean, new_balance integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  v_cost integer;
  v_stock integer;
  v_balance integer;
BEGIN
  uid := coalesce(p_user_id, auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF uid != auth.uid() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT p.points_cost, p.stock
    INTO v_cost, v_stock
  FROM public.products p
  WHERE p.id = p_product_id
  FOR UPDATE;

  IF v_cost IS NULL THEN
    RETURN QUERY SELECT false, NULL::integer, '商品不存在';
    RETURN;
  END IF;
  IF v_stock <= 0 THEN
    RETURN QUERY SELECT false, NULL::integer, '库存不足';
    RETURN;
  END IF;

  SELECT points_balance INTO v_balance
  FROM public.profiles
  WHERE id = uid
  FOR UPDATE;

  IF v_balance < v_cost THEN
    RETURN QUERY SELECT false, v_balance, '积分不足';
    RETURN;
  END IF;

  UPDATE public.products p
  SET stock = p.stock - 1
  WHERE p.id = p_product_id;

  INSERT INTO public.redemptions(user_id, product_id, points_cost, status)
  VALUES (uid, p_product_id, v_cost, 'success');

  INSERT INTO public.points_ledger(user_id, delta, reason)
  VALUES (uid, -v_cost, '换购');

  UPDATE public.profiles
  SET points_balance = points_balance - v_cost
  WHERE id = uid
  RETURNING points_balance INTO v_balance;

  RETURN QUERY SELECT true, v_balance, '换购成功';
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_product(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_product(uuid, uuid) TO authenticated;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('user','admin')),
  display_name TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  user_id UUID PRIMARY KEY,
  parent_secret_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id_created_at
  ON public.points_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON public.products(created_at DESC);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','recommend','seed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id_sort
  ON public.product_images(product_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  points_cost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user_id_created_at
  ON public.redemptions(user_id, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "app_settings_select_own" ON public.app_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "app_settings_update_own" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "points_ledger_select_own" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "redemptions_select_own" ON public.redemptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "products_select_all" ON public.products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "products_write_admin" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "product_images_select_all" ON public.product_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "product_images_write_admin" ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
  VALUES (NEW.id, crypt('parent', gen_salt('bf')))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

  SELECT (crypt(p_secret, s.parent_secret_hash) = s.parent_secret_hash)
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

REVOKE ALL ON FUNCTION public.add_points_with_secret(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_points_with_secret(integer, text, text) TO authenticated;

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

  SELECT (crypt(p_old, s.parent_secret_hash) = s.parent_secret_hash)
    INTO valid
  FROM public.app_settings s
  WHERE s.user_id = uid;

  IF valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'invalid old secret';
  END IF;

  UPDATE public.app_settings
  SET parent_secret_hash = crypt(trim(p_new), gen_salt('bf')),
      updated_at = NOW()
  WHERE user_id = uid;

  ok := true;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.set_parent_secret(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_parent_secret(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_product(p_product_id uuid)
RETURNS TABLE(ok boolean, new_balance integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  cost integer;
  stock integer;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT points_cost, stock
    INTO cost, stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF cost IS NULL THEN
    ok := false;
    message := '商品不存在';
    RETURN;
  END IF;
  IF stock <= 0 THEN
    ok := false;
    message := '库存不足';
    RETURN;
  END IF;

  SELECT points_balance INTO new_balance
  FROM public.profiles
  WHERE id = uid
  FOR UPDATE;

  IF new_balance < cost THEN
    ok := false;
    message := '积分不足';
    RETURN;
  END IF;

  UPDATE public.products
  SET stock = stock - 1
  WHERE id = p_product_id;

  INSERT INTO public.redemptions(user_id, product_id, points_cost, status)
  VALUES (uid, p_product_id, cost, 'success');

  INSERT INTO public.points_ledger(user_id, delta, reason)
  VALUES (uid, -cost, '换购');

  UPDATE public.profiles
  SET points_balance = points_balance - cost
  WHERE id = uid
  RETURNING points_balance INTO new_balance;

  ok := true;
  message := '换购成功';
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_product(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_product(uuid) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;


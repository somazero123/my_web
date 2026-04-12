CREATE OR REPLACE FUNCTION public.redeem_product(p_product_id uuid)
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
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
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

REVOKE ALL ON FUNCTION public.redeem_product(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_product(uuid) TO authenticated;


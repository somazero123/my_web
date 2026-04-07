-- 添加直接设置积分的 RPC 函数
CREATE OR REPLACE FUNCTION public.set_points_with_secret(p_target integer, p_reason text, p_secret text)
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
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_target IS NULL OR p_target < 0 THEN
    RAISE EXCEPTION 'invalid target points';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;

  -- 验证密钥
  SELECT (public.pg_crypt(p_secret, s.parent_secret_hash) = s.parent_secret_hash)
    INTO ok
  FROM public.app_settings s
  WHERE s.user_id = uid;

  IF ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'invalid secret';
  END IF;

  -- 获取当前积分并锁定行
  SELECT points_balance INTO current_balance
  FROM public.profiles
  WHERE id = uid
  FOR UPDATE;

  diff := p_target - current_balance;

  -- 如果积分有变动，记录流水
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

-- 撤销默认权限并授予 authenticated 角色
REVOKE ALL ON FUNCTION public.set_points_with_secret(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_points_with_secret(integer, text, text) TO authenticated;

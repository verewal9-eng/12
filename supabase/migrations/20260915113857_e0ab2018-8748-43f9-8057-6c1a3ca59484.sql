CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet read" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('deposit','purchase','refund')),
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending','succeeded','canceled')),
  provider text,
  provider_payment_id text UNIQUE,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_tx_user_idx ON public.wallet_transactions (user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx read" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.credit_wallet(_user_id uuid, _amount numeric, _payment_id text, _description text DEFAULT 'Пополнение баланса')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inserted boolean := false;
BEGIN
  IF _amount <= 0 THEN RETURN false; END IF;
  INSERT INTO public.wallet_transactions (user_id, kind, amount, status, provider, provider_payment_id, description)
  VALUES (_user_id, 'deposit', _amount, 'succeeded', 'yookassa', _payment_id, _description)
  ON CONFLICT (provider_payment_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF NOT inserted THEN RETURN false; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = public.wallets.balance + EXCLUDED.balance, updated_at = now();
  INSERT INTO public.notifications (user_id, kind, title, body)
  VALUES (_user_id, 'payment', 'Баланс пополнен', 'Зачислено ' || to_char(_amount, 'FM999999990.00') || ' ₽');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_wallet(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.spend_balance(_amount numeric, _description text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
DECLARE updated int;
BEGIN
  IF uid IS NULL OR _amount < 0 THEN RETURN false; END IF;
  IF _amount = 0 THEN RETURN true; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (uid, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance - _amount, updated_at = now()
  WHERE user_id = uid AND balance >= _amount;
  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN RETURN false; END IF;
  INSERT INTO public.wallet_transactions (user_id, kind, amount, status, description)
  VALUES (uid, 'purchase', _amount, 'succeeded', _description);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.spend_balance(numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_balance(numeric, text) TO service_role;
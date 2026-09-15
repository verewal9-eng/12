ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_library boolean NOT NULL DEFAULT true;

CREATE TABLE public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  status text NOT NULL DEFAULT 'owned',
  progress numeric NOT NULL DEFAULT 0,
  hours_played numeric NOT NULL DEFAULT 0,
  last_played timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_library TO authenticated;
GRANT ALL ON public.user_library TO service_role;

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own library readable" ON public.user_library
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_library.user_id AND p.show_library)
  );

CREATE POLICY "Users insert own library" ON public.user_library
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own library" ON public.user_library
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own library" ON public.user_library
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX user_library_user_idx ON public.user_library (user_id);

CREATE TRIGGER user_library_updated_at BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
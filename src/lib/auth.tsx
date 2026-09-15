import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string;
  bio: string;
  country: string;
  level: number;
  show_library: boolean;
  created_at: string;
};


type Ctx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string, fallbackName: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!data) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: uid, display_name: fallbackName })
        .select("*")
        .maybeSingle();
      setProfile((created as Profile) ?? null);
    } else {
      setProfile(data as Profile);
    }
    const { data: claimed } = await supabase.rpc("claim_first_admin");
    if (claimed) {
      setIsAdmin(true);
    } else {
      const { data: admin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      setIsAdmin(Boolean(admin));
    }
  }, []);

  const hydrate = useCallback(
    async (next: Session | null) => {
      setSession(next);
      if (!next?.user) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const fallback =
        (next.user.user_metadata?.["display_name"] as string | undefined) ??
        next.user.email?.split("@")[0] ??
        "Игрок";
      await load(next.user.id, fallback);
      setLoading(false);
    },
    [load],
  );

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) void hydrate(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED") {
        setSession(next);
        return;
      }
      void hydrate(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const value = useMemo<Ctx>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      isAdmin,
      loading,
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        await hydrate(data.session);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setIsAdmin(false);
      },
    }),
    [session, profile, isAdmin, loading, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

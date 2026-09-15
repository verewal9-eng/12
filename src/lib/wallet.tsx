import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createTopUp, checkoutCart } from "@/lib/wallet.functions";

export type WalletTx = {
  id: string;
  kind: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
};

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Ctx = {
  balance: number;
  transactions: WalletTx[];
  cart: string[];
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  inCart: (gameId: string) => boolean;
  addToCart: (gameId: string) => Promise<void>;
  removeFromCart: (gameId: string) => Promise<void>;
  checkout: () => Promise<{ ok: boolean; error: string | null }>;
  topUp: (amount: number) => Promise<string | null>;
  notify: (title: string, body?: string, kind?: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const WalletContext = createContext<Ctx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setBalance(0);
      setTransactions([]);
      setCart([]);
      setNotifications([]);
      setLoading(false);
      return;
    }
    const [wallet, txs, items, notes] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("id,kind,amount,status,description,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("cart_items").select("game_id"),
      supabase
        .from("notifications")
        .select("id,kind,title,body,read,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    setBalance(Number(wallet.data?.balance ?? 0));
    setTransactions(
      ((txs.data ?? []) as WalletTx[]).map((t) => ({ ...t, amount: Number(t.amount) })),
    );
    setCart((items.data ?? []).map((row) => row.game_id as string));
    setNotifications((notes.data ?? []) as AppNotification[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  // Баланс и уведомления приходят из вебхука оплаты — обновляем в реальном времени.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`wallet-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const value = useMemo<Ctx>(() => {
    const unread = notifications.filter((n) => !n.read).length;
    return {
      balance,
      transactions,
      cart,
      notifications,
      unread,
      loading,
      cartOpen,
      setCartOpen,
      inCart: (gameId) => cart.includes(gameId),
      addToCart: async (gameId) => {
        if (!userId || cart.includes(gameId)) return;
        setCart((prev) => [...prev, gameId]);
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, game_id: gameId });
        if (error) await refresh();
      },
      removeFromCart: async (gameId) => {
        setCart((prev) => prev.filter((id) => id !== gameId));
        if (!userId) return;
        await supabase.from("cart_items").delete().eq("user_id", userId).eq("game_id", gameId);
      },
      checkout: async () => {
        const result = await checkoutCart();
        await refresh();
        return { ok: result.ok, error: result.error };
      },
      topUp: async (amount) => {
        const returnUrl = `${window.location.origin}/wallet`;
        const result = await createTopUp({ data: { amount, returnUrl } });
        if (result.error || !result.url) return result.error ?? "Не удалось создать платёж";
        window.location.href = result.url;
        return null;
      },
      notify: async (title, body = "", kind = "info") => {
        if (!userId) return;
        const { data } = await supabase
          .from("notifications")
          .insert({ user_id: userId, title, body, kind })
          .select("id,kind,title,body,read,created_at")
          .maybeSingle();
        if (data) setNotifications((prev) => [data as AppNotification, ...prev]);
      },
      markAllRead: async () => {
        if (!userId || unread === 0) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("read", false);
      },
      refresh,
    };
  }, [balance, transactions, cart, notifications, loading, cartOpen, userId, refresh]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

export const formatRub = (value: number) =>
  `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;

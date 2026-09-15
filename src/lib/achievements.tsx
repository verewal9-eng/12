import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Achievement = {
  id: string;
  gameId: string;
  title: string;
  description: string;
  icon: string; // эмодзи или символ
  unlockedAt?: string; // ISO, если получено игроком
  custom?: boolean;
};

const STORAGE_KEY = "nebula-achievements-v1";

const baseTitles = [
  ["Первый шаг", "Завершите обучение"],
  ["Выживший", "Продержитесь 30 минут без смертей"],
  ["Коллекционер", "Соберите 25 предметов"],
  ["Мастер", "Пройдите главу на высокой сложности"],
  ["Исследователь", "Откройте все зоны карты"],
  ["Ветеран", "Наиграйте 10 часов"],
  ["Тактик", "Победите без единого выстрела"],
  ["Легенда", "Завершите игру на максимальной сложности"],
];

const icons = ["target", "shield", "swords", "flame", "skull", "moon", "star", "crosshair", "compass", "trophy"];

function seededDefaults(gameId: string): Achievement[] {
  let h = 0;
  for (let i = 0; i < gameId.length; i += 1) h = (h * 31 + gameId.charCodeAt(i)) | 0;
  const seed = Math.abs(h);
  return baseTitles.map(([title, description], i) => {
    const unlocked = (seed + i) % 3 === 0;
    const base: Achievement = {
      id: `${gameId}-base-${i}`,
      gameId,
      title: title!,
      description: description!,
      icon: icons[(seed + i) % icons.length]!,
    };
    if (!unlocked) return base;
    return {
      ...base,
      unlockedAt: new Date(2025, (seed + i) % 12, ((seed + i) % 27) + 1).toISOString(),
    };
  });
}

type Ctx = {
  getAchievements: (gameId: string) => Achievement[];
  addAchievement: (input: Omit<Achievement, "id" | "custom">) => void;
  removeAchievement: (id: string) => void;
};

const AchievementsContext = createContext<Ctx | null>(null);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<Achievement[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCustom(JSON.parse(raw) as Achievement[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch {
      /* ignore */
    }
  }, [custom, ready]);

  const getAchievements = useCallback(
    (gameId: string) => [...seededDefaults(gameId), ...custom.filter((a) => a.gameId === gameId)],
    [custom],
  );

  const value = useMemo<Ctx>(
    () => ({
      getAchievements,
      addAchievement: (input) =>
        setCustom((prev) => [
          ...prev,
          { ...input, id: `${input.gameId}-custom-${Date.now()}`, custom: true },
        ]),
      removeAchievement: (id) => setCustom((prev) => prev.filter((a) => a.id !== id)),
    }),
    [getAchievements],
  );

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error("useAchievements must be used inside AchievementsProvider");
  return ctx;
}

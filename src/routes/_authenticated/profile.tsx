import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Мой профиль — Nebula" },
      { name: "description", content: "Ваш игровой профиль Nebula: библиотека, часы в играх и друзья." },
      { property: "og:title", content: "Мой профиль — Nebula" },
      { property: "og:description", content: "Библиотека, часы в играх и друзья в Nebula." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyProfilePage,
});

function MyProfilePage() {
  const { user, loading } = useAuth();
  if (loading || !user) {
    return <p className="px-6 pt-8 text-sm text-muted-foreground">Загружаем профиль…</p>;
  }
  return <ProfileView userId={user.id} />;
}

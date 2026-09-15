import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/ProfileView";

export const Route = createFileRoute("/_authenticated/players/$userId")({
  head: () => ({
    meta: [
      { title: "Профиль игрока — Nebula" },
      { name: "description", content: "Профиль игрока Nebula: статус, описание и уровень аккаунта." },
      { property: "og:title", content: "Профиль игрока — Nebula" },
      { property: "og:description", content: "Смотрите профили других игроков Nebula." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayerProfilePage,
});

function PlayerProfilePage() {
  const { userId } = Route.useParams();
  return <ProfileView userId={userId} />;
}

import { games } from "@/lib/games";

export type Friend = {
  id: string;
  name: string;
  avatar: string;
};

export const currentUser = {
  id: "desmond-miles",
  name: "Desmond Miles",
};

export const friends: Friend[] = [
  { id: "cujo", name: "Cujo", avatar: games[0]!.image },
  { id: "unrealistic", name: "Unrealistic.-", avatar: games[1]!.image },
  { id: "4kalpha", name: "4KALPHA", avatar: games[2]!.image },
  { id: "antodaido", name: "ANTODAIDO", avatar: games[3]!.image },
  { id: "basicallylep", name: "basicallyLEP", avatar: games[4]!.image },
  { id: "codexxx0", name: "codexxx0", avatar: games[5]!.image },
  { id: "mirage", name: "MIRAGE_77", avatar: games[1]!.image },
  { id: "polarfox", name: "polarfox", avatar: games[3]!.image },
  { id: "vexxa", name: "Vexxa", avatar: games[2]!.image },
  { id: "kirasan", name: "kira-san", avatar: games[4]!.image },
];

// Deterministic pseudo-random so данные не прыгают при перерисовке.
function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type FriendActivity = {
  friend: Friend;
  owns: boolean;
  playingNow: boolean;
  hours: number;
};

export function getFriendActivity(gameId: string): FriendActivity[] {
  return friends.map((friend) => {
    const seed = hash(`${gameId}:${friend.id}`);
    const owns = seed % 10 < 7;
    return {
      friend,
      owns,
      playingNow: owns && seed % 7 < 2,
      hours: owns ? 3 + (seed % 180) : 0,
    };
  });
}

export function getGameOwners(gameId: string) {
  const activity = getFriendActivity(gameId);
  const owners = activity.filter((a) => a.owns);
  const playing = owners.filter((a) => a.playingNow);
  const extra = 48 + (hash(gameId) % 40);
  return { owners, playing, totalOwners: owners.length + extra };
}

// Кто загрузил игру в магазин (владелец страницы игры и её достижений).
const publishers: Record<string, string> = {
  "nova-protocol": currentUser.id,
  "neon-drift": currentUser.id,
};

export function getPublisherId(gameId: string) {
  return publishers[gameId] ?? "studio";
}

export function isPublisher(gameId: string) {
  return getPublisherId(gameId) === currentUser.id;
}

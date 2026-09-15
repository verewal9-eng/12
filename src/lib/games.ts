import game1 from "@/assets/game-1.jpg";
import game2 from "@/assets/game-2.jpg";
import game3 from "@/assets/game-3.jpg";
import game4 from "@/assets/game-4.jpg";
import game5 from "@/assets/game-5.jpg";
import game6 from "@/assets/game-6.jpg";

export type Game = {
  id: string;
  title: string;
  studio: string;
  description: string;
  tags: string[];
  price: number;
  discount: number;
  sizeGb: number;
  rating: string;
  image: string;
  fileName: string;
  /** путь установщика в хранилище (для игр, загруженных админом) */
  installerPath?: string;
  remote?: boolean;
};

export const staticGames: Game[] = [
  {
    id: "nova-protocol",
    title: "Nova Protocol",
    studio: "Helix Interactive",
    description:
      "Одиночный сай-фай шутер: исследуйте руины древней цивилизации, собирайте экзо-модули и остановите коллапс портала.",
    tags: ["Шутер", "Sci-Fi", "Одиночная"],
    price: 1899,
    discount: 40,
    sizeGb: 62,
    rating: "Крайне положительные",
    image: game1,
    fileName: "NovaProtocol_Setup.exe",
  },
  {
    id: "dragonfall-saga",
    title: "Dragonfall Saga",
    studio: "Ember Forge",
    description:
      "Открытый мир в духе классических RPG: три королевства, живая экономика и драконы, которые помнят ваши поступки.",
    tags: ["RPG", "Открытый мир", "Фэнтези"],
    price: 2499,
    discount: 0,
    sizeGb: 88,
    rating: "Очень положительные",
    image: game2,
    fileName: "DragonfallSaga_Setup.exe",
  },
  {
    id: "neon-drift",
    title: "Neon Drift",
    studio: "Apex Loop",
    description:
      "Ночные гонки по мокрому неоновому мегаполису. Онлайн-заезды 12 игроков и глубокий тюнинг.",
    tags: ["Гонки", "Онлайн", "Аркада"],
    price: 1299,
    discount: 25,
    sizeGb: 34,
    rating: "Положительные",
    image: game3,
    fileName: "NeonDrift_Setup.exe",
  },
  {
    id: "harvest-haven",
    title: "Harvest Haven",
    studio: "Tiny Lantern",
    description: "Уютный пиксельный симулятор фермы: сезоны, соседи, рыбалка и кооператив на 4 игроков.",
    tags: ["Симулятор", "Пиксель", "Кооп"],
    price: 699,
    discount: 0,
    sizeGb: 4,
    rating: "Крайне положительные",
    image: game4,
    fileName: "HarvestHaven_Setup.exe",
  },
  {
    id: "silent-ward",
    title: "Silent Ward",
    studio: "Grey Static",
    description: "Хоррор на выживание в заброшенной больнице. Ограниченный свет, ресурсы и никаких вторых шансов.",
    tags: ["Хоррор", "Выживание", "Атмосфера"],
    price: 1499,
    discount: 60,
    sizeGb: 27,
    rating: "Очень положительные",
    image: game5,
    fileName: "SilentWard_Setup.exe",
  },
  {
    id: "desert-vanguard",
    title: "Desert Vanguard",
    studio: "Ironline Games",
    description: "Тактический шутер 5 на 5: планирование штурма, разрушаемые укрытия и рейтинговые сезоны.",
    tags: ["Тактика", "Шутер", "PvP"],
    price: 0,
    discount: 0,
    sizeGb: 45,
    rating: "Смешанные",
    image: game6,
    fileName: "DesertVanguard_Setup.exe",
  },
];

/** Общий каталог: игры, загруженные админами, плюс демо-каталог. */
export const games: Game[] = [...staticGames];

export function setRemoteGames(list: Game[]) {
  games.splice(0, games.length, ...list, ...staticGames);
}

export const getGame = (id: string): Game | undefined => games.find((g) => g.id === id);

export const finalPrice = (g: Game) => Math.round((g.price * (100 - g.discount)) / 100);

export const formatPrice = (value: number) =>
  value === 0 ? "Бесплатно" : `${value.toLocaleString("ru-RU")} ₽`;

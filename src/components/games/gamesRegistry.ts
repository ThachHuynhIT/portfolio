/** The online games sharing the games layout (top bar tabs, all-rooms panel). */
export interface OnlineGame {
  id: "tienlen" | "meono" | "typhu" | "splendor" | "bang";
  title: string;
  /** Short label for tabs and room rows. */
  short: string;
  emoji: string;
  /** Route of the lobby; tables live at `${href}/${code}`. */
  href: string;
  /** Open-rooms endpoint on the be_game backend. */
  roomsPath: string;
  maxPlayers: number;
}

export const ONLINE_GAMES: readonly OnlineGame[] = [
  { id: "tienlen", title: "Tiến Lên Miền Nam", short: "Tiến Lên", emoji: "🃏", href: "/tien-len", roomsPath: "/api/rooms", maxPlayers: 4 },
  { id: "meono", title: "Mèo Nổ", short: "Mèo Nổ", emoji: "😼", href: "/meo-no", roomsPath: "/api/meono/rooms", maxPlayers: 7 },
  { id: "typhu", title: "Cờ Tỷ Phú", short: "Tỷ Phú", emoji: "🎩", href: "/co-ty-phu", roomsPath: "/api/typhu/rooms", maxPlayers: 6 },
  { id: "splendor", title: "Đá Quý (Splendor)", short: "Đá Quý", emoji: "💎", href: "/splendor", roomsPath: "/api/splendor/rooms", maxPlayers: 4 },
  { id: "bang", title: "Đấu Súng (Bang!)", short: "Đấu Súng", emoji: "🤠", href: "/bang", roomsPath: "/api/bang/rooms", maxPlayers: 8 },
];

/** Route prefixes rendered inside the games layout (site header/footer hidden). */
export const GAMES_ROUTE_PREFIXES = ["/games", ...ONLINE_GAMES.map((g) => g.href)] as const;

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isGamesRoute = (pathname: string | null | undefined) => !!pathname && GAMES_ROUTE_PREFIXES.some((p) => matches(pathname, p));

export const gameOfPath = (pathname: string | null | undefined) => (pathname ? ONLINE_GAMES.find((g) => matches(pathname, g.href)) ?? null : null);

/** "hub" = /games, "lobby" = a game's lobby, "table" = a room of a game. */
export function gamesPageKind(pathname: string | null | undefined): "hub" | "lobby" | "table" {
  const game = gameOfPath(pathname);
  if (!game || !pathname) return "hub";
  return pathname.replace(/\/$/, "") === game.href ? "lobby" : "table";
}

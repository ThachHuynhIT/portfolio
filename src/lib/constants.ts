import { GAMES_ROUTE_PREFIXES } from "@/components/games/gamesRegistry";

/**
 * Route prefixes that stay dark-only and are excluded from the light/dark
 * theme toggle (admin CMS, arcade game, standalone couple page, music
 * lounge — its Nebula/Aurora look is dark-only by design — and every games
 * route, taken from the games registry so new games are covered automatically).
 */
export const EXCLUDED_ROUTE_PREFIXES: readonly string[] = ["/admin", "/contra", "/couple", "/music", ...GAMES_ROUTE_PREFIXES];

/** Whether `pathname` is one of the dark-only routes: the prefix itself or a page under it ("/bang/X", not "/bangxyz"). */
export const isExcludedRoute = (pathname: string | null | undefined): boolean =>
  !!pathname && EXCLUDED_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Route prefixes that stay dark-only and are excluded from the light/dark
 * theme toggle (admin CMS, standalone couple page, music lounge — its
 * Nebula/Aurora look is dark-only by design).
 */
export const EXCLUDED_ROUTE_PREFIXES: readonly string[] = ["/admin", "/couple", "/music"];

/** Whether `pathname` is one of the dark-only routes: the prefix itself or a page under it ("/music/X", not "/musicxyz"). */
export const isExcludedRoute = (pathname: string | null | undefined): boolean =>
  !!pathname && EXCLUDED_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

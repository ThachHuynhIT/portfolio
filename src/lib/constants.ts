/**
 * Route prefixes that stay dark-only and are excluded from the light/dark
 * theme toggle (admin CMS, arcade game, standalone couple page).
 */
export const EXCLUDED_ROUTE_PREFIXES = ["/admin", "/contra", "/couple"] as const;

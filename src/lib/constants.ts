/**
 * Route prefixes that stay dark-only and are excluded from the light/dark
 * theme toggle (admin CMS, arcade game, standalone couple page, music
 * lounge — its Nebula/Aurora look is dark-only by design).
 */
export const EXCLUDED_ROUTE_PREFIXES = ["/admin", "/contra", "/couple", "/music", "/tien-len", "/meo-no", "/co-ty-phu", "/splendor", "/bang", "/games"] as const;

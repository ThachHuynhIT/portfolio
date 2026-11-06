// Builds the inline blocking <script> the root layout emits before hydration
// to set data-theme on <html> pre-paint (no flash of the wrong theme).
//
// KEEP IN SYNC WITH detectPreferredTheme()/isExcludedRoute() in
// src/context/ThemeContext.tsx and src/lib/constants.ts (theme-init.test.ts
// checks the prefix matching against isExcludedRoute()).
//
// The output is a single line with no "<", "\r" or "\n" so its bytes are
// exactly what the browser hashes. Its sha256 is pinned in the report-only
// CSP in next.config.js (THEME_INIT_SCRIPT_HASH); security-headers.test.ts
// fails if the two drift.

import { EXCLUDED_ROUTE_PREFIXES } from "@/lib/constants";

export function buildThemeInitScript(prefixes: readonly string[]): string {
  return [
    "(function(){try{",
    `var excluded=${JSON.stringify(prefixes)};`,
    "var path=window.location.pathname;",
    'if(excluded.some(function(p){return path===p||path.indexOf(p+"/")===0})){',
    'document.documentElement.setAttribute("data-theme","dark");',
    "return;",
    "}",
    "var stored=null;",
    'try{stored=localStorage.getItem("portfolio_theme");}catch(e){}',
    'var theme=stored==="light"||stored==="dark"?stored:',
    '(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");',
    'document.documentElement.setAttribute("data-theme",theme);',
    "}catch(e){}})();",
  ].join("");
}

export const THEME_INIT_SCRIPT = buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES);

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { EXCLUDED_ROUTE_PREFIXES } from "@/lib/constants";

export type Theme = "light" | "dark";

interface ThemeContextType {
  /** The user's chosen/detected preference, independent of the current route. */
  theme: Theme;
  /** `theme`, forced to "dark" while on a route excluded from theming. */
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "portfolio_theme";

function isExcludedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// KEEP IN SYNC WITH the inline blocking script in src/app/layout.tsx —
// both must resolve the same theme from the same inputs to avoid a
// flash of incorrect theme between first paint and hydration.
function detectPreferredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore localStorage read errors in restricted contexts
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function hasStoredTheme(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>("dark");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setThemeState(detectPreferredTheme());
    setIsMounted(true);

    // Track live OS theme changes only while the user hasn't made an explicit choice.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (!hasStoredTheme()) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme: Theme = isExcludedRoute(pathname) ? "dark" : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore write errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

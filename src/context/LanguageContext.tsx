"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Locale,
  defaultLocale,
  translations,
  localeNames,
  TranslationDict,
} from "@/locales";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  localeInfo: { name: string; nativeName: string; flag: string };
  isMounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "portfolio_locale";

/**
 * Safely resolves nested object paths (e.g., "about.stats.years")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (savedLocale && (savedLocale === "en" || savedLocale === "vi")) {
        setLocaleState(savedLocale);
      } else {
        // Auto-detect from browser
        const browserLang = navigator.language?.toLowerCase() || "";
        if (browserLang.startsWith("vi")) {
          setLocaleState("vi");
        }
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // Ignore write errors
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = translations[locale] as unknown as Record<string, unknown>;
      const fallbackDict = translations[defaultLocale] as unknown as Record<string, unknown>;

      let text = getNestedValue(activeDict, key) ?? getNestedValue(fallbackDict, key) ?? key;

      // Replace interpolation parameters like {name} or {{name}}
      if (params && typeof text === "string") {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text
            .replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue))
            .replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
        });
      }

      return text;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localeInfo: localeNames[locale],
        isMounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, locale, setLocale, localeInfo, isMounted } = useLanguage();
  return { t, locale, setLocale, localeInfo, isMounted };
}

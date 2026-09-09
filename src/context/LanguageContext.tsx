"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  Locale,
  defaultLocale,
  translations,
  localeNames,
  type TranslationDict,
} from "@/locales";

export type TranslationFunction = ((
  key: string,
  paramsOrFallback?: Record<string, string | number> | string,
  params?: Record<string, string | number>
) => string) & TranslationDict;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
  localeInfo: { name: string; nativeName: string; flag: string };
  isMounted: boolean;
  refreshOverrides: () => Promise<void>;
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
    let initialLocale: Locale = defaultLocale;

    try {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (savedLocale && (savedLocale === "en" || savedLocale === "vi")) {
        initialLocale = savedLocale;
      } else {
        // Auto-detect from browser language
        const browserLang = navigator.language?.toLowerCase() || "";
        if (browserLang.startsWith("vi")) {
          initialLocale = "vi";
        }
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }

    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore write errors
    }
  }, []);

  const tFn = useCallback(
    (
      key: string,
      paramsOrFallback?: Record<string, string | number> | string,
      params?: Record<string, string | number>
    ): string => {
      const fallbackStr = typeof paramsOrFallback === "string" ? paramsOrFallback : undefined;
      const actualParams = typeof paramsOrFallback === "object" ? paramsOrFallback : params;

      // 1. Check bundled static dictionary
      const activeDict = translations[locale] as unknown as Record<string, unknown>;
      const fallbackDict = translations[defaultLocale] as unknown as Record<string, unknown>;

      let text =
        getNestedValue(activeDict, key) ??
        getNestedValue(fallbackDict, key) ??
        fallbackStr ??
        key;

      // 2. Replace interpolation parameters like {name} or {{name}}
      if (actualParams && typeof text === "string") {
        Object.entries(actualParams).forEach(([paramKey, paramValue]) => {
          text = text
            .replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue))
            .replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
        });
      }

      return text;
    },
    [locale]
  );

  const t = useMemo(() => {
    const activeDict = translations[locale] || translations[defaultLocale];
    return new Proxy(tFn, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        return (activeDict as any)[prop];
      },
    }) as TranslationFunction;
  }, [tFn, locale]);

  const refreshOverrides = useCallback(async () => {
    // No-op: translations are bundled statically in src/locales/
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localeInfo: localeNames[locale],
        isMounted,
        refreshOverrides,
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
  const { t, locale, setLocale, localeInfo, isMounted, refreshOverrides } = useLanguage();
  return { t, locale, setLocale, localeInfo, isMounted, refreshOverrides };
}

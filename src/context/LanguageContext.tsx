"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  Locale,
  defaultLocale,
  defaultDictionary,
  localeNames,
  type TranslationDict,
} from "@/locales";
import {
  createLocaleSwitcher,
  createTranslationFunction,
  loadDictionary,
  resolveInitialLocale,
  type TranslationFunction,
} from "@/lib/locale-loader";

export type { TranslationFunction };

interface LanguageContextType {
  locale: Locale;
  /** Resolves once the locale is applied (or the switch failed/was superseded); never rejects. */
  setLocale: (locale: Locale) => Promise<void>;
  t: TranslationFunction;
  localeInfo: { name: string; nativeName: string; flag: string };
  isMounted: boolean;
  refreshOverrides: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "portfolio_locale";

interface ActiveLocale {
  locale: Locale;
  dictionary: TranslationDict;
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `${STORAGE_KEY}=${locale};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    // Ignore write errors
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR and the first client render always use the static EN dictionary.
  const [active, setActive] = useState<ActiveLocale>({
    locale: defaultLocale,
    dictionary: defaultDictionary,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [failedLocale, setFailedLocale] = useState<Locale | null>(null);

  // One switcher for mount and user switches: its generation counter makes
  // the latest request win, and a failed load leaves `active` untouched.
  const switcherRef = useRef<ReturnType<typeof createLocaleSwitcher> | null>(null);
  if (switcherRef.current === null) {
    switcherRef.current = createLocaleSwitcher({
      load: loadDictionary,
      commit: (locale, dictionary) => {
        setActive((prev) =>
          prev.locale === locale && prev.dictionary === dictionary ? prev : { locale, dictionary }
        );
        setFailedLocale(null);
        document.documentElement.lang = locale;
      },
      onError: (error, locale) => {
        console.error(`Failed to load "${locale}" translations:`, error);
        setFailedLocale(locale);
      },
    });
  }

  useEffect(() => {
    setIsMounted(true);
    let saved: string | null = null;
    let browserLanguage: string | undefined;

    try {
      saved = localStorage.getItem(STORAGE_KEY);
      browserLanguage = navigator.language;
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }

    void switcherRef.current?.request(resolveInitialLocale(saved, browserLanguage));
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    const result = await switcherRef.current?.request(newLocale);
    if (result === "committed") persistLocale(newLocale);
  }, []);

  const t = useMemo(
    () => createTranslationFunction(active.dictionary, defaultDictionary),
    [active.dictionary]
  );

  const refreshOverrides = useCallback(async () => {
    // No-op: translations are bundled in src/locales/
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({
      locale: active.locale,
      setLocale,
      t,
      localeInfo: localeNames[active.locale],
      isMounted,
      refreshOverrides,
    }),
    [active.locale, setLocale, t, isMounted, refreshOverrides]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <span className="sr-only" role="status" aria-live="polite">
        {failedLocale
          ? `Could not load ${localeNames[failedLocale].name}. Showing ${localeNames[active.locale].name}.`
          : ""}
      </span>
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

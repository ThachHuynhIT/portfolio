import { en, type TranslationDict } from "./en";

export type Locale = "en" | "vi";

export const defaultLocale: Locale = "en";

/**
 * The static default/SSR dictionary. Other locales are loaded on demand by
 * src/lib/locale-loader.ts (dynamic import), so they stay out of the initial
 * bundle — do not import ./vi statically from here.
 */
export const defaultDictionary: TranslationDict = en;

export const localeNames: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: {
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  vi: {
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
  },
};

export type { TranslationDict };

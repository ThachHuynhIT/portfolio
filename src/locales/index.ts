import { en, type TranslationDict } from "./en";
import { vi } from "./vi";

export type Locale = "en" | "vi";

export const translations: Record<Locale, TranslationDict> = {
  en,
  vi,
};

export const defaultLocale: Locale = "en";

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

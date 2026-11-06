import { defaultDictionary, defaultLocale, type Locale, type TranslationDict } from "@/locales";

/**
 * Locale dictionary loading. EN is the static default/SSR dictionary; VI is
 * fetched with a dynamic import() only when it becomes the active locale, so
 * the initial bundle never carries it.
 */

export type TranslationParams = Record<string, string | number>;

export type TranslationFunction = ((
  key: string,
  paramsOrFallback?: TranslationParams | string,
  params?: TranslationParams
) => string) &
  TranslationDict;

/** Importers for every locale except EN, which is the static default dictionary. */
export type LocaleImporters = Record<Exclude<Locale, "en">, () => Promise<TranslationDict>>;

const defaultImporters: LocaleImporters = {
  vi: () => import("@/locales/vi").then((mod) => mod.vi),
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "vi";
}

/**
 * Picks the locale to apply after mount: a valid saved choice wins, otherwise
 * a Vietnamese browser language selects VI, otherwise EN.
 */
export function resolveInitialLocale(
  saved: string | null | undefined,
  browserLanguage: string | null | undefined
): Locale {
  if (isLocale(saved)) return saved;
  if ((browserLanguage ?? "").toLowerCase().startsWith("vi")) return "vi";
  return defaultLocale;
}

/**
 * Returns a loader that resolves EN immediately and imports other locales on
 * demand. Successful loads are cached; failed ones are not, so a retry works.
 */
export function createDictionaryLoader(importers: LocaleImporters = defaultImporters) {
  const cache = new Map<Locale, Promise<TranslationDict>>();

  return function loadDictionary(locale: Locale): Promise<TranslationDict> {
    if (locale === "en") return Promise.resolve(defaultDictionary);

    const cached = cache.get(locale);
    if (cached) return cached;

    const pending = importers[locale]();
    cache.set(locale, pending);
    pending.catch(() => {
      if (cache.get(locale) === pending) cache.delete(locale);
    });
    return pending;
  };
}

export const loadDictionary = createDictionaryLoader();

export type LocaleSwitchResult = "committed" | "stale" | "failed";

/**
 * Serialises locale requests with a generation counter: only the most recent
 * request may commit, so a slow older load never overwrites a newer choice.
 * A failed load commits nothing, leaving the previous locale in place.
 */
export function createLocaleSwitcher(options: {
  load: (locale: Locale) => Promise<TranslationDict>;
  commit: (locale: Locale, dictionary: TranslationDict) => void;
  onError?: (error: unknown, locale: Locale) => void;
}) {
  let generation = 0;

  return {
    async request(locale: Locale): Promise<LocaleSwitchResult> {
      const current = ++generation;
      try {
        const dictionary = await options.load(locale);
        if (current !== generation) return "stale";
        options.commit(locale, dictionary);
        return "committed";
      } catch (error) {
        if (current !== generation) return "stale";
        options.onError?.(error, locale);
        return "failed";
      }
    },
  };
}

/** Resolves a dotted path ("about.stats.years") to a string leaf. */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  let current: unknown = obj;

  for (const part of path.split(".")) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Looks up `key` in the active dictionary, then the default dictionary, then
 * the explicit fallback string, then returns the key. `{name}` and
 * `{{name}}` placeholders are replaced from params.
 */
export function translate(
  activeDict: Record<string, unknown>,
  fallbackDict: Record<string, unknown>,
  key: string,
  paramsOrFallback?: TranslationParams | string,
  params?: TranslationParams
): string {
  const fallbackStr = typeof paramsOrFallback === "string" ? paramsOrFallback : undefined;
  const actualParams = typeof paramsOrFallback === "object" ? paramsOrFallback : params;

  let text =
    getNestedValue(activeDict, key) ?? getNestedValue(fallbackDict, key) ?? fallbackStr ?? key;

  if (actualParams) {
    for (const [paramKey, paramValue] of Object.entries(actualParams)) {
      text = text
        .replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue))
        .replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
    }
  }

  return text;
}

/**
 * Builds `t`: callable as t("hero.greeting") and readable as t.hero.greeting,
 * both backed by the same dictionary.
 */
export function createTranslationFunction(
  dictionary: TranslationDict,
  fallbackDictionary: TranslationDict = defaultDictionary
): TranslationFunction {
  const active = dictionary as unknown as Record<string, unknown>;
  const fallback = fallbackDictionary as unknown as Record<string, unknown>;

  const fn = (
    key: string,
    paramsOrFallback?: TranslationParams | string,
    params?: TranslationParams
  ): string => translate(active, fallback, key, paramsOrFallback, params);

  return new Proxy(fn, {
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver);
      return Reflect.get(active, prop);
    },
  }) as TranslationFunction;
}

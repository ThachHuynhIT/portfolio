import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi as vitest } from "vitest";
import { en, type TranslationDict } from "@/locales/en";
import {
  createDictionaryLoader,
  createLocaleSwitcher,
  createTranslationFunction,
  resolveInitialLocale,
  translate,
} from "./locale-loader";

// Fixture standing in for the VI dictionary: same shape as EN with a few
// distinct strings. The real vi.ts is never imported by these tests.
const viFixture: TranslationDict = {
  ...en,
  common: { ...en.common, loading: "Dang tai..." },
  hero: { ...en.hero, greeting: "Xin chao", viewWork: "Xem du an" },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("locale-loader", () => {
  it("loads_vi_only_when_selected", async () => {
    const importVi = vitest.fn(async () => viFixture);
    const load = createDictionaryLoader({ vi: importVi });

    await expect(load("en")).resolves.toBe(en);
    expect(importVi).not.toHaveBeenCalled();

    await expect(load("vi")).resolves.toBe(viFixture);
    await expect(load("vi")).resolves.toBe(viFixture);
    expect(importVi).toHaveBeenCalledTimes(1);

    // The loader module must not pull VI into the bundle statically.
    const source = readFileSync(
      fileURLToPath(new URL("./locale-loader.ts", import.meta.url)),
      "utf8"
    );
    expect(source).not.toMatch(/^import[^;]*["']@\/locales\/vi["']/m);
    const index = readFileSync(
      fileURLToPath(new URL("../locales/index.ts", import.meta.url)),
      "utf8"
    );
    expect(index).not.toMatch(/^(import|export)[^;]*["']\.\/vi["']/m);
  });

  it("latest_switch_wins_when_promises_reverse", async () => {
    const slowVi = deferred<TranslationDict>();
    const commits: string[] = [];
    const switcher = createLocaleSwitcher({
      load: (locale) => (locale === "vi" ? slowVi.promise : Promise.resolve(en)),
      commit: (locale) => commits.push(locale),
    });

    const first = switcher.request("vi");
    const second = switcher.request("en");
    await expect(second).resolves.toBe("committed");

    slowVi.resolve(viFixture);
    await expect(first).resolves.toBe("stale");
    expect(commits).toEqual(["en"]);
  });

  it("failed_load_preserves_previous_dictionary", async () => {
    let current: { locale: string; dict: TranslationDict } = { locale: "en", dict: en };
    const failures: unknown[] = [];
    const load = createDictionaryLoader({
      vi: () => Promise.reject(new Error("chunk failed")),
    });
    const switcher = createLocaleSwitcher({
      load,
      commit: (locale, dict) => {
        current = { locale, dict };
      },
      onError: (error) => failures.push(error),
    });

    await expect(switcher.request("vi")).resolves.toBe("failed");
    expect(current.locale).toBe("en");
    expect(current.dict).toBe(en);
    expect(failures).toHaveLength(1);
  });

  it("failed_load_is_retried_by_the_same_loader", async () => {
    const importVi = vitest
      .fn<() => Promise<TranslationDict>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(viFixture);
    const load = createDictionaryLoader({ vi: importVi });

    await expect(load("vi")).rejects.toThrow("offline");
    await expect(load("vi")).resolves.toBe(viFixture);
    expect(importVi).toHaveBeenCalledTimes(2);
  });

  it("property_and_function_access_agree", () => {
    for (const dict of [en, viFixture]) {
      const t = createTranslationFunction(dict, en);
      expect(t.hero.greeting).toBe(dict.hero.greeting);
      expect(t("hero.greeting")).toBe(t.hero.greeting);
      expect(t("common.loading")).toBe(t.common.loading);
      expect(t.nav.home).toBe(t("nav.home"));
    }
    const tVi = createTranslationFunction(viFixture, en);
    expect(tVi("hero.greeting")).toBe("Xin chao");
    expect(tVi.hero.viewWork).toBe("Xem du an");
  });

  it("interpolation_and_explicit_fallback", () => {
    const active = { greet: "Hi {name}, {{name}}! {count} new" };
    const fallback = { greet: "unused", onlyFallback: "From EN {name}" };

    expect(translate(active, fallback, "greet", { name: "Thach", count: 3 })).toBe(
      "Hi Thach, Thach! 3 new"
    );
    // Missing in active -> default dictionary, still interpolated.
    expect(translate(active, fallback, "onlyFallback", undefined, { name: "A" })).toBe(
      "From EN A"
    );
    // Explicit fallback string, with params in the third argument.
    expect(translate(active, fallback, "missing.key", "Fallback {x}", { x: 1 })).toBe(
      "Fallback 1"
    );
    // No fallback at all -> the key itself.
    expect(translate(active, fallback, "missing.key")).toBe("missing.key");
    // Non-string leaves are not returned as text.
    expect(translate({ group: { a: "x" } }, {}, "group", "fb")).toBe("fb");
  });

  it("invalid_saved_locale_defaults_en", () => {
    expect(resolveInitialLocale("fr", "en-US")).toBe("en");
    expect(resolveInitialLocale(null, undefined)).toBe("en");
    expect(resolveInitialLocale("", "")).toBe("en");
    expect(resolveInitialLocale("vi", "en-US")).toBe("vi");
    expect(resolveInitialLocale("en", "vi-VN")).toBe("en");
    // Existing behaviour: with no valid saved choice, a Vietnamese browser picks VI.
    expect(resolveInitialLocale("xx", "vi-VN")).toBe("vi");
  });
});

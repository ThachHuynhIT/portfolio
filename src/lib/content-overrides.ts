/**
 * Resolves a single bilingual copy override field against its locale-default
 * fallback. Overrides live in SiteConfig.sectionsContent (per homepage
 * section, per locale) and are optional/sparse — an unset or blank override
 * for the *active* locale falls back to that locale's own default (already
 * resolved via useTranslation()'s t(), which itself falls back en -> vi
 * internally), never to the override set for the *other* locale. This keeps
 * "only EN was overridden" from leaking English text onto the VI site.
 *
 * An override that was explicitly cleared (saved as "") resolves to "" so
 * the caller can hide that element; only an *unset* override (undefined/null)
 * falls back to the default.
 */
export function resolveSectionText(
  locale: "en" | "vi",
  overrideEn: string | undefined | null,
  overrideVi: string | undefined | null,
  fallback: string
): string {
  const raw = locale === "vi" ? overrideVi : overrideEn;
  if (raw === undefined || raw === null) return fallback;
  return raw.trim() ? raw : "";
}

/**
 * Like resolveSectionText(), but for text a control can't work without
 * (submit button labels, validation/error messages, aria-labels): a cleared
 * override falls back to the default instead of resolving to "".
 */
export function resolveRequiredText(
  locale: "en" | "vi",
  overrideEn: string | undefined | null,
  overrideVi: string | undefined | null,
  fallback: string
): string {
  return resolveSectionText(locale, overrideEn, overrideVi, fallback) || fallback;
}

/**
 * Picks the active locale's value for a site-config field that has an
 * optional `_vi` translation: a blank VI value falls back to the EN one
 * (as the admin form promises), and a blank EN value resolves to "".
 */
export function pickLocalized(
  locale: "en" | "vi",
  en: string | undefined | null,
  vi: string | undefined | null
): string {
  if (locale === "vi" && vi?.trim()) return vi;
  return en?.trim() ? en : "";
}

export function resolveStatValue(
  locale: "en" | "vi",
  stat: { value?: string; value_vi?: string } | undefined,
  fallback: string
): string {
  return resolveSectionText(locale, stat?.value, stat?.value_vi, fallback);
}

// Blog posts store `readTime` and `category` as free-text fields with no
// `_vi` counterpart (unlike title/excerpt/content). These derive a Vietnamese
// display value from the English original instead of requiring a schema
// change, falling back to the raw value when it can't be translated.
export function translateReadTime(
  readTime: string,
  locale: "en" | "vi",
  minReadLabel: string
): string {
  if (locale !== "vi") return readTime;
  const match = readTime.match(/\d+/);
  return match ? `${match[0]} ${minReadLabel}` : readTime;
}

const BLOG_CATEGORY_VI: Record<string, string> = {
  tutorial: "Hướng dẫn",
  development: "Phát triển",
  design: "Thiết kế",
  news: "Tin tức",
  tips: "Mẹo hay",
  guide: "Hướng dẫn",
  opinion: "Góc nhìn",
  announcement: "Thông báo",
  tools: "Công cụ",
  "case study": "Nghiên cứu tình huống",
};

export function translateBlogCategory(category: string, locale: "en" | "vi"): string {
  if (locale !== "vi") return category;
  return BLOG_CATEGORY_VI[category.trim().toLowerCase()] ?? category;
}

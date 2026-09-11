/**
 * Resolves a single bilingual copy override field against its locale-default
 * fallback. Overrides live in SiteConfig.sectionsContent (per homepage
 * section, per locale) and are optional/sparse — an unset or blank override
 * for the *active* locale falls back to that locale's own default (already
 * resolved via useTranslation()'s t(), which itself falls back en -> vi
 * internally), never to the override set for the *other* locale. This keeps
 * "only EN was overridden" from leaking English text onto the VI site.
 */
export function resolveSectionText(
  locale: "en" | "vi",
  overrideEn: string | undefined | null,
  overrideVi: string | undefined | null,
  fallback: string
): string {
  const raw = locale === "vi" ? overrideVi : overrideEn;
  return raw && raw.trim() ? raw : fallback;
}

export function resolveStatValue(
  locale: "en" | "vi",
  stat: { value?: string; value_vi?: string } | undefined,
  fallback: string
): string {
  return resolveSectionText(locale, stat?.value, stat?.value_vi, fallback);
}

"use client";

import { useTranslation } from "@/context/LanguageContext";
import { resolveSectionText } from "@/lib/content-overrides";
import type { SiteConfig } from "@/lib/types";
import HeroCanvas from "./HeroCanvas";
import HeroActions from "./HeroActions";

export interface HeroSectionProps { siteConfig: SiteConfig }
export default function HeroSection({ siteConfig }: HeroSectionProps) {
  const { t, locale } = useTranslation();
  const hero = siteConfig.sectionsContent?.hero;
  const name = siteConfig.author.name?.trim() || t("hero.name");
  const role = (locale === "vi" ? siteConfig.author.title_vi?.trim() : undefined)
    || siteConfig.author.title?.trim() || t("hero.role");
  const context = resolveSectionText(locale, hero?.bio, hero?.bio_vi, t("hero.context"));
  const available = resolveSectionText(locale, hero?.available, hero?.available_vi, t("hero.available"));
  const viewWork = resolveSectionText(locale, hero?.viewWork, hero?.viewWork_vi, t("hero.viewWork"));
  const viewCV = resolveSectionText(locale, hero?.viewCV, hero?.viewCV_vi, t("hero.viewCV"));

  return <section id="home" className="portfolio-hero relative isolate flex min-h-[100svh] items-center overflow-hidden bg-portfolio-void pt-28 pb-12">
    <HeroCanvas />
    <div aria-hidden="true" className="portfolio-hero-scrim pointer-events-none absolute inset-0 z-[1]" />
    <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4">
      <div className="portfolio-hero-copy max-w-[42rem]">
        {available && <p className="mb-4 flex items-center gap-2 text-sm text-portfolio-dust">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
          {available}
        </p>}
        {name && <h1 className="portfolio-hero-name mb-6 text-[clamp(2.25rem,6.1vw,5.5rem)] leading-[1.12] font-extrabold tracking-[-0.035em] text-portfolio-ink">{name}</h1>}
        {role && <p className="portfolio-hero-role mb-4 text-xl font-semibold text-portfolio-ink md:text-2xl">{role}</p>}
        {context && <p className="portfolio-hero-context max-w-[42ch] text-base leading-relaxed text-portfolio-dust md:text-lg">{context}</p>}
        <p className="portfolio-hero-context mt-3 text-sm leading-relaxed text-portfolio-dust md:text-base">{t("hero.contextDetail")}</p>
        <HeroActions resumeUrl={siteConfig.resumeUrl} viewWork={viewWork} viewCV={viewCV} />
      </div>
    </div>
  </section>;
}

"use client";

import { useTranslation } from "@/context/LanguageContext";
import { resolveSectionText } from "@/lib/content-overrides";
import type { SiteConfig } from "@/lib/types";
import { useEffect, useRef, type CSSProperties } from "react";
import { splitGraphemes, typingStep } from "@/lib/graphemes";
import HeroActions from "./HeroActions";

export interface HeroSectionProps { siteConfig: SiteConfig }
export default function HeroSection({ siteConfig }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let started = false;
    const start = () => {
      if (cancelled || started) return;
      started = true;
      frame = requestAnimationFrame(() => {
        // The inline script removes this opt-in after 4s if hydration fails.
        // A late hydration must not hide text that has already fallen back.
        if (!cancelled && document.documentElement.classList.contains("js-typing")) {
          sectionRef.current?.setAttribute("data-typing", "ready");
        }
      });
    };
    const timeout = window.setTimeout(start, 1000);
    void document.fonts.ready.then(start, start);
    return () => { cancelled = true; window.clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, []);
  const { t, locale } = useTranslation();
  const hero = siteConfig.sectionsContent?.hero;
  const name = siteConfig.author.name?.trim() || t("hero.name");
  const role = (locale === "vi" ? siteConfig.author.title_vi?.trim() : undefined)
    || siteConfig.author.title?.trim() || t("hero.role");
  const context = resolveSectionText(locale, hero?.bio, hero?.bio_vi, t("hero.context"));
  const available = resolveSectionText(locale, hero?.available, hero?.available_vi, t("hero.available"));
  const viewWork = resolveSectionText(locale, hero?.viewWork, hero?.viewWork_vi, t("hero.viewWork"));
  const viewCV = resolveSectionText(locale, hero?.viewCV, hero?.viewCV_vi, t("hero.viewCV"));
  const characters = splitGraphemes(name);
  const step = typingStep(characters.length);

  return <section ref={sectionRef} id="home" style={{ "--typing-end": `${characters.length * step}ms` } as CSSProperties} className="portfolio-hero relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28 pb-12">
    <div aria-hidden="true" className="portfolio-hero-scrim pointer-events-none absolute inset-0 z-[1]" />
    <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4">
      <div className="portfolio-hero-copy max-w-[42rem]">
        {available && <p className="portfolio-hero-available mb-4 flex items-center gap-2 text-sm text-portfolio-dust">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
          {available}
        </p>}
        {name && <h1 aria-label={name} className="portfolio-hero-name mb-6 text-[clamp(2.25rem,6.1vw,5.5rem)] leading-[1.12] font-extrabold tracking-[-0.035em] text-portfolio-ink"><span aria-hidden="true">{characters.map((character, index) => <span key={`${name}-${index}`} className="portfolio-typed-character" style={{ "--char-delay": `${index * step}ms`, "--char-step": `${step}ms` } as CSSProperties}>{character}<span className="portfolio-typing-caret" style={{ "--caret-duration": `${index === characters.length - 1 ? 1000 : step}ms` } as CSSProperties} /></span>)}</span></h1>}
        {role && <p className="portfolio-hero-role mb-4 text-xl font-semibold text-portfolio-ink md:text-2xl">{role}</p>}
        {context && <p className="portfolio-hero-context max-w-[42ch] text-base leading-relaxed text-portfolio-dust md:text-lg">{context}</p>}
        <p className="portfolio-hero-context mt-3 text-sm leading-relaxed text-portfolio-dust md:text-base">{t("hero.contextDetail")}</p>
        <HeroActions resumeUrl={siteConfig.resumeUrl} viewWork={viewWork} viewCV={viewCV} />
      </div>
    </div>
  </section>;
}

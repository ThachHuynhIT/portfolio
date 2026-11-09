"use client";
import SectionHeading from "@/components/ui/SectionHeading";
import { useTranslation } from "@/context/LanguageContext";
import { resolveSectionText } from "@/lib/content-overrides";
import type { SiteConfig } from "@/lib/types";
export interface AboutSectionProps { siteConfig: SiteConfig }
export default function AboutSection({ siteConfig }: AboutSectionProps) {
  const { t, locale } = useTranslation();
  const copy = siteConfig.sectionsContent?.about;
  const title = resolveSectionText(locale, copy?.titlePrefix, copy?.titlePrefix_vi, t("about.titlePrefix")) + resolveSectionText(locale, copy?.titleHighlight, copy?.titleHighlight_vi, t("about.titleHighlight"));
  const paragraphs = [resolveSectionText(locale, copy?.bioP1, copy?.bioP1_vi, t("about.bioP1")), resolveSectionText(locale, copy?.bioP2, copy?.bioP2_vi, t("about.bioP2")), resolveSectionText(locale, copy?.bioP3, copy?.bioP3_vi, t("about.bioP3"))].filter(Boolean);
  const facts = ["experience", "focus", "education", "location"].map((key, i) => {
    const fact = copy?.facts?.[i];
    return { key, label: resolveSectionText(locale, fact?.label, fact?.label_vi, t(`about.facts.${key}.label`)), value: resolveSectionText(locale, fact?.value, fact?.value_vi, t(`about.facts.${key}.value`)) };
  }).filter((fact) => fact.label || fact.value);
  return <section id="about" className="portfolio-section"><div className="portfolio-column">
    {title && <div className="portfolio-reveal portfolio-reveal--sweep text-center mb-10"><SectionHeading>{title}</SectionHeading></div>}
    <div className="grid gap-10 lg:grid-cols-2 items-start">
      <div className="portfolio-reading space-y-4 leading-relaxed">{paragraphs.map((paragraph, i) => <p key={i} className="portfolio-reveal portfolio-reveal--focus">{paragraph}</p>)}</div>
      <dl className="portfolio-solid portfolio-reveal portfolio-reveal--lens">
        {facts.map((fact) => <div key={fact.key} className="portfolio-reveal portfolio-reveal--trail py-4 border-b border-portfolio-hairline last:border-0">
          {fact.label && <dt className="text-portfolio-dust text-sm mb-1">{fact.label}</dt>}
          {fact.value && <dd className="text-portfolio-ink leading-relaxed">{fact.value}</dd>}
        </div>)}
      </dl>
    </div>
  </div></section>;
}

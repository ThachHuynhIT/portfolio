"use client";
import dynamic from "next/dynamic";
import SectionHeading from "@/components/ui/SectionHeading";
import { useTranslation } from "@/context/LanguageContext";
import { resolveSectionText } from "@/lib/content-overrides";
import type { SiteConfig } from "@/lib/types";
const ContactForm = dynamic(() => import("./ContactForm"));
const CopyEmailButton = dynamic(() => import("./CopyEmailButton"));
export interface ContactSectionProps { siteConfig: SiteConfig }
export default function ContactSection({ siteConfig }: ContactSectionProps) {
  const { t, locale } = useTranslation();
  const copy = siteConfig.sectionsContent?.contact;
  const title = resolveSectionText(locale, copy?.titlePrefix, copy?.titlePrefix_vi, t("contact.titlePrefix")) + resolveSectionText(locale, copy?.titleHighlight, copy?.titleHighlight_vi, t("contact.titleHighlight"));
  const subtitle = resolveSectionText(locale, copy?.subtitle, copy?.subtitle_vi, t("contact.subtitle"));
  const email = siteConfig.author.email;
  return <section id="contact" className="portfolio-section"><div className="portfolio-column">
    <div className="portfolio-reveal portfolio-reveal--sweep text-center mb-10">{title && <SectionHeading>{title}</SectionHeading>}</div>
    <div className="grid md:grid-cols-2 gap-10 items-start">
      <div className="portfolio-contact-intro portfolio-reading portfolio-reveal portfolio-reveal--focus space-y-5 text-left">{email && <><a className="portfolio-text-link text-2xl sm:text-3xl font-semibold break-words block" href={`mailto:${email}`}>{email}</a>{subtitle && <p className="text-portfolio-dust">{subtitle}</p>}<CopyEmailButton email={email} label={t("contact.copyEmail")} copied={t("contact.copiedEmail")} failed={t("contact.copyFailed")} /></>}{!email && subtitle && <p className="text-portfolio-dust">{subtitle}</p>}</div>
      <div className="portfolio-reveal portfolio-reveal--lens"><ContactForm contact={copy} email={email} /></div>
    </div>
  </div></section>;
}

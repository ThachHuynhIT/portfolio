"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import Icon from "./Icon";
import { isKnownIconName } from "@/lib/icon-names";
import { isExcludedRoute } from "@/lib/constants";
import type { NavLink, SocialLink, SiteConfig } from "@/lib/types";

export interface FooterProps { navLinks: NavLink[]; socialLinks: SocialLink[]; siteConfig: SiteConfig }
export default function Footer({ navLinks, socialLinks, siteConfig }: FooterProps) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [entered, setEntered] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  if (isExcludedRoute(pathname)) return null;
  const authorName = siteConfig.author.name.trim();
  return <motion.footer ref={footerRef} onViewportEnter={() => setEntered(true)} viewport={{ once: true }} className="relative overflow-hidden border-t border-portfolio-hairline bg-portfolio-void text-portfolio-ink">
    <span aria-hidden="true" className={entered ? "portfolio-footer-star portfolio-footer-star-started" : "portfolio-footer-star"} style={{ animationPlayState: inView && tabVisible ? "running" : "paused" }} />
    <div className="mx-auto max-w-[1120px] px-4 py-12">
      <div className="flex flex-col justify-between gap-8 md:flex-row">
        <div>
          {authorName && <Link href="/" className="inline-flex min-h-11 items-center text-xl font-bold">{authorName}</Link>}
          <div className="mt-3 flex flex-wrap gap-2">
            {socialLinks.map((social) => <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.name} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-portfolio-control p-2 text-portfolio-dust transition-colors duration-150 hover:border-portfolio-accretion hover:text-portfolio-ink active:scale-[0.98]">
              {social.icon && (social.icon.startsWith("http") || social.icon.startsWith("/")) ? (
                // eslint-disable-next-line @next/next/no-img-element -- CMS social icon URLs are arbitrary
                <img src={social.icon} alt="" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-6 object-contain" />
              ) : isKnownIconName(social.icon) ? <Icon name={social.icon} size={20} /> : <span className="text-xs font-bold">{social.name.slice(0, 2)}</span>}
            </a>)}
          </div>
        </div>
        <nav aria-label={t("footer.quickLinks")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 md:max-w-md">
            {navLinks.map((link) => <li key={link.id}><Link href={link.href.startsWith("#") && pathname !== "/" ? `/${link.href}` : link.href} className="inline-flex min-h-11 items-center text-sm text-portfolio-dust transition-colors duration-150 hover:text-portfolio-accretion">
              {locale === "vi" && link.label_vi?.trim() ? link.label_vi : link.label}
            </Link></li>)}
          </ul>
        </nav>
      </div>
      <p className="mt-10 border-t border-portfolio-hairline pt-6 text-sm text-portfolio-dust">© {new Date().getFullYear()}{authorName ? ` ${authorName}.` : ""} {t("footer.rightsReserved")}</p>
    </div>
  </motion.footer>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import Icon, { isKnownIconName } from "@/components/ui/Icon";
import type { NavLink, SocialLink, SiteConfig } from "@/lib/types";

export interface FooterProps {
  navLinks: NavLink[];
  socialLinks: SocialLink[];
  siteConfig: SiteConfig;
}

export default function Footer({ navLinks, socialLinks, siteConfig }: FooterProps) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const getNavLabel = (link: { href: string; label: string; label_vi?: string }) => {
    if (locale === "vi" && link.label_vi?.trim()) {
      return link.label_vi;
    }
    const cleanKey = link.href.replace(/^[/#]+/, "");
    const translationKey = `nav.${cleanKey || "home"}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : link.label;
  };

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/music") ||
    pathname?.startsWith("/couple") ||
    pathname?.startsWith("/contra") ||
    pathname?.startsWith("/tien-len") ||
    pathname?.startsWith("/meo-no")
  ) {
    return null;
  }

  return (
    <footer className="relative border-t border-white/10 light:border-neutral-900/10 bg-black/50 light:bg-white/60 backdrop-blur-xl">
      {/* Gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-block text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4"
            >
              {siteConfig.author.name}
            </Link>
            <p className="text-white/60 light:text-neutral-600 max-w-md mb-6">
              {locale === "vi" && siteConfig.author.bio_vi ? siteConfig.author.bio_vi : (t("hero.bio") || siteConfig.author.bio)}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 flex items-center justify-center text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 hover:bg-white/10 light:hover:bg-neutral-900/[0.08] hover:border-white/20 light:hover:border-neutral-900/20 transition-all duration-300 overflow-hidden p-1.5"
                  aria-label={social.name}
                >
                  {social.icon && (social.icon.startsWith("http") || social.icon.startsWith("/")) ? (
                    <img
                      src={social.icon}
                      alt={social.name}
                      className="w-full h-full object-contain rounded-full"
                    />
                  ) : isKnownIconName(social.icon) ? (
                    <Icon name={social.icon} size={20} />
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider">{social.name.slice(0, 2)}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white light:text-neutral-900 font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3">
              {navLinks.map((link) => {
                const resolvedHref = link.href.startsWith("#")
                  ? pathname === "/"
                    ? link.href
                    : `/${link.href}`
                  : link.href;

                return (
                  <li key={link.id || link.href}>
                    <Link
                      href={resolvedHref}
                      className="text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 transition-colors duration-300"
                    >
                      {getNavLabel(link)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white light:text-neutral-900 font-semibold mb-4">{t("footer.getInTouch")}</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${siteConfig.author.email}`}
                  className="text-white/60 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 transition-colors duration-300"
                >
                  {siteConfig.author.email}
                </a>
              </li>
              <li className="text-white/60 light:text-neutral-600">{siteConfig.author.location}</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 light:border-neutral-900/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 light:text-neutral-500 text-sm">
            © {currentYear} {siteConfig.author.name}. {t("footer.rightsReserved")}
          </p>
          <p className="text-white/40 light:text-neutral-500 text-sm">
            {t("footer.builtWith")}{" "}
            <span className="text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text">
              Next.js
            </span>{" "}
            {t("footer.and")}{" "}
            <span className="text-transparent bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text">
              Three.js
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

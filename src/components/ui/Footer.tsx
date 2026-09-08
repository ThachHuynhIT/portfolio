"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks, socialLinks, siteConfig } from "@/lib/constants";
import { useTranslation } from "@/context/LanguageContext";

export default function Footer() {
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
    pathname?.startsWith("/contra")
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
                  ) : social.icon === "github" ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  ) : social.icon === "linkedin" ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  ) : social.icon === "twitter" ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
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

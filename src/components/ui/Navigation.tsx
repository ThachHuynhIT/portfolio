"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";
import { isExcludedRoute } from "@/lib/constants";
import { getActiveSection, isSectionNavActive } from "@/lib/navigation-section";
import { mapScrollProgress } from "@/lib/motion-math";
import { navUnderlineTransition } from "@/lib/animations";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import ActionStars from "./ActionStars";
import type { NavLink } from "@/lib/types";

const SECTION_IDS = ["home", "about", "skills", "projects", "photos", "blog", "contact"];
export interface NavigationProps { navLinks: NavLink[] }

export default function Navigation({ navLinks }: NavigationProps) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const scrollStatusRef = useRef({ scrolled: false, section: "home" });
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  const closeMenus = useCallback(() => { clearCloseTimer(); setMobileOpen(false); setDropdown(null); }, [clearCloseTimer]);
  useEffect(closeMenus, [pathname, closeMenus]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const y = window.scrollY;
      if (scrollStatusRef.current.scrolled !== (y > 20)) {
        scrollStatusRef.current.scrolled = y > 20;
        setIsScrolled(y > 20);
      }
      const progress = mapScrollProgress(y, document.documentElement.scrollHeight - window.innerHeight);
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(1 - progress);
      if (pathname !== "/") return;
      const sections = SECTION_IDS.flatMap((id) => {
        const el = document.getElementById(id);
        if (!el) return [];
        const rect = el.getBoundingClientRect();
        return [{ id, top: rect.top + y, height: rect.height, hidden: el.hidden || !el.getClientRects().length }];
      });
      const nextSection = getActiveSection(sections, y < 120 ? 0 : y + 160);
      if (scrollStatusRef.current.section !== nextSection) {
        scrollStatusRef.current.section = nextSection;
        setActiveSection(nextSection);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen && !dropdown) return;
    const previousOverflow = document.documentElement.style.overflow;
    if (mobileOpen) document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mobileOpen) menuButtonRef.current?.focus();
        else if (dropdown) dropdownButtonRefs.current.get(dropdown)?.focus();
        closeMenus();
      }
      if (event.key === "Tab" && mobileOpen) {
        const targets = [menuButtonRef.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href],button") ?? [])]
          .filter((el): el is HTMLElement => Boolean(el));
        const first = targets[0];
        const last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const onOutside = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) closeMenus();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [mobileOpen, dropdown, closeMenus]);

  if (isExcludedRoute(pathname)) return null;
  const resolvedHref = (href: string) => href.startsWith("#") && pathname !== "/" ? `/${href}` : href;
  const label = (link: { href: string; label: string; label_vi?: string; children?: readonly { href: string }[] }) => {
    if (locale === "vi" && link.label_vi?.trim()) return link.label_vi;
    const key = `nav.${link.href.replace(/^[/#]+/, "") || (link.children?.length ? "hobby" : "home")}`;
    const translated = t(key);
    return translated === key ? link.label : translated;
  };
  const active = (link: { href: string; children?: readonly { href: string }[] }) => pathname === "/"
    ? isSectionNavActive(link, activeSection)
    : [link.href, ...(link.children?.map((child) => child.href) ?? [])]
      .some((href) => href !== "/" && !href.startsWith("#") && (pathname === href || pathname.startsWith(`${href}/`)));
  const itemClass = "portfolio-nav-link relative inline-flex min-h-11 min-w-11 items-center gap-1 px-2 text-sm font-medium rounded-lg transition-colors duration-150 text-portfolio-dust hover:text-portfolio-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-portfolio-accretion";

  return (
    <header ref={headerRef} className={cn("fixed inset-x-0 top-0 z-50 border-b px-[env(safe-area-inset-left)] pt-[env(safe-area-inset-top)] transition-colors duration-150", isScrolled || mobileOpen ? "bg-portfolio-void border-portfolio-hairline" : "bg-transparent border-transparent")}>
      <nav aria-label={locale === "vi" ? "Điều hướng chính" : "Main navigation"} className="mx-auto max-w-[1120px] px-4">
        <div className="flex min-h-20 items-center justify-between gap-2">
          <Link href="/#home" onClick={closeMenus} className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-extrabold text-portfolio-ink" aria-label={t("nav.home")}>
            <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90 fill-none stroke-portfolio-hairline">
              <circle cx="24" cy="24" r="21" />
              <circle ref={ringRef} cx="24" cy="24" r="21" pathLength="1" strokeDasharray="1" strokeDashoffset="1" className="stroke-portfolio-accretion" />
            </svg>TH
          </Link>
          <ul className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <li key={link.id} className="relative" onPointerEnter={(event) => {
                if (event.pointerType !== "mouse" || !link.children?.length) return;
                clearCloseTimer();
                setDropdown(link.id);
              }} onPointerLeave={(event) => {
                if (event.pointerType !== "mouse" || !link.children?.length) return;
                clearCloseTimer();
                closeTimer.current = setTimeout(() => {
                  // Keyboard focus inside the menu takes precedence over pointer exit.
                  const button = dropdownButtonRefs.current.get(link.id);
                  if (!button?.parentElement?.contains(document.activeElement)) setDropdown((current) => current === link.id ? null : current);
                }, 150);
              }}>
                {link.children?.length ? (
                  <>
                    <button ref={(el) => { if (el) dropdownButtonRefs.current.set(link.id, el); else dropdownButtonRefs.current.delete(link.id); }} type="button" aria-expanded={dropdown === link.id} aria-controls={`nav-${link.id}`} onClick={() => setDropdown(dropdown === link.id ? null : link.id)} className={cn(itemClass, active(link) && "text-portfolio-ink")}>
                      {label(link)} <span aria-hidden="true">⌄</span>
                      {active(link) && <motion.span layoutId="portfolio-nav-underline" transition={reducedMotion ? { duration: 0 } : navUnderlineTransition} className="absolute inset-x-2 bottom-1 h-0.5 bg-portfolio-accretion" />}
                    </button>
                    {dropdown === link.id && <ul id={`nav-${link.id}`} className="portfolio-nav-dropdown absolute left-0 top-full z-50 min-w-44 rounded-lg border border-portfolio-hairline bg-portfolio-hull p-2">
                      {link.children.map((child) => <li key={child.id}><Link href={resolvedHref(child.href)} onClick={closeMenus} aria-current={active(child) ? "location" : undefined} className={cn(itemClass, "w-full", active(child) && "text-portfolio-accretion")}>{label(child)}</Link></li>)}
                    </ul>}
                  </>
                ) : <Link href={resolvedHref(link.href)} onClick={closeMenus} aria-current={active(link) ? "location" : undefined} className={cn(itemClass, active(link) && "text-portfolio-ink")}>
                  {label(link)}
                  {active(link) && <motion.span layoutId="portfolio-nav-underline" transition={reducedMotion ? { duration: 0 } : navUnderlineTransition} className="absolute inset-x-2 bottom-1 h-0.5 bg-portfolio-accretion" />}
                </Link>}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher appearance="portfolio" />
            <Link href={resolvedHref("#contact")} onClick={closeMenus} className="portfolio-action portfolio-action-primary hidden min-h-11 items-center px-3 text-sm lg:inline-flex"><ActionStars />{t("nav.getInTouch")}</Link>
            <button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? t("common.close") : locale === "vi" ? "Mở menu" : "Open menu"} className="flex h-11 w-11 items-center justify-center rounded-lg border border-portfolio-control text-portfolio-ink lg:hidden"><span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span></button>
          </div>
        </div>
        {mobileOpen && <div ref={menuRef} id="mobile-menu" className="max-h-[calc(100dvh-6rem)] overflow-y-auto border-t border-portfolio-hairline py-3 lg:hidden">
          <ul>{navLinks.map((link) => <li key={link.id}>
            {link.children?.length ? <>
              <button type="button" aria-expanded={dropdown === link.id} aria-controls={`mobile-${link.id}`} onClick={() => setDropdown(dropdown === link.id ? null : link.id)} className={cn(itemClass, "w-full justify-between", active(link) && "text-portfolio-accretion")} >{label(link)}<span aria-hidden="true">⌄</span></button>
              {dropdown === link.id && <ul id={`mobile-${link.id}`} className="pl-4">{link.children.map((child) => <li key={child.id}><Link href={resolvedHref(child.href)} onClick={closeMenus} className={cn(itemClass, "w-full", active(child) && "text-portfolio-accretion")}>{label(child)}</Link></li>)}</ul>}
            </> : <Link href={resolvedHref(link.href)} onClick={closeMenus} aria-current={active(link) ? "location" : undefined} className={cn(itemClass, "w-full", active(link) && "text-portfolio-accretion")}>{label(link)}</Link>}
          </li>)}</ul>
        </div>}
      </nav>
    </header>
  );
}

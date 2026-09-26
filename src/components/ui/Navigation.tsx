"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Icon from "@/components/ui/Icon";
import type { NavLink } from "@/lib/types";

const SECTION_IDS = ["home", "about", "skills", "projects", "contact"];

export interface NavigationProps {
  navLinks: NavLink[];
}

export default function Navigation({ navLinks }: NavigationProps) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLUListElement>(null);
  const dropdownCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openDropdown = (id: string) => {
    if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
    setOpenDropdownId(id);
  };

  const scheduleCloseDropdown = () => {
    if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
    dropdownCloseTimerRef.current = setTimeout(() => setOpenDropdownId(null), 150);
  };

  const getNavLabel = (link: { href: string; label: string; label_vi?: string }) => {
    if (locale === "vi" && link.label_vi?.trim()) {
      return link.label_vi;
    }
    const cleanKey = link.href.replace(/^[/#]+/, "");
    const translationKey = `nav.${cleanKey || "home"}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : link.label;
  };

  // Lock scroll spy while smooth scrolling after clicking a nav link to prevent stutter
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll spy to detect active section on homepage and update scroll state
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    setIsScrolled(scrollY > 20);

    if (pathname !== "/") return;
    if (isClickScrollingRef.current) return;

    // If near top of page
    if (scrollY < 120) {
      setActiveSection("home");
      return;
    }

    // If scrolled near bottom of page, activate last section
    const isBottom =
      window.innerHeight + scrollY >= document.documentElement.scrollHeight - 100;
    if (isBottom) {
      setActiveSection("contact");
      return;
    }

    // Check each section's offset position
    const scrollPosition = scrollY + 220; // Offset to account for fixed navbar height
    for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
      const id = SECTION_IDS[i];
      const element = document.getElementById(id);
      if (element) {
        const top = element.offsetTop;
        if (scrollPosition >= top) {
          setActiveSection(id);
          return;
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [handleScroll]);

  // Close any open desktop dropdown on route change
  useEffect(() => {
    setOpenDropdownId(null);
  }, [pathname]);

  // Close the mobile accordion whenever the mobile menu itself closes
  useEffect(() => {
    if (!isMobileMenuOpen) setMobileOpenId(null);
  }, [isMobileMenuOpen]);

  // Close the open dropdown on outside click or Escape
  useEffect(() => {
    if (!openDropdownId) return;

    function handleClickOutside(event: MouseEvent) {
      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenDropdownId(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openDropdownId]);

  useEffect(() => {
    return () => {
      if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
    };
  }, []);

  // Helper to handle hash navigation from subpages
  const getResolvedHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : `/${href}`;
    }
    return href;
  };

  const isLinkActive = (href: string) => {
    if (pathname === "/") {
      if (href === "/" || href === "#home" || href === "#") {
        return activeSection === "home";
      }
      if (href.startsWith("#")) {
        const targetId = href.slice(1);
        return activeSection === targetId;
      }
      return false;
    }

    if (href.startsWith("#") || href === "/") {
      return false;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isNavItemActive = (link: { href: string; children?: { href: string }[] }) =>
    isLinkActive(link.href) || (link.children?.some((child) => isLinkActive(child.href)) ?? false);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    setIsMobileMenuOpen(false);

    if (pathname === "/" && href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.slice(1);
      setActiveSection(targetId);

      // Lock scroll spy during smooth scrolling
      isClickScrollingRef.current = true;

      // Defer the actual scroll two frames: closing the mobile menu triggers a
      // Framer Motion height/layout measurement that temporarily calls
      // window.scrollTo(0, 0) and restores it - if our smooth scrollTo runs in
      // the same tick, that hack cancels it and the page snaps back to the
      // top instead of landing on the target section.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (targetId === "home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const element = document.getElementById(targetId);
            if (element) {
              const yOffset = -70; // offset for fixed header
              const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: "smooth" });
            }
          }
        });
      });

      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 850);
    }
  };

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/music") ||
    pathname?.startsWith("/couple") ||
    pathname?.startsWith("/contra") ||
    pathname?.startsWith("/tien-len") ||
    pathname?.startsWith("/meo-no") ||
    pathname?.startsWith("/co-ty-phu") ||
    pathname?.startsWith("/splendor") ||
    pathname?.startsWith("/bang")
  ) {
    return null;
  }

  const isContactActive = pathname === "/" && activeSection === "contact";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-black/80 light:bg-white/80 backdrop-blur-xl border-b border-white/10 light:border-neutral-900/10 shadow-lg shadow-black/40 light:shadow-neutral-400/20 py-3"
          : "bg-gradient-to-b from-black/70 light:from-white/70 to-transparent backdrop-blur-sm py-4"
      )}
    >
      <nav className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "#home")}
            className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1.5px] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-md shadow-purple-500/20">
              <div className="w-full h-full bg-black/90 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300 text-sm tracking-wider">
                  TH
                </span>
              </div>
            </div>
            <span className="font-bold text-lg text-white light:text-neutral-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
              ThachHuynh
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul
            ref={desktopNavRef}
            className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/[0.04] light:bg-neutral-900/[0.03] border border-white/[0.08] light:border-neutral-900/[0.08] backdrop-blur-md"
          >
            {navLinks.map((link) => {
              const active = isNavItemActive(link);
              const isMusic = link.href === "/music";
              const hasChildren = !!link.children?.length;
              const isDropdownOpen = openDropdownId === link.id;

              const triggerClassName = cn(
                "relative flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200",
                active
                  ? "text-white light:text-neutral-900 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 light:border-purple-500/40 shadow-sm shadow-purple-500/20"
                  : "text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 hover:bg-white/[0.06] light:hover:bg-neutral-900/[0.05] border border-transparent"
              );

              const labelContent = (
                <>
                  {isMusic && (
                    <span className="relative flex h-2 w-2">
                      <span
                        className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          active ? "bg-cyan-400" : "bg-purple-400"
                        )}
                      />
                      <span
                        className={cn(
                          "relative inline-flex rounded-full h-2 w-2",
                          active ? "bg-cyan-500" : "bg-purple-500"
                        )}
                      />
                    </span>
                  )}
                  {getNavLabel(link)}
                  {active && (
                    <motion.span
                      layoutId="activeNavTab"
                      className="absolute inset-0 rounded-full bg-white/[0.03] light:bg-neutral-900/[0.03] -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </>
              );

              if (hasChildren) {
                return (
                  <li
                    key={link.id || link.href}
                    className="relative"
                    onMouseEnter={() => openDropdown(link.id)}
                    onMouseLeave={scheduleCloseDropdown}
                  >
                    <button
                      type="button"
                      onClick={() => (isDropdownOpen ? setOpenDropdownId(null) : openDropdown(link.id))}
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                      className={triggerClassName}
                    >
                      {labelContent}
                      <svg
                        className={cn(
                          "w-3 h-3 transition-transform duration-200",
                          isDropdownOpen && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl bg-slate-950/95 light:bg-white/95 border border-white/12 light:border-neutral-900/10 backdrop-blur-xl shadow-2xl shadow-black/80 light:shadow-neutral-400/40 py-1.5 z-[60] overflow-hidden"
                        >
                          {link.children!.map((child) => {
                            const childActive = isLinkActive(child.href);
                            return (
                              <Link
                                key={child.id || child.href}
                                href={getResolvedHref(child.href)}
                                onClick={(e) => {
                                  handleNavClick(e, child.href);
                                  setOpenDropdownId(null);
                                }}
                                className={cn(
                                  "block px-4 py-2 text-sm font-medium transition-colors",
                                  childActive
                                    ? "text-white bg-purple-500/20 light:text-neutral-900 light:bg-purple-500/10"
                                    : "text-white/75 hover:text-white hover:bg-white/[0.08] light:text-neutral-700 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.05]"
                                )}
                              >
                                {getNavLabel(child)}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              }

              return (
                <li key={link.id || link.href}>
                  <Link
                    href={getResolvedHref(link.href)}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={triggerClassName}
                  >
                    {labelContent}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop Right: Theme Toggle, Language Switcher & Contact Button */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle size="sm" />
            <LanguageSwitcher variant="pill" size="sm" />
            <Link
              href={getResolvedHref("#contact")}
              onClick={(e) => handleNavClick(e, "#contact")}
              className={cn(
                "relative group inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-white overflow-hidden rounded-full transition-all duration-300 shadow-md active:scale-95 whitespace-nowrap",
                isContactActive
                  ? "shadow-purple-500/40 ring-2 ring-cyan-400/50"
                  : "shadow-purple-500/10 hover:shadow-lg hover:shadow-purple-500/30"
              )}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 transition-all duration-300 group-hover:scale-105" />
              <span className="relative flex items-center gap-1.5">
                <span>{t("nav.getInTouch")}</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <Icon name="arrowRight" size={14} />
                </span>
              </span>
            </Link>
          </div>

          {/* Mobile Right Controls: Theme Toggle, Language Switcher & Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle size="sm" />
            <LanguageSwitcher variant="pill" size="sm" />
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative w-10 h-10 flex flex-col justify-center items-center rounded-xl bg-white/[0.05] light:bg-neutral-900/[0.05] border border-white/10 light:border-neutral-900/10 text-white light:text-neutral-900"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span
                className={cn(
                  "w-5 h-0.5 bg-white light:bg-neutral-900 transition-all duration-300",
                  isMobileMenuOpen && "rotate-45 translate-y-1.5"
                )}
              />
              <span
                className={cn(
                  "w-5 h-0.5 bg-white light:bg-neutral-900 my-1 transition-all duration-300",
                  isMobileMenuOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "w-5 h-0.5 bg-white light:bg-neutral-900 transition-all duration-300",
                  isMobileMenuOpen && "-rotate-45 -translate-y-1.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              ref={mobileMenuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="lg:hidden mt-3 rounded-2xl bg-black/95 light:bg-white/95 border border-white/10 light:border-neutral-900/10 backdrop-blur-2xl p-4 shadow-2xl shadow-black/80 light:shadow-neutral-400/30 overflow-hidden"
            >
              <ul className="flex flex-col gap-1.5">
                {navLinks.map((link, index) => {
                  const active = isNavItemActive(link);
                  const isMusic = link.href === "/music";
                  const hasChildren = !!link.children?.length;
                  const isAccordionOpen = mobileOpenId === link.id;

                  if (hasChildren) {
                    return (
                      <motion.li
                        key={link.id || link.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <button
                          type="button"
                          onClick={() => setMobileOpenId(isAccordionOpen ? null : link.id)}
                          aria-expanded={isAccordionOpen}
                          className={cn(
                            "flex items-center justify-between w-full px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                            active
                              ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white light:text-neutral-900 border border-purple-500/30 light:border-purple-500/40"
                              : "text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 hover:bg-white/[0.06] light:hover:bg-neutral-900/[0.05] border border-transparent"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {getNavLabel(link)}
                          </span>
                          <svg
                            className={cn(
                              "w-4 h-4 transition-transform duration-200",
                              isAccordionOpen && "rotate-180"
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <AnimatePresence initial={false}>
                          {isAccordionOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <ul className="flex flex-col gap-1 pl-4 pt-1 pb-1">
                                {link.children!.map((child) => {
                                  const childActive = isLinkActive(child.href);
                                  return (
                                    <li key={child.id || child.href}>
                                      <Link
                                        href={getResolvedHref(child.href)}
                                        onClick={(e) => handleNavClick(e, child.href)}
                                        className={cn(
                                          "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                          childActive
                                            ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white light:text-neutral-900 border border-purple-500/30 light:border-purple-500/40"
                                            : "text-white/60 light:text-neutral-500 hover:text-white light:hover:text-neutral-900 hover:bg-white/[0.06] light:hover:bg-neutral-900/[0.05] border border-transparent"
                                        )}
                                      >
                                        {getNavLabel(child)}
                                        {childActive && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                                        )}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    );
                  }

                  return (
                    <motion.li
                      key={link.id || link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link
                        href={getResolvedHref(link.href)}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                          active
                            ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white light:text-neutral-900 border border-purple-500/30 light:border-purple-500/40"
                            : "text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 hover:bg-white/[0.06] light:hover:bg-neutral-900/[0.05] border border-transparent"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {isMusic && <Icon name="music" size={14} />}
                          {getNavLabel(link)}
                        </span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
                <li className="pt-2 border-t border-white/10 light:border-neutral-900/10 mt-1">
                  <Link
                    href={getResolvedHref("#contact")}
                    onClick={(e) => handleNavClick(e, "#contact")}
                    className={cn(
                      "flex items-center justify-center w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl shadow-lg transition-all",
                      isContactActive
                        ? "shadow-purple-500/40 ring-2 ring-cyan-400"
                        : "shadow-purple-500/20"
                    )}
                  >
                    {t("nav.getInTouch")}
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}



"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { navLinks } from "@/lib/constants";

export default function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Helper to handle hash navigation from subpages
  const getResolvedHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : `/${href}`;
    }
    return href;
  };

  const isLinkActive = (href: string) => {
    if (href === "/" || href === "#home") return pathname === "/";
    if (href.startsWith("#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/music")) {
    return null;
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40 py-3"
          : "bg-gradient-to-b from-black/70 to-transparent backdrop-blur-sm py-4"
      )}
    >
      <nav className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1.5px] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-md shadow-purple-500/20">
              <div className="w-full h-full bg-black/90 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300 text-sm tracking-wider">
                  JD
                </span>
              </div>
            </div>
            <span className="font-bold text-lg text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
              Portfolio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              const isMusic = link.href === "/music";

              return (
                <li key={link.id || link.href}>
                  <Link
                    href={getResolvedHref(link.href)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                      active
                        ? "text-white bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 shadow-sm shadow-purple-500/20"
                        : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    {isMusic && (
                      <span className="relative flex h-2 w-2">
                        <span className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          active ? "bg-cyan-400" : "bg-purple-400"
                        )} />
                        <span className={cn(
                          "relative inline-flex rounded-full h-2 w-2",
                          active ? "bg-cyan-500" : "bg-purple-500"
                        )} />
                      </span>
                    )}
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="activeNavTab"
                        className="absolute inset-0 rounded-full bg-white/[0.03] -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Contact Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={getResolvedHref("#contact")}
              className="relative group inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white overflow-hidden rounded-full transition-all duration-300 shadow-md shadow-purple-500/10 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 transition-all duration-300 group-hover:scale-105" />
              <span className="relative flex items-center gap-1.5">
                <span>Get in Touch</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative w-10 h-10 flex flex-col justify-center items-center rounded-xl bg-white/[0.05] border border-white/10 text-white"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span
              className={cn(
                "w-5 h-0.5 bg-white transition-all duration-300",
                isMobileMenuOpen && "rotate-45 translate-y-1.5"
              )}
            />
            <span
              className={cn(
                "w-5 h-0.5 bg-white my-1 transition-all duration-300",
                isMobileMenuOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "w-5 h-0.5 bg-white transition-all duration-300",
                isMobileMenuOpen && "-rotate-45 -translate-y-1.5"
              )}
            />
          </button>
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
              className="md:hidden mt-3 rounded-2xl bg-black/95 border border-white/10 backdrop-blur-2xl p-4 shadow-2xl shadow-black/80 overflow-hidden"
            >
              <ul className="flex flex-col gap-1.5">
                {navLinks.map((link, index) => {
                  const active = isLinkActive(link.href);
                  const isMusic = link.href === "/music";

                  return (
                    <motion.li
                      key={link.id || link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link
                        href={getResolvedHref(link.href)}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                          active
                            ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30"
                            : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {isMusic && <span>🎵</span>}
                          {link.label}
                        </span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
                <li className="pt-2 border-t border-white/10 mt-1">
                  <Link
                    href={getResolvedHref("#contact")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl shadow-lg shadow-purple-500/20"
                  >
                    Get in Touch
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


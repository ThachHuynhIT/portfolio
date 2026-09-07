"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Locale, localeNames } from "@/locales";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "pill" | "toggle" | "dropdown";
  className?: string;
  size?: "sm" | "md";
}

export default function LanguageSwitcher({
  variant = "pill",
  className,
  size = "sm",
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "vi" : "en");
  };

  // Compact Pill Toggle (Default - ideal for Navbar, Music Sidebar, Couple Header)
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={`Switch language from ${localeNames[locale].name} to ${
          locale === "en" ? "Vietnamese" : "English"
        }`}
        className={cn(
          "relative group inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-300",
          "bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-purple-500/40",
          "text-white/80 hover:text-white shadow-sm hover:shadow-purple-500/20",
          "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
          className
        )}
      >
        <span className="text-sm select-none leading-none">
          {localeNames[locale].flag}
        </span>
        <span className="font-semibold tracking-wider uppercase text-[11px]">
          {locale}
        </span>
        <span className="text-[10px] text-white/40 group-hover:text-purple-300 transition-colors">
          ⇄
        </span>
      </button>
    );
  }

  // Segmented Pill Toggle (Showing both [ EN | VI ] with active pill slider)
  if (variant === "toggle") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-0.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md",
          className
        )}
      >
        {(["en", "vi"] as Locale[]).map((loc) => {
          const isActive = locale === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={cn(
                "relative px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                isActive
                  ? "text-white"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="activeLangIndicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/40 to-cyan-500/40 border border-purple-500/40 shadow-sm shadow-purple-500/20 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-xs">{localeNames[loc].flag}</span>
              <span className="uppercase text-[11px] font-bold">{loc}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown Menu
  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition-all",
          isOpen && "border-purple-500/50 bg-white/[0.1]"
        )}
      >
        <span>{localeNames[locale].flag}</span>
        <span className="font-semibold uppercase">{locale}</span>
        <svg
          className={cn("w-3.5 h-3.5 text-white/50 transition-transform duration-200", isOpen && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-36 rounded-xl bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/80 py-1 z-50 overflow-hidden"
          >
            {(["en", "vi"] as Locale[]).map((loc) => {
              const isSelected = locale === loc;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setLocale(loc);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-xs font-medium transition-colors",
                    isSelected
                      ? "text-white bg-purple-500/20 font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{localeNames[loc].flag}</span>
                    <span>{localeNames[loc].nativeName}</span>
                  </span>
                  {isSelected && <span className="text-cyan-400">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

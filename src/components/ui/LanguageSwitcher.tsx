"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Locale, localeNames } from "@/locales";
import FlagIcon from "@/components/ui/FlagIcon";
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

  const nextLocale: Locale = locale === "en" ? "vi" : "en";
  const switchLabel =
    locale === "vi"
      ? "Đang chọn Tiếng Việt. Nhấp để chuyển sang English"
      : "Currently English. Click to switch to Tiếng Việt";

  // Flag dimensions based on size
  const flagDimensions = size === "sm" ? { width: 20, height: 14 } : { width: 24, height: 16 };

  // Compact Pill Flag Toggle (Default - ideal for Navbar, Admin Bar, Music Sidebar)
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={switchLabel}
        title={switchLabel}
        className={cn(
          "relative group inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-300",
          "bg-white/[0.08] hover:bg-white/[0.16] border border-white/12 hover:border-purple-500/50",
          "light:bg-neutral-900/[0.05] light:hover:bg-neutral-900/[0.09] light:border-neutral-900/10",
          "text-white/80 hover:text-white shadow-sm hover:shadow-purple-500/25 light:text-neutral-700 light:hover:text-neutral-900",
          "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer",
          size === "sm" ? "px-2 py-1" : "px-3 py-1.5",
          className
        )}
      >
        {/* Animated Flag representing current active language */}
        <div className="relative overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={locale}
              initial={{ rotateY: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex items-center"
            >
              <FlagIcon
                locale={locale}
                width={flagDimensions.width}
                height={flagDimensions.height}
                className="border border-white/20 light:border-neutral-900/15 shadow-sm rounded-[3px]"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Exchange indicator */}
        <span
          className="text-xs text-white/50 group-hover:text-purple-300 light:text-neutral-500 transition-transform duration-300 group-hover:rotate-180 flex items-center select-none"
          aria-hidden="true"
        >
          ⇄
        </span>
      </button>
    );
  }

  // Segmented Pill Toggle (Showing both flags [ 🇻🇳 | 🇬🇧 ] with animated active pill slider)
  if (variant === "toggle") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-1 rounded-full bg-white/[0.06] border border-white/10 light:bg-neutral-900/[0.04] light:border-neutral-900/10 backdrop-blur-md gap-0.5",
          className
        )}
      >
        {(["vi", "en"] as Locale[]).map((loc) => {
          const isActive = locale === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              title={localeNames[loc].nativeName}
              aria-label={localeNames[loc].nativeName}
              className={cn(
                "relative p-1.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
                isActive
                  ? "text-white light:text-neutral-900"
                  : "opacity-60 hover:opacity-100 hover:bg-white/[0.06] light:hover:bg-neutral-900/[0.05]"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="activeFlagIndicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/40 to-cyan-500/40 border border-purple-500/50 shadow-sm shadow-purple-500/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <FlagIcon
                locale={loc}
                width={flagDimensions.width}
                height={flagDimensions.height}
                className={cn(
                  "border border-white/20 light:border-neutral-900/15 shadow-sm rounded-[3px] transition-transform duration-200",
                  isActive ? "scale-105" : "scale-95"
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown Menu variant (Shows current flag + chevron, expands with Flag + Name)
  return (
    <div ref={dropdownRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={switchLabel}
        title={switchLabel}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 light:bg-neutral-900/[0.05] light:hover:bg-neutral-900/[0.09] light:border-neutral-900/10 px-2.5 py-1.5 text-xs font-medium text-white/90 light:text-neutral-800 transition-all cursor-pointer",
          isOpen && "border-purple-500/50 bg-white/[0.12] light:bg-neutral-900/[0.08]"
        )}
      >
        <FlagIcon
          locale={locale}
          width={flagDimensions.width}
          height={flagDimensions.height}
          className="border border-white/20 light:border-neutral-900/15 shadow-sm rounded-[3px]"
        />
        <svg
          className={cn(
            "w-3.5 h-3.5 text-white/60 light:text-neutral-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
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
            className="absolute right-0 mt-1.5 w-40 rounded-xl bg-slate-950/95 border border-white/12 light:bg-white/95 light:border-neutral-900/10 backdrop-blur-xl shadow-2xl shadow-black/80 light:shadow-neutral-400/40 py-1 z-50 overflow-hidden"
          >
            {(["vi", "en"] as Locale[]).map((loc) => {
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
                    "flex items-center justify-between w-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                    isSelected
                      ? "text-white bg-purple-500/20 font-semibold light:text-neutral-900 light:bg-purple-500/10"
                      : "text-white/75 hover:text-white hover:bg-white/[0.08] light:text-neutral-700 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.05]"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <FlagIcon
                      locale={loc}
                      width={18}
                      height={12}
                      className="border border-white/20 light:border-neutral-900/15 shadow-sm rounded-[2px]"
                    />
                    <span>{localeNames[loc].nativeName}</span>
                  </span>
                  {isSelected && <span className="text-cyan-400 font-bold">✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

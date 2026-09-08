"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export default function ThemeToggle({ className, size = "sm" }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  const label =
    theme === "dark" ? "Đang ở chế độ Tối. Nhấp để chuyển sang Sáng" : "Đang ở chế độ Sáng. Nhấp để chuyển sang Tối";

  const iconSize = size === "sm" ? 16 : 18;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 cursor-pointer",
        "bg-white/[0.08] hover:bg-white/[0.16] border border-white/12 hover:border-purple-500/50",
        "light:bg-neutral-900/[0.05] light:hover:bg-neutral-900/[0.1] light:border-neutral-900/10 light:hover:border-purple-500/50",
        "text-white/80 hover:text-white light:text-neutral-600 light:hover:text-neutral-900",
        "shadow-sm hover:shadow-purple-500/25 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
        size === "sm" ? "w-8 h-8" : "w-9 h-9",
        className
      )}
    >
      <div className="relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {!isMounted ? (
            <span key="placeholder" style={{ width: iconSize, height: iconSize }} />
          ) : theme === "dark" ? (
            <motion.svg
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

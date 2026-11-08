"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/context/LanguageContext";

interface ThemeToggleProps { className?: string; size?: "sm" | "md" }
export default function ThemeToggle({ className, size = "sm" }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();
  const { locale } = useTranslation();
  const label = locale === "vi"
    ? theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
    : theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return <button type="button" onClick={toggleTheme} aria-label={label} title={label} className={cn("portfolio-control inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-portfolio-control bg-portfolio-hull text-portfolio-ink transition-colors duration-150 hover:border-portfolio-accretion active:scale-[0.98]", className)}>
    <svg aria-hidden="true" width={size === "sm" ? 18 : 20} height={size === "sm" ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      {!isMounted || theme === "dark" ? <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    </svg>
  </button>;
}

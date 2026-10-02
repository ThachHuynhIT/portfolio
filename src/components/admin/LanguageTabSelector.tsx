"use client";

import React from "react";
import FlagIcon from "@/components/ui/FlagIcon";
import { cn } from "@/lib/utils";
import { border, gap, radius } from "@/lib/design-tokens";

interface LanguageTabSelectorProps {
  activeLang: "en" | "vi";
  onChange: (lang: "en" | "vi") => void;
  hasTranslation?: {
    en?: boolean;
    vi?: boolean;
  };
  className?: string;
  label?: string;
}

/**
 * LanguageTabSelector — A clean, WordPress-style tab switcher for multilingual content editing.
 * Lets users switch between English and Vietnamese fields with clear visual feedback.
 */
export default function LanguageTabSelector({
  activeLang,
  onChange,
  hasTranslation,
  className,
  label = "Content Language / Ngôn ngữ nội dung:",
}: LanguageTabSelectorProps) {
  const languages: Array<{ id: "en" | "vi"; name: string; nativeName: string }> = [
    { id: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
    { id: "en", name: "English", nativeName: "English" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/8 mb-4",
        className
      )}
    >
      <div className={cn("flex items-center", gap.tight, "text-xs font-medium text-slate-400")}>
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
          {label}
        </span>
      </div>

      <div className={cn("inline-flex items-center p-1", radius.chip, "bg-slate-950/80 border border-white/8 gap-1")}>
        {languages.map((lang) => {
          const isActive = activeLang === lang.id;
          const hasContent = hasTranslation?.[lang.id];

          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => onChange(lang.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                isActive
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <FlagIcon locale={lang.id} width={18} height={12} className={cn(border.strongDark)} />
              <span>{lang.nativeName}</span>

              {/* Translation status dot indicator */}
              {hasTranslation && (
                <span
                  title={hasContent ? "Has content" : "No content yet"}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    hasContent
                      ? isActive
                        ? "bg-cyan-300"
                        : "bg-cyan-400"
                      : "bg-slate-600"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

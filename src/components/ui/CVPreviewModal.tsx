"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";
import Icon from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { border, elevation, gap, radius } from "@/lib/design-tokens";

interface CVPreviewModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen PDF viewer for the CV, themed for both light and dark mode.
 */
export default function CVPreviewModal({ url, isOpen, onClose }: CVPreviewModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <div className={cn("absolute inset-0 bg-black/90 light:bg-white/80", elevation.blur)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-4xl h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn("flex items-center justify-between pb-3 text-xs text-white/80 light:text-neutral-700", gap.base)}>
              <span className={cn("font-mono text-[11px] text-slate-300 light:text-neutral-600 truncate bg-slate-900/90 light:bg-slate-100 px-3 py-1.5", radius.control, border.subtle)}>
                {t("hero.viewCV", "View CV")}
              </span>
              <div className={cn("flex items-center", gap.tight, "flex-shrink-0")}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("px-3 py-1.5", radius.control, "bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all inline-flex items-center gap-1 light:bg-neutral-900/[0.06] light:hover:bg-neutral-900/10 light:text-neutral-900")}
                >
                  {t("hero.openInNewTab", "Open in new tab")} <Icon name="externalLink" size={12} />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn("w-8 h-8", radius.control, "bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center light:bg-neutral-900/[0.06] light:hover:bg-neutral-900/10 light:text-neutral-900")}
                  title="Close (Esc)"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            </div>

            <div className={cn("flex-1", radius.card, "overflow-hidden border border-white/15 light:border-neutral-900/15 shadow-2xl bg-black/70 light:bg-white/90")}>
              <iframe src={url} title="CV" className="w-full h-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

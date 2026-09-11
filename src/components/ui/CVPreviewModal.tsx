"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";
import Icon from "@/components/ui/Icon";

interface CVPreviewModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen PDF viewer for the CV, in the same dark "theater mode" spirit
 * as PhotoLightboxModal — an intentional dark-only exception to the
 * light/dark toggle (see CLAUDE.md), since a document viewer isn't part of
 * the themed site chrome.
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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-4xl h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 text-xs text-white/80 gap-3">
              <span className="font-mono text-[11px] text-slate-300 truncate bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/10">
                {t("hero.viewCV", "View CV")}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all inline-flex items-center gap-1"
                >
                  {t("hero.openInNewTab", "Open in new tab")} <Icon name="externalLink" size={12} />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                  title="Close (Esc)"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/70">
              <iframe src={url} title="CV" className="w-full h-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

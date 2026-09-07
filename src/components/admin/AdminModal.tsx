"use client";

import React, { useEffect } from "react";
import Icon from "@/components/ui/Icon";

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  children: React.ReactNode;
  maxWidth?: string;
  onSubmit?: (e: React.FormEvent) => void;
  onSave?: () => void;
  saveLabel?: string;
  closeLabel?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  saveButtonType?: "submit" | "button";
  extraFooterActions?: React.ReactNode;
  hideFooter?: boolean;
  customFooter?: React.ReactNode;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "max-w-2xl",
  onSubmit,
  onSave,
  saveLabel = "Save",
  closeLabel = "Close",
  isSaving = false,
  saveDisabled = false,
  saveButtonType = "submit",
  extraFooterActions,
  hideFooter = false,
  customFooter,
}: AdminModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <>
      {/* Modal Header: Title text + 'X' button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Icon name={icon} size={17} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* 'X' Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all focus:outline-none"
          title={typeof closeLabel === "string" ? closeLabel : "Close"}
          aria-label="Close modal"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[calc(90vh-140px)]">
        {children}
      </div>

      {/* Modal Footer: Save & Close buttons */}
      {!hideFooter && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950/50 shrink-0">
          <div>{extraFooterActions}</div>
          {customFooter ? (
            customFooter
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {closeLabel}
              </button>
              <button
                type={onSubmit ? "submit" : saveButtonType}
                onClick={onSubmit ? undefined : onSave}
                disabled={isSaving || saveDisabled}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{saveLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={isSaving ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidth} bg-slate-900 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
            {content}
          </form>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

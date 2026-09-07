"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export interface AdminFormFooterProps {
  onClose?: () => void;
  closeHref?: string;
  closeLabel?: string;
  onSave?: () => void;
  saveLabel?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  saveButtonType?: "submit" | "button";
  extraActions?: React.ReactNode;
  className?: string;
}

export default function AdminFormFooter({
  onClose,
  closeHref,
  closeLabel,
  onSave,
  saveLabel,
  isSaving = false,
  saveDisabled = false,
  saveButtonType = "submit",
  extraActions,
  className = "",
}: AdminFormFooterProps) {
  const { t } = useTranslation();

  const finalCloseLabel = closeLabel || t("admin.common.close", "Close");
  const finalSaveLabel = isSaving
    ? t("admin.common.saving", "Saving...")
    : saveLabel || t("admin.common.save", "Save");

  const closeBtnContent = (
    <span className="inline-flex items-center justify-center">
      {finalCloseLabel}
    </span>
  );

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 mt-8 ${className}`}
    >
      <div className="w-full sm:w-auto">{extraActions}</div>

      <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
        {closeHref ? (
          <Link
            href={closeHref}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] transition-all text-center"
          >
            {closeBtnContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {closeBtnContent}
          </button>
        )}

        <button
          type={saveButtonType}
          onClick={saveButtonType === "button" ? onSave : undefined}
          disabled={isSaving || saveDisabled}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
        >
          {isSaving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>{saveLabel}</span>
        </button>
      </div>
    </div>
  );
}

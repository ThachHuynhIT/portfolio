"use client";

import React from "react";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { gap, radius, text } from "@/lib/design-tokens";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDangerous = false,
  isDestructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const danger = isDestructive ?? isDangerous;
  const finalCancelLabel = cancelLabel || t("admin.common.cancel", "Cancel");
  const finalConfirmLabel = confirmLabel || (danger ? t("admin.common.delete", "Delete") : t("admin.common.confirm", "Confirm"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className={cn("relative z-10 w-full max-w-md bg-gray-900 border border-gray-800", radius.card, "p-6 shadow-2xl")}>
        <h3 className={cn("text-xl font-bold", text.primaryDark, "mb-2")}>{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>

        <div className={cn("flex justify-end", gap.base)}>
          <button
            type="button"
            onClick={onCancel}
            className={cn("px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700", radius.control, "transition-all")}
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all ${
              danger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

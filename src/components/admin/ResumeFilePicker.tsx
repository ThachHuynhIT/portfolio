"use client";

import { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";

interface ResumeFilePickerProps {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  helperText?: string;
  id?: string;
}

/** Single-file PDF uploader for the site's CV/resume — MediaImagePicker is
 * image-only (accepts image/*, previews via <img>), so a plain PDF needs its
 * own minimal picker rather than stretching that component's contract. */
export default function ResumeFilePicker({
  label,
  value,
  onChange,
  helperText,
  id,
}: ResumeFilePickerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "site");
      formData.append("subType", "resume");

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload PDF");

      if (data.asset?.secureUrl) {
        onChange(data.asset.secureUrl);
        toast.success(`Uploaded "${file.name}"!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading PDF";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-200">
        {label}
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/15 hover:border-violet-500/60 bg-slate-950/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
      >
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
        />
        {isUploading ? (
          <div className="flex items-center gap-2 text-violet-400 text-xs py-2">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <span>{t("admin.common.saving", "Uploading to Cloudinary…")}</span>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-base">
              📄
            </div>
            <p className="text-xs font-medium text-slate-300">
              {value ? "Click to replace the PDF" : "Click to select a PDF file"}
            </p>
          </>
        )}
      </div>

      {value && (
        <div className="flex items-center gap-3 p-2.5 bg-slate-950/60 border border-white/10 rounded-xl mt-2">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-lg">
            📄
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-300 font-mono truncate" title={value}>
              {value}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-violet-400 hover:underline"
            >
              {t("admin.common.view", "View")}
            </a>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title={t("admin.common.remove", "Remove")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
}

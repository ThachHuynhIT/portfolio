"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import MediaPickerModal from "./MediaPickerModal";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import type { MediaCategory } from "@/lib/types";

interface MediaImagePickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  category?: MediaCategory;
  subType?: string;
  required?: boolean;
  helperText?: string;
  id?: string;
}

export default function MediaImagePicker({
  label,
  value,
  onChange,
  category = "general",
  subType = "image",
  required = false,
  helperText,
  id,
}: MediaImagePickerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "url">("library");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLightbox(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox]);

  // Direct file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("subType", subType);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải ảnh lên thất bại");

      if (data.asset?.secureUrl) {
        onChange(data.asset.secureUrl);
        toast.success(`Đã tải lên và gán ảnh "${file.name}"!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải ảnh lên");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Option Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-200">
          {label} {required && <span className="text-red-400">*</span>}
        </label>

        {/* 3 Source Modes Switcher */}
        <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-white/10 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("library");
              setIsModalOpen(true);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "library"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📁</span>
            <span>Chọn từ Cloud</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("upload");
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "upload"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>☁️</span>
            <span>Upload Mới</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("url");
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "url"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🔗</span>
            <span>Nhập URL</span>
          </button>
        </div>
      </div>

      {/* Active input based on tab */}
      {activeTab === "url" ? (
        <div className="space-y-2">
          <input
            id={id}
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... (dán đường dẫn ảnh Cloudinary hoặc bên ngoài)"
            className="w-full px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>
      ) : activeTab === "upload" ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/15 hover:border-violet-500/60 bg-slate-950/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex items-center gap-2 text-violet-400 text-xs py-2">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải lên Cloudinary…</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-base">
                ☁️
              </div>
              <p className="text-xs font-medium text-slate-300">
                Click để chọn hoặc kéo thả ảnh vào đây
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Prefix: {category}-{subType}-[timestamp]
              </p>
            </>
          )}
        </div>
      ) : (
        /* Library Mode */
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all group"
          >
            <span className="text-sm">📁</span>
            <span>Mở Thư viện Cloud / Cloudinary để chọn ảnh…</span>
          </button>
        </div>
      )}

      {/* Image Preview Card (if value exists) */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 bg-slate-950/60 border border-white/10 rounded-xl mt-2">
          <div
            onClick={() => setShowLightbox(true)}
            className="w-14 h-14 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 relative border border-white/10 cursor-zoom-in group/thumb"
            title="Click để phóng to xem ảnh gốc"
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"
              onError={(e) => {
                // If broken image, fallback
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
              🔍
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-300 font-mono truncate" title={value}>
              {value}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="text-[11px] text-violet-400 hover:underline"
              >
                Đổi ảnh khác
              </button>
              <span className="text-slate-600 text-xs">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLightbox(true);
                }}
                className="text-[11px] text-slate-400 hover:text-white hover:underline transition-colors flex items-center gap-1"
              >
                <span>Xem ảnh gốc</span>
                <span className="text-[10px]">🔍</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all text-xs"
            title="Xóa ảnh"
          >
            ✕
          </button>
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

      {/* Modal Selection */}
      <MediaPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(selectedUrl) => onChange(selectedUrl)}
        defaultCategory={category}
      />

      {/* Lightbox Popup Modal for Original Image */}
      {showLightbox && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowLightbox(false);
          }}
        >
          {/* Dark frosted backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" />

          {/* Lightbox container */}
          <div
            className="relative z-10 max-w-5xl w-full flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-xs text-white/80 gap-3">
              <span className="font-mono text-[11px] text-slate-300 truncate max-w-sm sm:max-w-md bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/10 shadow">
                {value}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(value);
                    toast.success("Đã sao chép link ảnh!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all shadow"
                >
                  Sao chép link
                </button>
                <button
                  type="button"
                  onClick={() => setShowLightbox(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-sm flex items-center justify-center shadow"
                  title="Đóng (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Original Image Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/70 flex items-center justify-center max-h-[82vh] max-w-full">
              <img
                src={value}
                alt="Full original preview"
                className="max-h-[80vh] max-w-full object-contain select-none rounded-xl"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

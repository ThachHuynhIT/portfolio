"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";
import { useTranslation } from "@/context/LanguageContext";
import type { MediaAsset, MediaCategory } from "@/lib/types";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, asset?: MediaAsset) => void;
  title?: string;
  defaultCategory?: MediaCategory;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title,
  defaultCategory,
}: MediaPickerModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory || "all");
  const [uploading, setUploading] = useState(false);

  const finalTitle = title || t("admin.media.uploadMedia", "Select Image from Cloud Library");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    async function loadMedia() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("type", "image"); // only show images in image picker
        if (category !== "all") params.set("category", category);
        if (search.trim()) params.set("q", search.trim());

        const res = await fetch(`/api/admin/media?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets || []);
        }
      } catch (err) {
        console.error("[MediaPickerModal] Error loading media:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMedia();
  }, [isOpen, category, search]);

  if (!isOpen || !mounted) return null;

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category === "all" ? (defaultCategory || "general") : category);
      fd.append("subType", "upload");

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.asset?.secureUrl) {
          onSelect(data.asset.secureUrl, data.asset);
          onClose();
        }
      }
    } catch (err) {
      console.error("[MediaPickerModal] Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "project", label: "Projects" },
    { id: "photo", label: "Photography" },
    { id: "blog", label: "Blog" },
    { id: "site", label: "Site Config" },
    { id: "music", label: "Music" },
    { id: "general", label: "Other" },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Window */}
      <div
        className="relative z-10 w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Icon name="image" size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{finalTitle}</h3>
              <p className="text-[11px] text-slate-500">
                {t("admin.media.searchPlaceholder", "Click on any image to select and apply to field.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick upload right inside modal */}
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-sm">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleQuickUpload}
              />
              {uploading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="plus" size={13} />
              )}
              <span>{uploading ? t("admin.common.saving", "Uploading...") : t("admin.common.upload", "Upload New")}</span>
            </label>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs flex items-center justify-center"
              aria-label={t("admin.common.close", "Close modal")}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Category Filter */}
        <div className="p-4 border-b border-white/5 bg-slate-900/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.media.searchPlaceholder", "Search images by filename, tag...")}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Icon name="search" size={13} />
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCategory(c.id);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  category === c.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-950/60 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[260px]">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-slate-400 text-xs">{t("admin.common.loading", "Loading media from library…")}</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[260px] text-center p-6 border border-dashed border-white/10 rounded-2xl">
              <div className="flex justify-center mb-1 text-slate-500"><Icon name="image" size={24} /></div>
              <p className="text-sm font-medium text-slate-300">{t("admin.common.noResults", "No images found")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(asset.secureUrl, asset);
                    onClose();
                  }}
                  className="group relative bg-slate-950 border border-white/5 hover:border-violet-500 rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.02] shadow-md flex flex-col text-left"
                >
                  <div className="aspect-square w-full relative bg-black/40 overflow-hidden flex items-center justify-center">
                    <img
                      src={asset.secureUrl}
                      alt={asset.filename}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge Category */}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/70 text-slate-300 border border-white/10 uppercase">
                      {asset.category}
                    </span>

                    {/* Selection overlay */}
                    <div className="absolute inset-0 bg-violet-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-semibold shadow-lg">
                        {t("admin.common.confirm", "Select this image")} <Icon name="check" size={11} />
                      </span>
                    </div>
                  </div>

                  <div className="p-2 w-full">
                    <p
                      className="text-[11px] font-medium text-slate-300 truncate"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </p>
                    {asset.width && asset.height ? (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {asset.width}×{asset.height} px
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-white/5 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            {t("admin.common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import type { MediaAsset, MediaCategory } from "@/lib/types";

// Helper: Format bytes to human-readable size
function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Helper: Format duration in seconds
function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Category configuration
const CATEGORIES: { id: string; label: string; icon: string; color: string }[] = [
  { id: "all", label: "All", icon: "grid", color: "text-slate-300 bg-white/10" },
  { id: "music", label: "Music", icon: "music", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "photo", label: "Photography", icon: "camera", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "project", label: "Projects", icon: "projects", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "blog", label: "Blog", icon: "blog", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "site", label: "Site Config", icon: "settings", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { id: "general", label: "General", icon: "links", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
];

export default function MediaAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useTranslation();

  const getCategoryLabel = (id: string, fallback: string) => {
    return (t.admin.media.categories as any)?.[id] || fallback;
  };

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalBytes: 0,
    totalImages: 0,
    totalVideos: 0,
    totalAudios: 0,
    categoryCounts: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "audio" | "video">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection & Modal states
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>("general");
  const [uploadSubType, setUploadSubType] = useState("asset");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media assets
  const fetchMedia = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to load media assets");
      }

      const data = await res.json();
      setAssets(data.assets || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      console.error("[MediaAdminPage] Error:", err);
      const msg = err instanceof Error ? err.message : "Error loading media";
      toast.error(msg);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [categoryFilter, typeFilter, searchQuery, router, toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Handle search with debounce / enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedia();
  };

  // Sync from Cloudinary
  const handleSyncCloudinary = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/media/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      const successMsg = (t.admin.media.toastSyncSuccess || "Successfully synced {count} files from Cloudinary!").replace(
        "{count}",
        String(data.added || 0)
      );
      toast.success(data.message || successMsg);
      await fetchMedia(false);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Error syncing from Cloudinary";
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1-Click Copy Link
  const handleCopyLink = (url: string, id: string, text?: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success(text || t.admin.media.linkCopied || "Link copied to clipboard!");
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // Delete media asset
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/media?publicId=${encodeURIComponent(deleteTarget.publicId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete file");

      const deletedMsg = (t.admin.media.toastDeleted || "Deleted file \"{filename}\"!").replace(
        "{filename}",
        deleteTarget.filename
      );
      toast.success(deletedMsg);
      if (selectedAsset?.publicId === deleteTarget.publicId) {
        setSelectedAsset(null);
      }
      setDeleteTarget(null);
      await fetchMedia(false);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Error deleting file";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle file select for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  // Handle direct file upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error(t.admin.media.chooseFile || "Please select a file to upload!");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      formData.append("subType", uploadSubType);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const uploadedMsg = (t.admin.media.toastUploadSuccess || "Uploaded file \"{filename}\" successfully!").replace(
        "{filename}",
        uploadFile.name
      );
      toast.success(uploadedMsg);
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchMedia(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading file";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Generate prefix preview in upload dialog
  const uploadPrefixPreview = useMemo(() => {
    const clean = uploadFile ? uploadFile.name.split(".")[0].slice(0, 15) : "filename";
    return `${uploadCategory}-${uploadSubType ? uploadSubType + "-" : ""}${clean}-[timestamp]`;
  }, [uploadCategory, uploadSubType, uploadFile]);

  // Helpers to detect media types for display
  const isAudioItem = (asset: MediaAsset) =>
    asset.subType === "audio" ||
    ["mp3", "wav", "aac", "ogg", "flac"].includes(asset.format.toLowerCase());

  const isVideoItem = (asset: MediaAsset) =>
    asset.resourceType === "video" && !isAudioItem(asset);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <AdminHeader
        title={t.admin.media.title}
        description={t.admin.media.description}
        icon="image"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncCloudinary}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all shadow-sm disabled:opacity-50"
              title={t.admin.media.syncCloudinary}
            >
              <span className={isSyncing ? "animate-spin" : ""}><Icon name="refresh" size={14} /></span>
              <span>{isSyncing ? t.admin.media.syncing : t.admin.media.syncCloudinary}</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Icon name="plus" size={14} />
              <span>{t.admin.media.uploadMedia}</span>
            </button>
          </div>
        }
      />

      {/* ── Quick Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t.admin.media.statTotalFiles}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-mono">
              {t.admin.media.categories.all}
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{stats.totalFiles}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.admin.media.statFilesSub}</p>
        </div>

        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t.admin.media.statTotalStorage}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono">
              CDN
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{formatBytes(stats.totalBytes)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.admin.media.statStorageSub}</p>
        </div>

        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t.admin.media.statImages}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
              IMG
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{stats.totalImages}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{t.admin.media.statImagesSub}</p>
        </div>

        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t.admin.media.statAudioVideo}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono">
              AV
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">
            {stats.totalAudios + stats.totalVideos}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {(t.admin.media.statAudioVideoSub || "{audios} audio · {videos} video")
              .replace("{audios}", String(stats.totalAudios))
              .replace("{videos}", String(stats.totalVideos))}
          </p>
        </div>
      </div>

      {/* ── Toolbar: Search & Multi-level Filter ── */}
      <div className="bg-slate-900/80 border border-white/5 p-4 rounded-2xl space-y-3.5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.admin.media.searchPlaceholder}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon name="search" size={15} />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchMedia();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </form>

          {/* Media type filter & View mode */}
          <div className="flex items-center gap-3">
            {/* Resource Type Tabs */}
            <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl p-0.5">
              {(
                [
                  { id: "all", icon: null, label: t.admin.media.filterAllTypes },
                  { id: "image", icon: "image", label: t.admin.media.typeImages },
                  { id: "audio", icon: "headphones", label: t.admin.media.typeAudio },
                  { id: "video", icon: "video", label: t.admin.media.typeVideo },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    typeFilter === tab.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.icon && <Icon name={tab.icon} size={13} />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon name="grid" size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon name="nav" size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-white/5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0">
            {t.admin.media.categoryLabel}
          </span>
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? stats.totalFiles
                : stats.categoryCounts[cat.id] || 0;
            const isSelected = categoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                    : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15"
                }`}
              >
                <span>{getCategoryLabel(cat.id, cat.label)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content View ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-slate-900/30 rounded-2xl border border-white/5">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-400 text-sm font-medium">{t.admin.common.loading}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-slate-900/20 rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-3">
            <Icon name="folder" size={24} />
          </div>
          <h3 className="text-base font-semibold text-white">{t.admin.media.noAssets}</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
              ? t.admin.media.noAssetsFiltered
              : t.admin.media.noAssetsHint}
          </p>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              {t.admin.media.uploadFirstFile}
            </button>
            <button
              onClick={handleSyncCloudinary}
              disabled={isSyncing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
            >
              {t.admin.media.syncCloudinary}
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {assets.map((asset) => {
            const isAudio = isAudioItem(asset);
            const isVideo = isVideoItem(asset);
            const isCopied = copiedId === asset.id;

            return (
              <div
                key={asset.id}
                className="group bg-slate-900/60 border border-white/5 hover:border-violet-500/40 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-violet-950/20 relative"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => setSelectedAsset(asset)}
                  className="aspect-square bg-slate-950 relative overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  {isAudio ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-purple-400">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon name="music" size={20} />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDuration(asset.duration) || "AUDIO"}
                      </span>
                    </div>
                  ) : isVideo ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black/40">
                      <video
                        src={asset.secureUrl}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        preload="metadata"
                      />
                      <div className="absolute w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm pointer-events-none group-hover:scale-110 transition-transform">
                        <Icon name="play" size={16} />
                      </div>
                      {asset.duration ? (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                          {formatDuration(asset.duration)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <img
                      src={asset.secureUrl}
                      alt={asset.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        asset.category === "music"
                          ? "bg-purple-950/80 text-purple-300 border-purple-500/30"
                          : asset.category === "photo"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                          : asset.category === "project"
                          ? "bg-blue-950/80 text-blue-300 border-blue-500/30"
                          : asset.category === "blog"
                          ? "bg-amber-950/80 text-amber-300 border-amber-500/30"
                          : asset.category === "site"
                          ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/30"
                          : "bg-slate-900/80 text-slate-300 border-slate-700"
                      }`}
                    >
                      {getCategoryLabel(asset.category, asset.category)}
                    </span>
                  </div>

                  {/* Top right format badge */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-slate-300 border border-white/10 uppercase">
                      {asset.format}
                    </span>
                  </div>

                  {/* Quick hover actions overlay */}
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(asset.secureUrl, asset.id);
                      }}
                      title={t.admin.media.copyLink}
                      className="p-2 rounded-xl bg-white/15 hover:bg-violet-600 text-white transition-all transform hover:scale-110"
                    >
                      <Icon name={isCopied ? "check" : "copy"} size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAsset(asset);
                      }}
                      title={t.admin.media.viewDetails}
                      className="p-2 rounded-xl bg-white/15 hover:bg-violet-600 text-white transition-all transform hover:scale-110"
                    >
                      <Icon name="eye" size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(asset);
                      }}
                      title={t.admin.media.deleteFile}
                      className="p-2 rounded-xl bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white transition-all transform hover:scale-110"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>

                {/* File info footer */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p
                      className="text-xs font-semibold text-slate-200 truncate leading-snug"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </p>
                    <p
                      className="text-[10px] text-slate-500 font-mono truncate mt-0.5"
                      title={asset.publicId}
                    >
                      {asset.publicId}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-white/5">
                    <span className="font-mono text-[10px]">
                      {formatBytes(asset.bytes)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(asset.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t.admin.media.colAsset}</th>
                  <th className="py-3 px-3">{t.admin.media.colCategory}</th>
                  <th className="py-3 px-3">{t.admin.media.colType}</th>
                  <th className="py-3 px-3">{t.admin.media.colDimensions}</th>
                  <th className="py-3 px-3">{t.admin.media.colSize}</th>
                  <th className="py-3 px-3">{t.admin.media.colUploaded}</th>
                  <th className="py-3 px-4 text-right">{t.admin.media.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {assets.map((asset) => {
                  const isAudio = isAudioItem(asset);
                  const isVideo = isVideoItem(asset);
                  const isCopied = copiedId === asset.id;

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {isAudio ? (
                              <Icon name="music" size={16} className="text-purple-400" />
                            ) : isVideo ? (
                              <Icon name="video" size={16} className="text-white" />
                            ) : (
                              <img
                                src={asset.secureUrl}
                                alt={asset.filename}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-medium text-white truncate" title={asset.filename}>
                              {asset.filename}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate" title={asset.publicId}>
                              {asset.publicId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 uppercase">
                          {getCategoryLabel(asset.category, asset.category)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono uppercase text-slate-400">
                        {asset.format}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {asset.width && asset.height
                          ? `${asset.width}×${asset.height}`
                          : asset.duration
                          ? formatDuration(asset.duration)
                          : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {formatBytes(asset.bytes)}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(asset.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCopyLink(asset.secureUrl, asset.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs inline-flex items-center gap-1"
                            title={t.admin.media.copyUrl}
                          >
                            {isCopied && <Icon name="check" size={12} />}
                            {isCopied ? (locale === "vi" ? "Đã chép" : "Copied") : t.admin.media.copyUrl}
                          </button>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                            title={t.admin.media.viewDetails}
                          >
                            <Icon name="eye" size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(asset)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            title={t.admin.media.deleteFile}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL / PREVIEW MODAL ── */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedAsset(null)}
          />

          <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Left/Top: Media Preview */}
            <div className="md:w-3/5 bg-slate-950 p-6 flex flex-col items-center justify-center relative min-h-[300px] border-b md:border-b-0 md:border-r border-white/5">
              {isAudioItem(selectedAsset) ? (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="w-24 h-24 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Icon name="music" size={40} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{selectedAsset.filename}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {formatBytes(selectedAsset.bytes)} · {selectedAsset.format.toUpperCase()}
                    </p>
                  </div>
                  <audio
                    src={selectedAsset.secureUrl}
                    controls
                    className="w-full max-w-md mt-2"
                  />
                </div>
              ) : isVideoItem(selectedAsset) ? (
                <div className="w-full flex items-center justify-center">
                  <video
                    src={selectedAsset.secureUrl}
                    controls
                    autoPlay
                    className="max-h-[500px] max-w-full rounded-xl shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto">
                  <img
                    src={selectedAsset.secureUrl}
                    alt={selectedAsset.filename}
                    className="max-h-[520px] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Right: Metadata & Actions */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                      {getCategoryLabel(selectedAsset.category, selectedAsset.category)}
                    </span>
                    <h3
                      className="text-base font-bold text-white mt-1.5 break-all"
                      title={selectedAsset.filename}
                    >
                      {selectedAsset.filename}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all focus:outline-none"
                    title={t.admin.common.close}
                    aria-label={t.admin.common.close}
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>

                {/* Metadata List */}
                <div className="space-y-2.5 pt-3 border-t border-white/5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">{t.admin.media.publicId}</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]" title={selectedAsset.publicId}>
                      {selectedAsset.publicId}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">{t.admin.media.format}</span>
                    <span className="text-slate-200 uppercase font-mono">
                      {selectedAsset.format}
                    </span>
                  </div>

                  {selectedAsset.width && selectedAsset.height ? (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">{t.admin.media.dimensions}</span>
                      <span className="text-slate-200 font-mono">
                        {selectedAsset.width} × {selectedAsset.height} px
                      </span>
                    </div>
                  ) : null}

                  {selectedAsset.duration ? (
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">{t.admin.media.duration}</span>
                      <span className="text-slate-200 font-mono">
                        {formatDuration(selectedAsset.duration)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">{t.admin.media.fileSize}</span>
                    <span className="text-slate-200 font-mono">
                      {formatBytes(selectedAsset.bytes)} ({selectedAsset.bytes.toLocaleString()} bytes)
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-500">{t.admin.media.uploadedDate}</span>
                    <span className="text-slate-200">
                      {new Date(selectedAsset.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                    </span>
                  </div>

                  {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                    <div className="py-1">
                      <span className="text-slate-500 block mb-1.5">{t.admin.media.tags}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAsset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Copy & Export Actions */}
              <div className="space-y-2 pt-6 border-t border-white/5">
                <button
                  onClick={() =>
                    handleCopyLink(selectedAsset.secureUrl, selectedAsset.id, t.admin.media.copiedDirectUrl)
                  }
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-violet-600/20"
                >
                  <Icon name="copy" size={14} />
                  <span>{t.admin.media.copyDirectUrl}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleCopyLink(
                        `![${selectedAsset.filename}](${selectedAsset.secureUrl})`,
                        selectedAsset.id,
                        t.admin.media.copiedMarkdown
                      )
                    }
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
                  >
                    {t.admin.media.copyMarkdown}
                  </button>

                  <button
                    onClick={() =>
                      handleCopyLink(
                        `<img src="${selectedAsset.secureUrl}" alt="${selectedAsset.filename}" />`,
                        selectedAsset.id,
                        t.admin.media.copiedHtml
                      )
                    }
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
                  >
                    {t.admin.media.copyHtml}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={selectedAsset.secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 text-center rounded-xl text-xs font-medium transition-all inline-flex items-center justify-center gap-1"
                  >
                    {t.admin.media.openInNewTab} <Icon name="externalLink" size={11} />
                  </a>
                  <button
                    onClick={() => setDeleteTarget(selectedAsset)}
                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition-all"
                  >
                    {t.admin.media.deleteFile}
                  </button>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
                  >
                    {t.admin.common.close}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UNIVERSAL UPLOAD MODAL ── */}
      <AdminModal
        isOpen={isUploadOpen}
        onClose={() => !isUploading && setIsUploadOpen(false)}
        title={t.admin.media.uploadModalTitle}
        subtitle={t.admin.media.uploadModalSubtitle}
        icon="camera"
        onSubmit={handleUploadSubmit}
        saveLabel={isUploading ? t.admin.media.uploading : t.admin.media.uploadBtn}
        closeLabel={t.admin.common.close}
        isSaving={isUploading}
        saveDisabled={!uploadFile}
        maxWidth="max-w-lg"
      >
        {/* Category selector */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t.admin.media.uploadCategoryLabel}
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => {
                const cat = e.target.value as MediaCategory;
                setUploadCategory(cat);
                if (cat === "music") setUploadSubType("audio");
                else if (cat === "photo") setUploadSubType("processed");
                else if (cat === "project") setUploadSubType("cover");
                else if (cat === "blog") setUploadSubType("cover");
                else if (cat === "site") setUploadSubType("avatar");
                else setUploadSubType("asset");
              }}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="photo">{t.admin.media.categories.photo}</option>
              <option value="music">{t.admin.media.categories.music}</option>
              <option value="project">{t.admin.media.categories.project}</option>
              <option value="blog">{t.admin.media.categories.blog}</option>
              <option value="site">{t.admin.media.categories.site}</option>
              <option value="general">{t.admin.media.categories.general}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t.admin.media.uploadSubTypeLabel}
            </label>
            <input
              type="text"
              value={uploadSubType}
              onChange={(e) => setUploadSubType(e.target.value)}
              placeholder="e.g. audio, thumb, cover..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Dynamic Prefix Preview Box */}
        <div className="bg-slate-950/80 border border-violet-500/20 rounded-xl p-3">
          <p className="text-[11px] text-slate-400">
            {t.admin.media.uploadPrefixLabel}
          </p>
          <p className="text-xs font-mono text-violet-300 font-semibold mt-0.5 truncate">
            {uploadPrefixPreview}
          </p>
        </div>

        {/* Dropzone File Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {t.admin.media.chooseFile}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.webp"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              uploadFile
                ? "border-violet-500/60 bg-violet-500/5"
                : "border-white/10 hover:border-violet-500/40 hover:bg-white/[0.02]"
            }`}
          >
            {uploadPreview ? (
              <div className="space-y-3">
                <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-slate-950 border border-white/10 shadow-lg">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">
                    {uploadFile?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {uploadFile && formatBytes(uploadFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 underline"
                >
                  {t.admin.media.changeFile}
                </button>
              </div>
            ) : uploadFile ? (
              <div className="space-y-2">
                <div className="flex justify-center"><Icon name="folder" size={28} /></div>
                <p className="text-xs font-medium text-white">
                  {uploadFile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {formatBytes(uploadFile.size)}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 underline"
                >
                  {t.admin.media.changeFile}
                </button>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-2">
                  <Icon name="uploadCloud" size={20} />
                </div>
                <p className="text-xs font-medium text-slate-300">
                  {t.admin.media.uploadDropzonePrompt}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {t.admin.media.uploadDropzoneSupport}
                </p>
              </div>
            )}
          </div>
        </div>
      </AdminModal>

      {/* ── CONFIRM DELETE DIALOG ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t.admin.media.deleteTitle}
        message={(t.admin.media.deleteMessage || "Are you sure you want to delete \"{filename}\"?").replace(
          "{filename}",
          deleteTarget?.filename || ""
        )}
        confirmLabel={isDeleting ? t.admin.common.deleting : t.admin.common.delete}
        cancelLabel={t.admin.common.cancel}
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

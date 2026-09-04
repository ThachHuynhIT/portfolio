"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

type SourceMode = "upload" | "url" | "library";

interface TrackFormData {
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  audioUrl: string;
  thumbnailUrl: string;
  published: boolean;
  order: string;
}

interface TrackFormProps {
  initialData?: Partial<TrackFormData> & { id?: string };
  mode: "create" | "edit";
}

const GENRES = [
  "Lo-fi",
  "Ambient",
  "Chillwave",
  "Electronic",
  "Synthwave",
  "Pop",
  "Rock",
  "Jazz",
  "Hip-Hop",
  "Classical",
  "R&B",
  "Cyberpunk",
];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TrackForm({ initialData, mode }: TrackFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TrackFormData>({
    title: initialData?.title ?? "",
    artist: initialData?.artist ?? "",
    album: initialData?.album ?? "",
    genre: initialData?.genre ?? "",
    duration: initialData?.duration !== undefined ? String(initialData.duration) : "",
    audioUrl: initialData?.audioUrl ?? "",
    thumbnailUrl: initialData?.thumbnailUrl ?? "",
    published: initialData?.published ?? true,
    order: initialData?.order !== undefined ? String(initialData.order) : "0",
  });

  const [audioMode, setAudioMode] = useState<SourceMode>(
    initialData?.audioUrl ? "url" : "upload"
  );
  const [thumbMode, setThumbMode] = useState<SourceMode>(
    initialData?.thumbnailUrl ? "url" : "upload"
  );

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(
    initialData?.thumbnailUrl || null
  );
  const [isThumbPickerOpen, setIsThumbPickerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-generate duration when audio file is chosen
  const handleAudioFileChange = (file: File | null) => {
    setAudioFile(file);
    if (!file) return;

    try {
      const tempUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(tempUrl);
      tempAudio.onloadedmetadata = () => {
        if (!isNaN(tempAudio.duration)) {
          const rounded = Math.round(tempAudio.duration);
          setFormData((prev) => ({
            ...prev,
            duration: String(rounded),
            // Auto fill title if empty
            title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          }));
        }
        URL.revokeObjectURL(tempUrl);
      };
    } catch (e) {
      console.warn("Could not read audio duration:", e);
    }
  };

  // Thumbnail preview
  const handleThumbFileChange = (file: File | null) => {
    setThumbFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbPreviewUrl(url);
    } else {
      setThumbPreviewUrl(formData.thumbnailUrl || null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "thumbnailUrl" && thumbMode === "url") {
      setThumbPreviewUrl(value || null);
    }
  };

  // Upload files to Cloudinary via API
  async function uploadFiles(): Promise<{ audioUrl?: string; thumbnailUrl?: string }> {
    if (!audioFile && !thumbFile) return {};
    setIsUploading(true);
    const fd = new FormData();
    if (audioFile) fd.append("audio", audioFile);
    if (thumbFile) fd.append("thumbnail", thumbFile);
    const res = await fetch("/api/music/upload", { method: "POST", body: fd });
    setIsUploading(false);
    if (!res.ok) throw new Error("File upload to storage failed");
    return res.json();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let finalAudioUrl = formData.audioUrl;
      let finalThumbUrl = formData.thumbnailUrl;

      // Upload files if in upload mode
      const uploaded = await uploadFiles();
      if (uploaded.audioUrl) finalAudioUrl = uploaded.audioUrl;
      if (uploaded.thumbnailUrl) finalThumbUrl = uploaded.thumbnailUrl;

      if (!finalAudioUrl && !audioFile) {
        throw new Error("Audio URL or uploaded audio file is required.");
      }

      const payload = {
        ...formData,
        audioUrl: finalAudioUrl,
        thumbnailUrl: finalThumbUrl || null,
        duration: formData.duration ? Number(formData.duration) : 0,
        order: Number(formData.order) || 0,
      };

      const url =
        mode === "edit" && initialData?.id
          ? `/api/music/tracks/${initialData.id}`
          : "/api/music/tracks";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save track.");
      }

      setSuccess(true);
      toast.success(
        mode === "edit"
          ? `Track "${formData.title}" updated successfully!`
          : `Track "${formData.title}" published successfully!`
      );
      setTimeout(() => router.push("/admin/music"), 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPreviewCover = thumbPreviewUrl || formData.thumbnailUrl;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
      {/* ── LEFT: FORM INPUTS ── */}
      <form
        className="lg:col-span-7 bg-gray-900/80 border border-gray-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40 space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === "edit" ? "Edit Track Details" : "Upload New Track"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in metadata, upload audio stream, and configure cover art.
            </p>
          </div>
          <span className="text-2xl">🎵</span>
        </div>

        {/* ── Title & Artist ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide" htmlFor="tf-title">
              Track Title *
            </label>
            <input
              id="tf-title"
              name="title"
              type="text"
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g. Midnight City Lights"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide" htmlFor="tf-artist">
              Artist Name *
            </label>
            <input
              id="tf-artist"
              name="artist"
              type="text"
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g. Synth Collective"
              value={formData.artist}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ── Album & Genre ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide" htmlFor="tf-album">
              Album / EP (Optional)
            </label>
            <input
              id="tf-album"
              name="album"
              type="text"
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g. Neon Horizon Vol. 1"
              value={formData.album}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide" htmlFor="tf-genre">
              Genre / Vibe
            </label>
            <input
              id="tf-genre"
              name="genre"
              type="text"
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Select chip or type..."
              value={formData.genre}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Quick Genre Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-gray-500">QUICK GENRE SELECT:</span>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setFormData((prev) => ({ ...prev, genre: g }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  formData.genre.toLowerCase() === g.toLowerCase()
                    ? "bg-purple-600/30 border-purple-500 text-purple-300"
                    : "bg-gray-800/50 border-gray-700/80 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── Duration & Order ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide" htmlFor="tf-duration">
                Duration (Seconds)
              </label>
              {formData.duration && (
                <span className="text-xs font-mono text-purple-400 font-bold">
                  {formatTime(Number(formData.duration))}
                </span>
              )}
            </div>
            <input
              id="tf-duration"
              name="duration"
              type="number"
              min={0}
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Auto-calculated or enter e.g. 210"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide" htmlFor="tf-order">
              Display Order Priority
            </label>
            <input
              id="tf-order"
              name="order"
              type="number"
              min={0}
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="0 (lower appears first)"
              value={formData.order}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ── Audio Source ── */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Audio Source *
            </label>
            <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  audioMode === "upload" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setAudioMode("upload")}
              >
                ☁️ Upload Audio
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  audioMode === "url" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setAudioMode("url")}
              >
                🔗 Direct URL
              </button>
            </div>
          </div>

          {audioMode === "url" ? (
            <input
              id="tf-audioUrl"
              name="audioUrl"
              type="url"
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="https://... (mp3, wav, ogg or stream URL)"
              value={formData.audioUrl}
              onChange={handleChange}
            />
          ) : (
            <div
              className="border-2 border-dashed border-gray-700 hover:border-purple-500/80 bg-gray-800/30 hover:bg-purple-950/10 rounded-2xl p-6 text-center cursor-pointer transition-all"
              onClick={() => audioInputRef.current?.click()}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleAudioFileChange(e.target.files?.[0] ?? null)}
              />
              {audioFile ? (
                <div className="flex items-center justify-center gap-2 text-purple-300 font-semibold text-sm">
                  <span>✅ Selected:</span>
                  <span className="underline">{audioFile.name}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-3xl block mb-1">🎧</span>
                  <p className="text-sm font-semibold text-gray-200">
                    Click to select audio file (.mp3, .wav, .m4a, .ogg)
                  </p>
                  <p className="text-xs text-gray-500">
                    Duration and title will be auto-detected upon selection
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Cover Art Thumbnail ── */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Cover Artwork
            </label>
            <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  thumbMode === "upload" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setThumbMode("upload")}
              >
                ☁️ Upload Image
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  thumbMode === "library" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => {
                  setThumbMode("library");
                  setIsThumbPickerOpen(true);
                }}
              >
                📁 Cloud Library
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  thumbMode === "url" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setThumbMode("url")}
              >
                🔗 Image URL
              </button>
            </div>
          </div>

          {thumbMode === "url" ? (
            <input
              id="tf-thumbnailUrl"
              name="thumbnailUrl"
              type="url"
              className="w-full px-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="https://... (image cover art URL)"
              value={formData.thumbnailUrl}
              onChange={handleChange}
            />
          ) : thumbMode === "library" ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsThumbPickerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-800/60 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-purple-500 text-purple-300 rounded-xl text-xs font-semibold transition-all"
              >
                <span>📁</span>
                <span>Mở Thư viện Cloud để chọn ảnh bìa bài hát…</span>
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-700 hover:border-purple-500/80 bg-gray-800/30 hover:bg-purple-950/10 rounded-2xl p-5 text-center cursor-pointer transition-all"
              onClick={() => thumbInputRef.current?.click()}
            >
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleThumbFileChange(e.target.files?.[0] ?? null)}
              />
              {thumbFile ? (
                <div className="flex items-center justify-center gap-2 text-purple-300 font-semibold text-sm">
                  <span>🖼️ Artwork:</span>
                  <span className="underline">{thumbFile.name}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-2xl block mb-1">🖼️</span>
                  <p className="text-xs font-semibold text-gray-200">
                    Click to select album cover art (Square 1:1 recommended)
                  </p>
                  <p className="text-[11px] text-gray-500">JPG, PNG, WEBP, GIF</p>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Preview if set */}
          {formData.thumbnailUrl && (
            <div className="flex items-center gap-3 p-2 bg-gray-800/60 border border-gray-700 rounded-xl mt-2">
              <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 border border-white/5">
                <img
                  src={formData.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-300 font-mono truncate" title={formData.thumbnailUrl}>
                  {formData.thumbnailUrl}
                </p>
                <button
                  type="button"
                  onClick={() => setIsThumbPickerOpen(true)}
                  className="text-[11px] text-purple-400 hover:underline mt-0.5"
                >
                  Đổi ảnh từ thư viện
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, thumbnailUrl: "" }));
                  setThumbFile(null);
                  setThumbPreviewUrl(null);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all text-xs"
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Published Toggle ── */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-800">
          <input
            id="tf-published"
            name="published"
            type="checkbox"
            checked={formData.published}
            onChange={handleChange}
            className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
          />
          <label htmlFor="tf-published" className="text-sm font-semibold text-gray-200 cursor-pointer">
            Published (Visible on public <span className="text-purple-400 font-mono">/music</span> lounge)
          </label>
        </div>

        {/* ── Status Messages ── */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            ✅ Track saved successfully! Redirecting…
          </div>
        )}

        {/* ── Buttons ── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {isUploading
              ? "☁️ Uploading Media…"
              : isSubmitting
              ? "Saving Track…"
              : mode === "edit"
              ? "Save Changes"
              : "Publish Track"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/music")}
            className="py-3 px-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* ── RIGHT: REAL-TIME LIVE PREVIEW ── */}
      <div className="lg:col-span-5 space-y-4 sticky top-6">
        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Live Player Preview
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
            Realtime
          </span>
        </div>

        {/* Preview Turntable Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-gray-900 to-black border border-white/10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Ambient light */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

          {/* Cover Art */}
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl mb-5 bg-gray-800 border border-white/10">
            {currentPreviewCover ? (
              <img
                src={currentPreviewCover}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-5xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 text-white/50">
                <span>🎵</span>
                <span className="text-[10px] font-semibold text-gray-400 mt-2 uppercase tracking-widest">
                  Cover Art
                </span>
              </div>
            )}

            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-white/10">
                {formData.genre || "Genre"}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <h3 className="font-bold text-lg text-white mb-1 truncate max-w-full px-2">
            {formData.title || "Untitled Track"}
          </h3>
          <p className="text-sm text-gray-400 mb-2 truncate max-w-full px-2">
            {formData.artist || "Unknown Artist"}
          </p>

          {formData.album && (
            <span className="text-xs text-purple-300/80 bg-purple-500/10 px-3 py-0.5 rounded-full border border-purple-500/20 mb-4">
              💿 {formData.album}
            </span>
          )}

          {/* Dummy visualizer preview */}
          <div className="flex items-end gap-1 h-6 w-32 justify-center my-2 opacity-70">
            <span className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full h-2" />
            <span className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full h-5" />
            <span className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full h-3" />
            <span className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full h-6" />
            <span className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full h-4" />
            <span className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full h-2" />
          </div>

          <div className="w-full flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-800/80 mt-2 font-mono">
            <span>0:00</span>
            <span className="text-purple-400 font-bold">
              {formData.duration ? formatTime(Number(formData.duration)) : "0:00"}
            </span>
          </div>
        </div>
      </div>

      {/* Media Picker Modal for Album Cover */}
      <MediaPickerModal
        isOpen={isThumbPickerOpen}
        onClose={() => setIsThumbPickerOpen(false)}
        onSelect={(url) => {
          setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
          setThumbFile(null);
          setThumbPreviewUrl(url);
        }}
        title="Chọn ảnh bìa từ Cloud / Thư viện"
        defaultCategory="music"
      />
    </div>
  );
}


"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type SourceMode = "upload" | "url";

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

const GENRES = ["Pop", "Rock", "Jazz", "Electronic", "Hip-Hop", "Classical", "R&B", "Lo-fi", "Ambient", "Other"];

export default function TrackForm({ initialData, mode }: TrackFormProps) {
  const router = useRouter();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TrackFormData>({
    title: initialData?.title ?? "",
    artist: initialData?.artist ?? "",
    album: initialData?.album ?? "",
    genre: initialData?.genre ?? "",
    duration: initialData?.duration ?? "",
    audioUrl: initialData?.audioUrl ?? "",
    thumbnailUrl: initialData?.thumbnailUrl ?? "",
    published: initialData?.published ?? true,
    order: initialData?.order ?? "0",
  });

  const [audioMode, setAudioMode] = useState<SourceMode>("url");
  const [thumbMode, setThumbMode] = useState<SourceMode>("url");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    if (!res.ok) throw new Error("File upload failed");
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

      if (!finalAudioUrl) {
        throw new Error("Audio URL or file is required");
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
        throw new Error(err.error ?? "Save failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/music"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="music-form" onSubmit={handleSubmit} id="track-form">
      {/* ── Basic Info ── */}
      <div className="music-form__row">
        <div className="music-form-group">
          <label className="music-form-label" htmlFor="tf-title">Title *</label>
          <input
            id="tf-title"
            name="title"
            type="text"
            className="music-form-input"
            placeholder="Song title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="music-form-group">
          <label className="music-form-label" htmlFor="tf-artist">Artist *</label>
          <input
            id="tf-artist"
            name="artist"
            type="text"
            className="music-form-input"
            placeholder="Artist name"
            value={formData.artist}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="music-form__row">
        <div className="music-form-group">
          <label className="music-form-label" htmlFor="tf-album">Album</label>
          <input
            id="tf-album"
            name="album"
            type="text"
            className="music-form-input"
            placeholder="Album name"
            value={formData.album}
            onChange={handleChange}
          />
        </div>
        <div className="music-form-group">
          <label className="music-form-label" htmlFor="tf-genre">Genre</label>
          <select
            id="tf-genre"
            name="genre"
            className="music-form-select"
            value={formData.genre}
            onChange={handleChange}
          >
            <option value="">— Select genre —</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="music-form__row">
        <div className="music-form-group">
          <label className="music-form-label" htmlFor="tf-duration">Duration (seconds)</label>
          <input
            id="tf-duration"
            name="duration"
            type="number"
            min={0}
            className="music-form-input"
            placeholder="e.g. 213"
            value={formData.duration}
            onChange={handleChange}
          />
        </div>
        <div className="music-form-group">
          <label className="music-form-label" htmlFor="tf-order">Order</label>
          <input
            id="tf-order"
            name="order"
            type="number"
            min={0}
            className="music-form-input"
            placeholder="0"
            value={formData.order}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ── Audio Source ── */}
      <div className="music-form-group">
        <label className="music-form-label">Audio Source *</label>
        <div className="music-source-tabs">
          <button
            type="button"
            className={`music-source-tab ${audioMode === "url" ? "music-source-tab--active" : ""}`}
            onClick={() => setAudioMode("url")}
          >
            🔗 URL
          </button>
          <button
            type="button"
            className={`music-source-tab ${audioMode === "upload" ? "music-source-tab--active" : ""}`}
            onClick={() => setAudioMode("upload")}
          >
            ☁️ Upload to Cloudinary
          </button>
        </div>
        {audioMode === "url" ? (
          <input
            id="tf-audioUrl"
            name="audioUrl"
            type="url"
            className="music-form-input"
            placeholder="https://... (mp3, ogg, wav, or stream URL)"
            value={formData.audioUrl}
            onChange={handleChange}
          />
        ) : (
          <div
            className="music-form-file-area"
            onClick={() => audioInputRef.current?.click()}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
            {audioFile ? (
              <p style={{ color: "#a78bfa", margin: 0 }}>✅ {audioFile.name}</p>
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
                  Click to select an audio file
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
                  MP3, WAV, OGG, M4A · Max 50 MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Thumbnail Source ── */}
      <div className="music-form-group">
        <label className="music-form-label">Thumbnail / Cover Art</label>
        <div className="music-source-tabs">
          <button
            type="button"
            className={`music-source-tab ${thumbMode === "url" ? "music-source-tab--active" : ""}`}
            onClick={() => setThumbMode("url")}
          >
            🔗 URL
          </button>
          <button
            type="button"
            className={`music-source-tab ${thumbMode === "upload" ? "music-source-tab--active" : ""}`}
            onClick={() => setThumbMode("upload")}
          >
            ☁️ Upload to Cloudinary
          </button>
        </div>
        {thumbMode === "url" ? (
          <input
            id="tf-thumbnailUrl"
            name="thumbnailUrl"
            type="url"
            className="music-form-input"
            placeholder="https://... (image URL)"
            value={formData.thumbnailUrl}
            onChange={handleChange}
          />
        ) : (
          <div
            className="music-form-file-area"
            onClick={() => thumbInputRef.current?.click()}
          >
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            />
            {thumbFile ? (
              <p style={{ color: "#a78bfa", margin: 0 }}>✅ {thumbFile.name}</p>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Click to select album art
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Published toggle ── */}
      <div className="music-form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
        <input
          id="tf-published"
          name="published"
          type="checkbox"
          checked={formData.published}
          onChange={handleChange}
          style={{ width: 18, height: 18, accentColor: "#8b5cf6", cursor: "pointer" }}
        />
        <label className="music-form-label" htmlFor="tf-published" style={{ cursor: "pointer", marginBottom: 0 }}>
          Published (visible on /music)
        </label>
      </div>

      {/* ── Messages ── */}
      {error && (
        <div style={{ color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ color: "#4ade80", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          ✅ Saved! Redirecting…
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          type="submit"
          id="tf-submit-btn"
          className="music-form-btn music-form-btn--primary"
          disabled={isSubmitting || isUploading}
        >
          {isUploading ? "Uploading…" : isSubmitting ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Track"}
        </button>
        <button
          type="button"
          className="music-form-btn music-form-btn--secondary"
          onClick={() => router.push("/admin/music")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

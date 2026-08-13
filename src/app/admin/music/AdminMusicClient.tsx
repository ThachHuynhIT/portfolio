"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  thumbnailUrl: string | null;
  published: boolean;
  playCount: number;
  order: number;
  createdAt: string;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminMusicClient({ tracks: initial }: { tracks: Track[] }) {
  const router = useRouter();
  const [tracks, setTracks] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/music/tracks/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Delete failed. Please try again.");
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/music/tracks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, published: updated.published } : t)));
    }
  };

  if (tracks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "rgba(255,255,255,0.4)" }}>
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</p>
        <p>No tracks yet.</p>
        <Link href="/admin/music/new">
          <button className="music-form-btn music-form-btn--primary" style={{ marginTop: "1rem" }}>
            Add your first track
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="music-admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Track</th>
            <th>Artist</th>
            <th>Album</th>
            <th>Genre</th>
            <th>Duration</th>
            <th>Plays</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id}>
              <td style={{ color: "rgba(255,255,255,0.3)", width: 40 }}>{track.order}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {track.thumbnailUrl ? (
                    <img src={track.thumbnailUrl} alt="" className="music-admin-thumb" />
                  ) : (
                    <div className="music-admin-thumb" style={{ background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                      🎵
                    </div>
                  )}
                  <span style={{ fontWeight: 600 }}>{track.title}</span>
                </div>
              </td>
              <td>{track.artist}</td>
              <td style={{ color: "rgba(255,255,255,0.5)" }}>{track.album ?? "—"}</td>
              <td style={{ color: "rgba(255,255,255,0.5)" }}>{track.genre ?? "—"}</td>
              <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatDuration(track.duration)}</td>
              <td style={{ color: "rgba(255,255,255,0.5)" }}>{track.playCount.toLocaleString()}</td>
              <td>
                <button
                  className={`music-status-badge ${track.published ? "music-status-badge--published" : "music-status-badge--draft"}`}
                  style={{ cursor: "pointer", border: "none" }}
                  onClick={() => handleTogglePublish(track.id, track.published)}
                  title="Click to toggle"
                >
                  {track.published ? "● Published" : "○ Draft"}
                </button>
              </td>
              <td>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link href={`/admin/music/${track.id}/edit`}>
                    <button className="music-form-btn music-form-btn--secondary" style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}>
                      Edit
                    </button>
                  </Link>
                  <button
                    id={`delete-track-${track.id}`}
                    className="music-form-btn music-form-btn--danger"
                    style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
                    onClick={() => handleDelete(track.id, track.title)}
                    disabled={deleting === track.id}
                  >
                    {deleting === track.id ? "…" : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

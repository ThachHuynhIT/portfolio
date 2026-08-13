import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import AdminMusicClient from "./AdminMusicClient";
import "../../music/music.css";

export const metadata: Metadata = {
  title: "Music Management | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminMusicPage() {
  const tracks = await db.track.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const serialized = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    genre: t.genre,
    duration: t.duration,
    audioUrl: t.audioUrl,
    thumbnailUrl: t.thumbnailUrl,
    published: t.published,
    playCount: t.playCount,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="music-admin-page">
      <div className="music-admin-header">
        <div>
          <Link href="/admin" className="music-admin-back">
            ← Back to Admin
          </Link>
          <h1 className="music-admin-title">🎵 Music Management</h1>
        </div>
        <Link href="/admin/music/new">
          <button className="music-form-btn music-form-btn--primary" id="add-track-btn">
            + Add Track
          </button>
        </Link>
      </div>

      <AdminMusicClient tracks={serialized} />
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import AdminMusicClient from "./AdminMusicClient";
import AdminHeader from "@/components/admin/AdminHeader";

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
    <div className="max-w-7xl space-y-6">
      <AdminHeader
        title="Music Tracks"
        description="Upload and manage audio tracks for the /music lounge. Preview, filter, and batch-manage your library."
        icon="music"
        action={
          <Link
            href="/admin/music/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
          >
            <span className="text-base leading-none">+</span>
            Add Track
          </Link>
        }
      />

      <AdminMusicClient tracks={serialized} />
    </div>
  );
}

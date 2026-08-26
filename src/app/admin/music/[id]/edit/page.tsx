import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import TrackForm from "@/components/music/admin/TrackForm";
import "@/app/music/music.css";

export const metadata: Metadata = {
  title: "Edit Track | Music Admin",
};

export const dynamic = "force-dynamic";

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await db.track.findUnique({ where: { id } });
  if (!track) notFound();

  return (
    <div className="music-admin-page">
      <Link href="/admin/music" className="music-admin-back">
        ← Back to Music Management
      </Link>
      <h1 className="music-admin-title" style={{ marginBottom: "1.5rem" }}>
        Edit: {track.title}
      </h1>
      <TrackForm
        mode="edit"
        initialData={{
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album ?? "",
          genre: track.genre ?? "",
          duration: String(track.duration),
          audioUrl: track.audioUrl,
          thumbnailUrl: track.thumbnailUrl ?? "",
          published: track.published,
          order: String(track.order),
        }}
      />
    </div>
  );
}

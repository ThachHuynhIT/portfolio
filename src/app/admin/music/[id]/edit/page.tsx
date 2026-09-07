import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import TrackForm from "@/components/music/admin/TrackForm";
import AdminHeader from "@/components/admin/AdminHeader";
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
    <div className="space-y-6">
      <AdminHeader
        title={`Edit: ${track.title}`}
        description="Update track audio, metadata, and album cover."
        icon="music"
        closeHref="/admin/music"
      />
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

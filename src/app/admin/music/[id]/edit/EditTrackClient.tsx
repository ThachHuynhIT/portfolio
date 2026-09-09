"use client";

import TrackForm from "@/components/music/admin/TrackForm";
import AdminHeader from "@/components/admin/AdminHeader";
import { useTranslation } from "@/context/TranslationContext";

export default function EditTrackClient({ track }: { track: any }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`${t.admin.common.edit}: ${track.title}`}
        description={t.admin.music.description}
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

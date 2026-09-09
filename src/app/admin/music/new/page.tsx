"use client";

import TrackForm from "@/components/music/admin/TrackForm";
import AdminHeader from "@/components/admin/AdminHeader";
import { useTranslation } from "@/context/TranslationContext";
import "@/app/music/music.css";

export default function NewTrackPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t.admin.music.modalCreateTitle}
        description={t.admin.music.description}
        icon="music"
        closeHref="/admin/music"
      />
      <TrackForm mode="create" />
    </div>
  );
}

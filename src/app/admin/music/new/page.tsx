import { Metadata } from "next";
import TrackForm from "@/components/music/admin/TrackForm";
import AdminHeader from "@/components/admin/AdminHeader";
import "@/app/music/music.css";

export const metadata: Metadata = {
  title: "Add Track | Music Admin",
};

export default function NewTrackPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Add New Track"
        description="Add and configure audio tracks for the music lounge."
        icon="music"
        closeHref="/admin/music"
      />
      <TrackForm mode="create" />
    </div>
  );
}

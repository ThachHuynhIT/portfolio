import { Metadata } from "next";
import Link from "next/link";
import TrackForm from "@/components/music/admin/TrackForm";
import "@/app/music/music.css";

export const metadata: Metadata = {
  title: "Add Track | Music Admin",
};

export default function NewTrackPage() {
  return (
    <div className="music-admin-page">
      <Link href="/admin/music" className="music-admin-back">
        ← Back to Music Management
      </Link>
      <h1 className="music-admin-title" style={{ marginBottom: "1.5rem" }}>
        Add New Track
      </h1>
      <TrackForm mode="create" />
    </div>
  );
}

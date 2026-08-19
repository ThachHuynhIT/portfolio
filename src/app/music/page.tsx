import { Metadata } from "next";
import { db } from "@/lib/db";
import MusicPlayer from "@/components/music/MusicPlayer";
import "./music.css";

export const metadata: Metadata = {
  title: "Music Lounge | Soundtracks & Curated Vibes",
  description: "Immerse yourself in high-fidelity sound, lo-fi beats, and soundscapes curated for deep focus and chill vibes.",
};

export const revalidate = 60; // ISR — revalidate every 60 seconds

export default async function MusicPage() {
  let tracks: Array<{
    id: string;
    title: string;
    artist: string;
    album: string | null;
    duration: number;
    audioUrl: string;
    thumbnailUrl: string | null;
    genre: string | null;
    playCount: number;
  }> = [];

  try {
    const rawTracks = await db.track.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    tracks = rawTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      audioUrl: t.audioUrl,
      thumbnailUrl: t.thumbnailUrl,
      genre: t.genre,
      playCount: t.playCount,
    }));
  } catch (error) {
    console.error("[MusicPage] Failed to fetch tracks from database:", error);
  }

  return (
    <div className="music-page-root">
      <MusicPlayer tracks={tracks} />
    </div>
  );
}


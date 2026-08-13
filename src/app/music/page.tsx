import { Metadata } from "next";
import { db } from "@/lib/db";
import MusicPlayer from "@/components/music/MusicPlayer";
import "./music.css";

export const metadata: Metadata = {
  title: "Music | Portfolio",
  description: "Listen to my music collection — a curated playlist of tracks I love and create.",
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
    <>
      {/* Hero header above the player */}
      <section className="music-page-hero">
        <h1 className="music-page-hero__title">🎵 Music</h1>
        <p className="music-page-hero__sub">
          {tracks.length > 0
            ? `${tracks.length} track${tracks.length !== 1 ? "s" : ""} · Enjoy the vibes`
            : "No tracks yet — check back soon!"}
        </p>
      </section>

      <MusicPlayer tracks={tracks} />
    </>
  );
}

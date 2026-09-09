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

  return <AdminMusicClient tracks={serialized} />;
}

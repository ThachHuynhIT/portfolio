import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EditTrackClient from "./EditTrackClient";
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

  return <EditTrackClient track={track} />;
}

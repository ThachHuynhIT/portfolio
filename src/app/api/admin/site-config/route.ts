import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile } from "@/lib/data-manager";
import type { SiteConfig } from "@/lib/types";

const FILE = "site-config.json";

const defaultConfig: SiteConfig = {
  name: "ThachHuynh's Portfolio",
  title: "Thach Huynh | Creative Web Developer",
  description: "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  url: "https://johndoe.dev",
  ogImage: "/og.jpg",
  author: { name: "Thach Huynh", title: "Creative Web Developer", bio: "", avatar: "/avatar.jpg", email: "thachhuynhit.ut@gmail.com", location: "San Francisco, CA" },
};

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const data = readJsonFile<SiteConfig>(FILE, defaultConfig);
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    writeJsonFile(FILE, body as SiteConfig);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

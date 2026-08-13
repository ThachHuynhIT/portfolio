import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile } from "@/lib/data-manager";
import type { SiteConfig } from "@/lib/types";

const FILE = "site-config.json";

const defaultConfig: SiteConfig = {
  name: "Developer Portfolio",
  title: "John Doe | Creative Web Developer",
  description: "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  url: "https://johndoe.dev",
  ogImage: "/og.jpg",
  author: { name: "John Doe", title: "Creative Web Developer", bio: "", avatar: "/avatar.jpg", email: "hello@johndoe.dev", location: "San Francisco, CA" },
};

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = readJsonFile<SiteConfig>(FILE, defaultConfig);
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    writeJsonFile(FILE, body as SiteConfig);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

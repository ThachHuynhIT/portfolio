import { NextResponse } from "next/server";
import { getPublishedCoupleData } from "@/lib/content/couple";

export async function GET() {
  try {
    const publicData = await getPublishedCoupleData();
    return NextResponse.json(publicData, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("[GET /api/couple] Error:", error);
    return NextResponse.json(
      {
        person1: "",
        person2: "",
        anniversary: "",
        footerQuote: "",
        birthdays: [],
        specialDates: [],
        memories: [],
        photos: [],
        bucketList: [],
        loveLetters: [],
        favorites: [],
      },
      { status: 500 }
    );
  }
}

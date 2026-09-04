import { NextResponse } from "next/server";
import { readJsonFile } from "@/lib/data-manager";
import type { CoupleData } from "@/lib/types";

const FILE = "couple.json";

const DEFAULT_COUPLE_DATA: CoupleData = {
  person1: "Cục Đá",
  person2: "Bé Mèo",
  anniversary: "2025-05-30 21:00:00",
  footerQuote: "\"Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.\"",
  birthdays: [
    { name: "Anh", date: "2001-01-18", emoji: "🎂", zodiac: "♑ Ma Kết" },
    { name: "Em", date: "2002-07-28", emoji: "🎀", zodiac: "♌ Sư Tử" },
  ],
  specialDates: [
    { name: "Ngày yêu nhau", date: "2025-05-30", emoji: "💕" },
    { name: "Kỷ niệm 1 năm", date: "2026-05-30", emoji: "🎉" },
    { name: "Kỷ niệm 2 năm", date: "2027-05-30", emoji: "🥂" },
  ],
  memories: [],
  photos: [],
  bucketList: [],
  loveLetters: [],
  favorites: [],
};

export async function GET() {
  try {
    const data = readJsonFile<CoupleData>(FILE, DEFAULT_COUPLE_DATA);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("[GET /api/couple] Error:", error);
    return NextResponse.json(DEFAULT_COUPLE_DATA, { status: 500 });
  }
}

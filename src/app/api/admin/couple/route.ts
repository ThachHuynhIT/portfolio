import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { CoupleData, CouplePhotoMemory } from "@/lib/types";

const FILE = "couple.json";

const DEFAULT_COUPLE_DATA: CoupleData = {
  person1: "Cục Đá",
  person2: "Bé Mèo",
  anniversary: "2025-05-30 21:00:00",
  footerQuote: "\"Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.\"",
  birthdays: [],
  specialDates: [],
  memories: [],
  photos: [],
  bucketList: [],
  loveLetters: [],
  favorites: [],
};

function ensureDataArrays(data: CoupleData): CoupleData {
  if (!data.photos) data.photos = [];
  if (!data.memories) data.memories = [];
  if (!data.birthdays) data.birthdays = [];
  if (!data.specialDates) data.specialDates = [];
  if (!data.bucketList) data.bucketList = [];
  if (!data.loveLetters) data.loveLetters = [];
  if (!data.favorites) data.favorites = [];
  return data;
}

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = readJsonFile<CoupleData>(FILE, DEFAULT_COUPLE_DATA);
  return NextResponse.json(ensureDataArrays(data));
}

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawData = readJsonFile<CoupleData>(FILE, DEFAULT_COUPLE_DATA);
    const data = ensureDataArrays(rawData);

    // 1. General info update
    if (body.type === "info" || (body.person1 && !body.section && !body.image)) {
      data.person1 = body.person1 ?? data.person1;
      data.person2 = body.person2 ?? data.person2;
      data.anniversary = body.anniversary ?? data.anniversary;
      data.footerQuote = body.footerQuote ?? data.footerQuote;
      writeJsonFile(FILE, data);
      return NextResponse.json({ success: true, data });
    }

    const section = body.section || (body.image ? "photos" : "info");

    switch (section) {
      case "photos": {
        const newPhoto: CouplePhotoMemory = {
          id: generateId("couple-photo"),
          title: body.title || "Kỷ niệm đẹp",
          description: body.description || "",
          image: body.image || "",
          date: body.date || new Date().toISOString().split("T")[0],
          location: body.location || "",
          category: body.category || "Kỷ niệm",
          featured: Boolean(body.featured),
          published: body.published !== undefined ? Boolean(body.published) : true,
          order: (data.photos.length > 0 ? Math.max(...data.photos.map((p) => p.order || 0)) : 0) + 1,
        };
        data.photos.unshift(newPhoto);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newPhoto }, { status: 201 });
      }

      case "memories": {
        const newMemory = {
          id: generateId("mem"),
          date: body.date || new Date().toISOString().split("T")[0],
          title: body.title || "Cột mốc mới",
          description: body.description || "",
          emoji: body.emoji || "✨",
          published: body.published !== undefined ? Boolean(body.published) : true,
        };
        data.memories.unshift(newMemory);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newMemory }, { status: 201 });
      }

      case "birthdays": {
        const newBirthday = {
          name: body.name || "Người ấy",
          date: body.date || "2000-01-01",
          emoji: body.emoji || "🎂",
          zodiac: body.zodiac || "✨",
          published: body.published !== undefined ? Boolean(body.published) : true,
        };
        data.birthdays.push(newBirthday);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newBirthday }, { status: 201 });
      }

      case "specialDates": {
        const newSpecialDate = {
          name: body.name || "Ngày kỷ niệm",
          date: body.date || new Date().toISOString().split("T")[0],
          emoji: body.emoji || "🎉",
          published: body.published !== undefined ? Boolean(body.published) : true,
        };
        data.specialDates.push(newSpecialDate);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newSpecialDate }, { status: 201 });
      }

      case "bucketList": {
        const newBucketItem = {
          id: generateId("bucket"),
          text: body.text || "Dự định mới",
          emoji: body.emoji || "🌟",
          done: Boolean(body.done),
          published: body.published !== undefined ? Boolean(body.published) : true,
        };
        data.bucketList.push(newBucketItem);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newBucketItem }, { status: 201 });
      }

      case "loveLetters": {
        const newLetter = {
          id: generateId("letter"),
          from: body.from || data.person1 || "Anh",
          content: body.content || "",
          date: body.date || new Date().toISOString().split("T")[0],
          published: body.published !== undefined ? Boolean(body.published) : true,
        };
        data.loveLetters.unshift(newLetter);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newLetter }, { status: 201 });
      }

      case "favorites": {
        const newFav = {
          id: generateId("fav"),
          category: body.category || "Sở thích",
          title: body.title || "Điều yêu thích",
          description: body.description || "",
          emoji: body.emoji || "💝",
          published: body.published !== undefined ? Boolean(body.published) : true,
        };
        data.favorites.push(newFav);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: newFav }, { status: 201 });
      }

      default:
        return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[POST /api/admin/couple] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawData = readJsonFile<CoupleData>(FILE, DEFAULT_COUPLE_DATA);
    const data = ensureDataArrays(rawData);

    // 1. Updating general couple info
    if (body.type === "info" || (body.person1 && !body.section && !body.id && !body.image)) {
      data.person1 = body.person1 ?? data.person1;
      data.person2 = body.person2 ?? data.person2;
      data.anniversary = body.anniversary ?? data.anniversary;
      data.footerQuote = body.footerQuote ?? data.footerQuote;
      writeJsonFile(FILE, data);
      return NextResponse.json({ success: true, data });
    }

    // 2. Replacing whole section array (e.g. bulk update / reorder / toggle)
    if (body.section && Array.isArray(body.items)) {
      (data as any)[body.section] = body.items;
      writeJsonFile(FILE, data);
      return NextResponse.json({ success: true, section: body.section, items: body.items });
    }

    // 3. Updating specific item in a section
    const section = body.section || "photos";
    const itemId = body.id || body.item?.id;

    if (section === "birthdays") {
      // Birthdays match by index, id or name
      const index =
        body.index !== undefined
          ? body.index
          : data.birthdays.findIndex((b) => (itemId && b.id === itemId) || b.name === body.name);
      if (index >= 0 && index < data.birthdays.length) {
        data.birthdays[index] = { ...data.birthdays[index], ...(body.item || body) };
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: data.birthdays[index] });
      }
      return NextResponse.json({ error: "Birthday item not found" }, { status: 404 });
    }

    if (section === "specialDates") {
      const index =
        body.index !== undefined
          ? body.index
          : data.specialDates.findIndex((s) => (itemId && s.id === itemId) || s.name === body.name);
      if (index >= 0 && index < data.specialDates.length) {
        data.specialDates[index] = { ...data.specialDates[index], ...(body.item || body) };
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, item: data.specialDates[index] });
      }
      return NextResponse.json({ error: "Special date item not found" }, { status: 404 });
    }

    // For sections with item id
    const sectionArray = (data as any)[section];
    if (!Array.isArray(sectionArray)) {
      return NextResponse.json({ error: `Section ${section} not found` }, { status: 400 });
    }

    const itemIndex = sectionArray.findIndex((item: any) => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found in section" }, { status: 404 });
    }

    const updates = body.item || body;
    delete updates.section;
    sectionArray[itemIndex] = { ...sectionArray[itemIndex], ...updates, id: itemId };
    writeJsonFile(FILE, data);

    return NextResponse.json({ success: true, item: sectionArray[itemIndex] });
  } catch (error: any) {
    console.error("[PUT /api/admin/couple] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "photos";
    const id = searchParams.get("id");
    const indexParam = searchParams.get("index");

    const rawData = readJsonFile<CoupleData>(FILE, DEFAULT_COUPLE_DATA);
    const data = ensureDataArrays(rawData);

    // Delete by index (useful for birthdays / specialDates if no id)
    if (indexParam !== null) {
      const index = parseInt(indexParam, 10);
      const arr = (data as any)[section];
      if (Array.isArray(arr) && index >= 0 && index < arr.length) {
        arr.splice(index, 1);
        writeJsonFile(FILE, data);
        return NextResponse.json({ success: true, index });
      }
      return NextResponse.json({ error: "Index out of range" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "Item ID or index is required" }, { status: 400 });
    }

    const arr = (data as any)[section];
    if (!Array.isArray(arr)) {
      return NextResponse.json({ error: `Section ${section} not found` }, { status: 400 });
    }

    const prevLength = arr.length;
    (data as any)[section] = arr.filter((item: any) => item.id !== id);

    if ((data as any)[section].length === prevLength) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    writeJsonFile(FILE, data);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("[DELETE /api/admin/couple] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete" },
      { status: 500 }
    );
  }
}

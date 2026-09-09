import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getCoupleData,
  updateCoupleInfo,
  createBirthday,
  updateBirthday,
  deleteBirthday,
  reorderBirthdays,
  createSpecialDate,
  updateSpecialDate,
  deleteSpecialDate,
  reorderSpecialDates,
  createMemory,
  updateMemory,
  deleteMemory,
  reorderMemories,
  createCouplePhoto,
  updateCouplePhoto,
  deleteCouplePhoto,
  reorderCouplePhotos,
  createBucketItem,
  updateBucketItem,
  deleteBucketItem,
  reorderBucketItems,
  createLoveLetter,
  updateLoveLetter,
  deleteLoveLetter,
  reorderLoveLetters,
  createFavorite,
  updateFavorite,
  deleteFavorite,
  reorderFavorites,
  type CoupleSection,
} from "@/lib/content/couple";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const data = await getCoupleData();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = await getCoupleData();

    // 1. General info update
    if (body.type === "info" || (body.person1 && !body.section && !body.image)) {
      await updateCoupleInfo({
        person1: body.person1 ?? data.person1,
        person2: body.person2 ?? data.person2,
        anniversary: body.anniversary ?? data.anniversary,
        footerQuote: body.footerQuote ?? data.footerQuote,
      });
      revalidateTag("couple");
      return NextResponse.json({ success: true, data: await getCoupleData() });
    }

    const section: CoupleSection | "info" = body.section || (body.image ? "photos" : "info");
    let item: unknown;

    switch (section) {
      case "photos":
        item = await createCouplePhoto({
          title: body.title || "Kỷ niệm đẹp",
          description: body.description || "",
          image: body.image || "",
          date: body.date || new Date().toISOString().split("T")[0],
          location: body.location || "",
          category: body.category || "Kỷ niệm",
          featured: Boolean(body.featured),
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      case "memories":
        item = await createMemory({
          date: body.date || new Date().toISOString().split("T")[0],
          title: body.title || "Cột mốc mới",
          description: body.description || "",
          emoji: body.emoji || "✨",
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      case "birthdays":
        item = await createBirthday({
          name: body.name || "Người ấy",
          date: body.date || "2000-01-01",
          emoji: body.emoji || "🎂",
          zodiac: body.zodiac || "✨",
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      case "specialDates":
        item = await createSpecialDate({
          name: body.name || "Ngày kỷ niệm",
          date: body.date || new Date().toISOString().split("T")[0],
          emoji: body.emoji || "🎉",
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      case "bucketList":
        item = await createBucketItem({
          text: body.text || "Dự định mới",
          emoji: body.emoji || "🌟",
          done: Boolean(body.done),
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      case "loveLetters":
        item = await createLoveLetter({
          from: body.from || data.person1 || "Anh",
          content: body.content || "",
          date: body.date || new Date().toISOString().split("T")[0],
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      case "favorites":
        item = await createFavorite({
          category: body.category || "Sở thích",
          title: body.title || "Điều yêu thích",
          description: body.description || "",
          emoji: body.emoji || "💝",
          published: body.published !== undefined ? Boolean(body.published) : true,
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    revalidateTag("couple");
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/couple] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await req.json();
    const data = await getCoupleData();

    // 1. Updating general couple info
    if (body.type === "info" || (body.person1 && !body.section && !body.id && !body.image)) {
      await updateCoupleInfo({
        person1: body.person1 ?? data.person1,
        person2: body.person2 ?? data.person2,
        anniversary: body.anniversary ?? data.anniversary,
        footerQuote: body.footerQuote ?? data.footerQuote,
      });
      revalidateTag("couple");
      return NextResponse.json({ success: true, data: await getCoupleData() });
    }

    // 2. Replacing whole section array (bulk update / reorder / toggle)
    if (body.section && Array.isArray(body.items)) {
      switch (body.section as CoupleSection) {
        case "birthdays":
          await reorderBirthdays(body.items);
          break;
        case "specialDates":
          await reorderSpecialDates(body.items);
          break;
        case "memories":
          await reorderMemories(body.items);
          break;
        case "photos":
          await reorderCouplePhotos(body.items);
          break;
        case "bucketList":
          await reorderBucketItems(body.items);
          break;
        case "loveLetters":
          await reorderLoveLetters(body.items);
          break;
        case "favorites":
          await reorderFavorites(body.items);
          break;
        default:
          return NextResponse.json({ error: `Section ${body.section} not found` }, { status: 400 });
      }
      revalidateTag("couple");
      return NextResponse.json({ success: true, section: body.section, items: body.items });
    }

    // 3. Updating a specific item in a section
    const section = (body.section || "photos") as CoupleSection;
    const itemId: string | undefined = body.id || body.item?.id;
    if (!itemId) {
      return NextResponse.json({ error: "Item id is required" }, { status: 400 });
    }
    const updates = { ...(body.item || body) };
    delete updates.section;
    delete updates.id;

    let updated: unknown = null;
    switch (section) {
      case "birthdays":
        updated = await updateBirthday(itemId, updates);
        break;
      case "specialDates":
        updated = await updateSpecialDate(itemId, updates);
        break;
      case "memories":
        updated = await updateMemory(itemId, updates);
        break;
      case "photos":
        updated = await updateCouplePhoto(itemId, updates);
        break;
      case "bucketList":
        updated = await updateBucketItem(itemId, updates);
        break;
      case "loveLetters":
        updated = await updateLoveLetter(itemId, updates);
        break;
      case "favorites":
        updated = await updateFavorite(itemId, updates);
        break;
      default:
        return NextResponse.json({ error: `Section ${section} not found` }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Item not found in section" }, { status: 404 });
    }

    revalidateTag("couple");
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("[PUT /api/admin/couple] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const section = (searchParams.get("section") || "photos") as CoupleSection;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    let deleted = false;
    switch (section) {
      case "birthdays":
        deleted = await deleteBirthday(id);
        break;
      case "specialDates":
        deleted = await deleteSpecialDate(id);
        break;
      case "memories":
        deleted = await deleteMemory(id);
        break;
      case "photos":
        deleted = await deleteCouplePhoto(id);
        break;
      case "bucketList":
        deleted = await deleteBucketItem(id);
        break;
      case "loveLetters":
        deleted = await deleteLoveLetter(id);
        break;
      case "favorites":
        deleted = await deleteFavorite(id);
        break;
      default:
        return NextResponse.json({ error: `Section ${section} not found` }, { status: 400 });
    }

    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    revalidateTag("couple");
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("[DELETE /api/admin/couple] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete" },
      { status: 500 }
    );
  }
}

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type {
  CoupleData,
  CoupleBirthday,
  CoupleSpecialDate,
  CoupleTimelineMemory,
  CouplePhotoMemory,
  CoupleBucketItem,
  CoupleLoveLetter,
  CoupleFavorite,
} from "@/lib/types";
import type {
  CmsCoupleBirthday,
  CmsCoupleSpecialDate,
  CmsCoupleMemory,
  CmsCouplePhoto,
  CmsCoupleBucketItem,
  CmsCoupleLoveLetter,
  CmsCoupleFavorite,
} from "@/generated/prisma";

const SINGLETON_ID = "singleton";

async function ensureCoupleInfo() {
  return db.cmsCoupleInfo.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: {
      id: SINGLETON_ID,
      person1: "Cục Đá",
      person2: "Bé Mèo",
      anniversary: "2025-05-30 21:00:00",
      footerQuote: "\"Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.\"",
    },
  });
}

export type CoupleSection =
  | "photos"
  | "memories"
  | "birthdays"
  | "specialDates"
  | "bucketList"
  | "loveLetters"
  | "favorites";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const toBirthday = (r: CmsCoupleBirthday): CoupleBirthday => ({
  id: r.id,
  name: r.name,
  date: r.date,
  emoji: r.emoji,
  zodiac: r.zodiac,
  published: r.published,
});

const toSpecialDate = (r: CmsCoupleSpecialDate): CoupleSpecialDate => ({
  id: r.id,
  name: r.name,
  date: r.date,
  emoji: r.emoji,
  published: r.published,
});

const toMemory = (r: CmsCoupleMemory): CoupleTimelineMemory => ({
  id: r.id,
  date: r.date,
  title: r.title,
  description: r.description,
  emoji: r.emoji ?? undefined,
  image: r.image ?? undefined,
  published: r.published,
});

const toPhoto = (r: CmsCouplePhoto): CouplePhotoMemory => ({
  id: r.id,
  title: r.title,
  description: r.description ?? undefined,
  image: r.image,
  date: r.date,
  location: r.location ?? undefined,
  category: r.category ?? undefined,
  featured: r.featured,
  published: r.published,
  order: r.order,
});

const toBucketItem = (r: CmsCoupleBucketItem): CoupleBucketItem => ({
  id: r.id,
  text: r.text,
  emoji: r.emoji,
  done: r.done,
  published: r.published,
});

const toLoveLetter = (r: CmsCoupleLoveLetter): CoupleLoveLetter => ({
  id: r.id,
  from: r.from,
  content: r.content,
  date: r.date,
  published: r.published,
});

const toFavorite = (r: CmsCoupleFavorite): CoupleFavorite => ({
  id: r.id,
  category: r.category,
  title: r.title,
  description: r.description,
  emoji: r.emoji,
  published: r.published,
});

// ---------------------------------------------------------------------------
// Aggregate read
// ---------------------------------------------------------------------------

export async function getCoupleData(): Promise<CoupleData> {
  const info = await ensureCoupleInfo();
  const [birthdays, specialDates, memories, photos, bucketList, loveLetters, favorites] = await Promise.all([
    db.cmsCoupleBirthday.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
    db.cmsCoupleSpecialDate.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
    db.cmsCoupleMemory.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
    db.cmsCouplePhoto.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
    db.cmsCoupleBucketItem.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
    db.cmsCoupleLoveLetter.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
    db.cmsCoupleFavorite.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { order: "asc" } }),
  ]);

  return {
    person1: info.person1,
    person2: info.person2,
    anniversary: info.anniversary,
    footerQuote: info.footerQuote,
    birthdays: birthdays.map(toBirthday),
    specialDates: specialDates.map(toSpecialDate),
    memories: memories.map(toMemory),
    photos: photos.map(toPhoto),
    bucketList: bucketList.map(toBucketItem),
    loveLetters: loveLetters.map(toLoveLetter),
    favorites: favorites.map(toFavorite),
  };
}

export const getPublishedCoupleData = unstable_cache(
  async (): Promise<CoupleData> => {
    const data = await getCoupleData();
    return {
      ...data,
      photos: data.photos.filter((p) => p.published !== false),
      memories: data.memories.filter((m) => m.published !== false),
      birthdays: data.birthdays.filter((b) => b.published !== false),
      specialDates: data.specialDates.filter((d) => d.published !== false),
      bucketList: data.bucketList.filter((b) => b.published !== false),
      loveLetters: data.loveLetters.filter((l) => l.published !== false),
      favorites: data.favorites.filter((f) => f.published !== false),
    };
  },
  ["published-couple-data"],
  { tags: ["couple"] }
);

export async function updateCoupleInfo(
  data: Partial<Pick<CoupleData, "person1" | "person2" | "anniversary" | "footerQuote">>
) {
  await ensureCoupleInfo();
  await db.cmsCoupleInfo.update({ where: { id: SINGLETON_ID }, data });
}

// ---------------------------------------------------------------------------
// Generic per-section helpers
// ---------------------------------------------------------------------------

/** "Append" sections keep insertion order (order = current count). */
async function nextAppendOrder(count: () => Promise<number>): Promise<number> {
  return count();
}

/** "Prepend" sections (photos/memories/loveLetters mirrored the old .unshift()) show newest first. */
async function nextPrependOrder(minOrder: () => Promise<number | null>): Promise<number> {
  const min = await minOrder();
  return (min ?? 0) - 1;
}

// --- Birthdays (append) ---
export async function createBirthday(input: Omit<CoupleBirthday, "id">): Promise<CoupleBirthday> {
  await ensureCoupleInfo();
  const order = await nextAppendOrder(() => db.cmsCoupleBirthday.count({ where: { coupleInfoId: SINGLETON_ID } }));
  const row = await db.cmsCoupleBirthday.create({
    data: { id: generateId("couple-bday"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toBirthday(row);
}
export async function updateBirthday(id: string, updates: Partial<CoupleBirthday>): Promise<CoupleBirthday | null> {
  try {
    const row = await db.cmsCoupleBirthday.update({ where: { id }, data: updates });
    return toBirthday(row);
  } catch {
    return null;
  }
}
export async function deleteBirthday(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleBirthday.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderBirthdays(items: CoupleBirthday[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCoupleBirthday.update({ where: { id: item.id! }, data: { order: index } }))
  );
}

// --- Special dates (append) ---
export async function createSpecialDate(input: Omit<CoupleSpecialDate, "id">): Promise<CoupleSpecialDate> {
  await ensureCoupleInfo();
  const order = await nextAppendOrder(() => db.cmsCoupleSpecialDate.count({ where: { coupleInfoId: SINGLETON_ID } }));
  const row = await db.cmsCoupleSpecialDate.create({
    data: { id: generateId("couple-date"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toSpecialDate(row);
}
export async function updateSpecialDate(id: string, updates: Partial<CoupleSpecialDate>): Promise<CoupleSpecialDate | null> {
  try {
    const row = await db.cmsCoupleSpecialDate.update({ where: { id }, data: updates });
    return toSpecialDate(row);
  } catch {
    return null;
  }
}
export async function deleteSpecialDate(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleSpecialDate.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderSpecialDates(items: CoupleSpecialDate[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCoupleSpecialDate.update({ where: { id: item.id! }, data: { order: index } }))
  );
}

// --- Memories (prepend / newest-first) ---
export async function createMemory(input: Omit<CoupleTimelineMemory, "id">): Promise<CoupleTimelineMemory> {
  await ensureCoupleInfo();
  const order = await nextPrependOrder(async () => {
    const agg = await db.cmsCoupleMemory.aggregate({ where: { coupleInfoId: SINGLETON_ID }, _min: { order: true } });
    return agg._min.order;
  });
  const row = await db.cmsCoupleMemory.create({
    data: { id: generateId("mem"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toMemory(row);
}
export async function updateMemory(id: string, updates: Partial<CoupleTimelineMemory>): Promise<CoupleTimelineMemory | null> {
  try {
    const row = await db.cmsCoupleMemory.update({ where: { id }, data: updates });
    return toMemory(row);
  } catch {
    return null;
  }
}
export async function deleteMemory(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleMemory.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderMemories(items: CoupleTimelineMemory[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCoupleMemory.update({ where: { id: item.id! }, data: { order: index } }))
  );
}

// --- Photos (prepend / newest-first) ---
export async function createCouplePhoto(input: Omit<CouplePhotoMemory, "id">): Promise<CouplePhotoMemory> {
  await ensureCoupleInfo();
  const order = await nextPrependOrder(async () => {
    const agg = await db.cmsCouplePhoto.aggregate({ where: { coupleInfoId: SINGLETON_ID }, _min: { order: true } });
    return agg._min.order;
  });
  const row = await db.cmsCouplePhoto.create({
    data: { id: generateId("couple-photo"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toPhoto(row);
}
export async function updateCouplePhoto(id: string, updates: Partial<CouplePhotoMemory>): Promise<CouplePhotoMemory | null> {
  try {
    const row = await db.cmsCouplePhoto.update({ where: { id }, data: updates });
    return toPhoto(row);
  } catch {
    return null;
  }
}
export async function deleteCouplePhoto(id: string): Promise<boolean> {
  try {
    await db.cmsCouplePhoto.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderCouplePhotos(items: CouplePhotoMemory[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCouplePhoto.update({ where: { id: item.id }, data: { order: index } }))
  );
}

// --- Bucket list (append) ---
export async function createBucketItem(input: Omit<CoupleBucketItem, "id">): Promise<CoupleBucketItem> {
  await ensureCoupleInfo();
  const order = await nextAppendOrder(() => db.cmsCoupleBucketItem.count({ where: { coupleInfoId: SINGLETON_ID } }));
  const row = await db.cmsCoupleBucketItem.create({
    data: { id: generateId("bucket"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toBucketItem(row);
}
export async function updateBucketItem(id: string, updates: Partial<CoupleBucketItem>): Promise<CoupleBucketItem | null> {
  try {
    const row = await db.cmsCoupleBucketItem.update({ where: { id }, data: updates });
    return toBucketItem(row);
  } catch {
    return null;
  }
}
export async function deleteBucketItem(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleBucketItem.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderBucketItems(items: CoupleBucketItem[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCoupleBucketItem.update({ where: { id: item.id! }, data: { order: index } }))
  );
}

// --- Love letters (prepend / newest-first) ---
export async function createLoveLetter(input: Omit<CoupleLoveLetter, "id">): Promise<CoupleLoveLetter> {
  await ensureCoupleInfo();
  const order = await nextPrependOrder(async () => {
    const agg = await db.cmsCoupleLoveLetter.aggregate({ where: { coupleInfoId: SINGLETON_ID }, _min: { order: true } });
    return agg._min.order;
  });
  const row = await db.cmsCoupleLoveLetter.create({
    data: { id: generateId("letter"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toLoveLetter(row);
}
export async function updateLoveLetter(id: string, updates: Partial<CoupleLoveLetter>): Promise<CoupleLoveLetter | null> {
  try {
    const row = await db.cmsCoupleLoveLetter.update({ where: { id }, data: updates });
    return toLoveLetter(row);
  } catch {
    return null;
  }
}
export async function deleteLoveLetter(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleLoveLetter.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderLoveLetters(items: CoupleLoveLetter[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCoupleLoveLetter.update({ where: { id: item.id! }, data: { order: index } }))
  );
}

// --- Favorites (append) ---
export async function createFavorite(input: Omit<CoupleFavorite, "id">): Promise<CoupleFavorite> {
  await ensureCoupleInfo();
  const order = await nextAppendOrder(() => db.cmsCoupleFavorite.count({ where: { coupleInfoId: SINGLETON_ID } }));
  const row = await db.cmsCoupleFavorite.create({
    data: { id: generateId("fav"), coupleInfoId: SINGLETON_ID, order, published: true, ...input },
  });
  return toFavorite(row);
}
export async function updateFavorite(id: string, updates: Partial<CoupleFavorite>): Promise<CoupleFavorite | null> {
  try {
    const row = await db.cmsCoupleFavorite.update({ where: { id }, data: updates });
    return toFavorite(row);
  } catch {
    return null;
  }
}
export async function deleteFavorite(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleFavorite.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
export async function reorderFavorites(items: CoupleFavorite[]): Promise<void> {
  await db.$transaction(
    items.map((item, index) => db.cmsCoupleFavorite.update({ where: { id: item.id! }, data: { order: index } }))
  );
}

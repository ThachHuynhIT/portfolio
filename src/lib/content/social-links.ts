import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type { SocialLink } from "@/lib/types";
import type { CmsSocialLink } from "@/generated/prisma";

function toSocialLink(row: CmsSocialLink): SocialLink {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    icon: row.icon,
    published: row.published,
  };
}

export async function listSocialLinks(): Promise<SocialLink[]> {
  const rows = await db.cmsSocialLink.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toSocialLink);
}

export async function createSocialLink(input: Omit<SocialLink, "id">): Promise<SocialLink> {
  const row = await db.cmsSocialLink.create({
    data: {
      id: generateId("social"),
      name: input.name,
      url: input.url,
      icon: input.icon,
      published: input.published !== false,
    },
  });
  return toSocialLink(row);
}

export async function updateSocialLink(id: string, updates: Partial<SocialLink>): Promise<SocialLink | null> {
  try {
    const row = await db.cmsSocialLink.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.url !== undefined && { url: updates.url }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(updates.published !== undefined && { published: updates.published }),
      },
    });
    return toSocialLink(row);
  } catch {
    return null;
  }
}

export async function deleteSocialLink(id: string): Promise<boolean> {
  try {
    await db.cmsSocialLink.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export const getPublishedSocialLinks = unstable_cache(
  async (): Promise<SocialLink[]> => {
    const rows = await db.cmsSocialLink.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toSocialLink);
  },
  ["published-social-links"],
  { tags: ["social-links"] }
);

import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type { Skill } from "@/lib/types";
import type { CmsSkill } from "@/generated/prisma";

function toSkill(row: CmsSkill): Skill {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    category: row.category as Skill["category"],
    level: row.level,
    published: row.published,
  };
}

export async function listSkills(): Promise<Skill[]> {
  const rows = await db.cmsSkill.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toSkill);
}

export async function createSkill(input: Omit<Skill, "id">): Promise<Skill> {
  const row = await db.cmsSkill.create({
    data: {
      id: generateId("skill"),
      name: input.name,
      icon: input.icon,
      category: input.category,
      level: input.level,
      published: input.published !== false,
    },
  });
  return toSkill(row);
}

export async function updateSkill(id: string, updates: Partial<Skill>): Promise<Skill | null> {
  try {
    const row = await db.cmsSkill.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.level !== undefined && { level: updates.level }),
        ...(updates.published !== undefined && { published: updates.published }),
      },
    });
    return toSkill(row);
  } catch {
    return null;
  }
}

export async function deleteSkill(id: string): Promise<boolean> {
  try {
    await db.cmsSkill.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/** Published skills for the public site, cached until a "skills" admin mutation revalidates it. */
export const getPublishedSkills = unstable_cache(
  async (): Promise<Skill[]> => {
    const rows = await db.cmsSkill.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toSkill);
  },
  ["published-skills"],
  { tags: ["skills"] }
);

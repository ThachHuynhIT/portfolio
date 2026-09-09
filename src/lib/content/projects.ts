import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type { Project } from "@/lib/types";
import type { CmsProject } from "@/generated/prisma";

function toProject(row: CmsProject): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    longDescription: row.longDescription ?? undefined,
    title_vi: row.titleVi ?? undefined,
    description_vi: row.descriptionVi ?? undefined,
    longDescription_vi: row.longDescriptionVi ?? undefined,
    image: row.image,
    tags: row.tags,
    liveUrl: row.liveUrl ?? undefined,
    githubUrl: row.githubUrl ?? undefined,
    featured: row.featured,
    published: row.published,
  };
}

function toData(input: Partial<Project>) {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.longDescription !== undefined && { longDescription: input.longDescription }),
    ...(input.title_vi !== undefined && { titleVi: input.title_vi }),
    ...(input.description_vi !== undefined && { descriptionVi: input.description_vi }),
    ...(input.longDescription_vi !== undefined && { longDescriptionVi: input.longDescription_vi }),
    ...(input.image !== undefined && { image: input.image }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.liveUrl !== undefined && { liveUrl: input.liveUrl }),
    ...(input.githubUrl !== undefined && { githubUrl: input.githubUrl }),
    ...(input.featured !== undefined && { featured: input.featured }),
    ...(input.published !== undefined && { published: input.published }),
  };
}

export async function listProjects(): Promise<Project[]> {
  const rows = await db.cmsProject.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toProject);
}

export async function createProject(input: Omit<Project, "id">): Promise<Project> {
  const row = await db.cmsProject.create({
    data: {
      id: generateId("proj"),
      title: input.title,
      description: input.description,
      longDescription: input.longDescription,
      titleVi: input.title_vi,
      descriptionVi: input.description_vi,
      longDescriptionVi: input.longDescription_vi,
      image: input.image,
      tags: input.tags,
      liveUrl: input.liveUrl,
      githubUrl: input.githubUrl,
      featured: input.featured ?? false,
      published: input.published !== false,
    },
  });
  return toProject(row);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    const row = await db.cmsProject.update({ where: { id }, data: toData(updates) });
    return toProject(row);
  } catch {
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await db.cmsProject.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export const getPublishedProjects = unstable_cache(
  async (): Promise<Project[]> => {
    const rows = await db.cmsProject.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
  },
  ["published-projects"],
  { tags: ["projects"] }
);

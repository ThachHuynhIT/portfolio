import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type { NavLink, NavSubLink } from "@/lib/types";
import type { CmsNavLink } from "@/generated/prisma";

type NavLinkWithChildren = CmsNavLink & { children: CmsNavLink[] };

function toSubLink(row: CmsNavLink): NavSubLink {
  return {
    id: row.id,
    label: row.label,
    label_vi: row.labelVi ?? undefined,
    href: row.href,
    order: row.order,
    published: row.published,
  };
}

function toNavLink(row: NavLinkWithChildren): NavLink {
  return {
    id: row.id,
    label: row.label,
    label_vi: row.labelVi ?? undefined,
    href: row.href,
    order: row.order,
    published: row.published,
    children: row.children.length
      ? [...row.children].sort((a, b) => a.order - b.order).map(toSubLink)
      : undefined,
  };
}

const topLevelArgs = {
  where: { parentId: null },
  include: { children: { orderBy: { order: "asc" as const } } },
  orderBy: { order: "asc" as const },
};

export async function listNavLinks(): Promise<NavLink[]> {
  const rows = await db.cmsNavLink.findMany(topLevelArgs);
  return rows.map(toNavLink);
}

export async function createNavLink(input: Omit<NavLink, "id">): Promise<NavLink> {
  const row = await db.cmsNavLink.create({
    data: {
      id: generateId("nav"),
      label: input.label,
      labelVi: input.label_vi,
      href: input.href,
      order: input.order ?? 0,
      published: input.published !== false,
      children: input.children?.length
        ? {
            create: input.children.map((child) => ({
              id: child.id || generateId("sub"),
              label: child.label,
              labelVi: child.label_vi,
              href: child.href,
              order: child.order ?? 0,
              published: child.published !== false,
            })),
          }
        : undefined,
    },
    include: { children: true },
  });
  return toNavLink(row);
}

export async function updateNavLink(id: string, updates: Partial<NavLink>): Promise<NavLink | null> {
  try {
    const row = await db.$transaction(async (tx) => {
      if (updates.children !== undefined) {
        await tx.cmsNavLink.deleteMany({ where: { parentId: id } });
      }
      return tx.cmsNavLink.update({
        where: { id },
        data: {
          ...(updates.label !== undefined && { label: updates.label }),
          ...(updates.label_vi !== undefined && { labelVi: updates.label_vi }),
          ...(updates.href !== undefined && { href: updates.href }),
          ...(updates.order !== undefined && { order: updates.order }),
          ...(updates.published !== undefined && { published: updates.published }),
          ...(updates.children !== undefined && {
            children: {
              create: updates.children.map((child) => ({
                id: child.id || generateId("sub"),
                label: child.label,
                labelVi: child.label_vi,
                href: child.href,
                order: child.order ?? 0,
                published: child.published !== false,
              })),
            },
          }),
        },
        include: { children: true },
      });
    });
    return toNavLink(row);
  } catch {
    return null;
  }
}

/** Bulk reorder: sets each top-level link's order to its index in the given array (children untouched). */
export async function reorderNavLinks(items: NavLink[]): Promise<NavLink[]> {
  await db.$transaction(
    items.map((item, index) =>
      db.cmsNavLink.update({ where: { id: item.id }, data: { order: index } })
    )
  );
  return listNavLinks();
}

export async function deleteNavLink(id: string): Promise<boolean> {
  try {
    // onDelete: Cascade on the self-relation removes any children automatically.
    await db.cmsNavLink.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export const getPublishedNavLinks = unstable_cache(
  async (): Promise<NavLink[]> => {
    const rows = await db.cmsNavLink.findMany({
      where: { parentId: null, published: true },
      include: { children: { where: { published: true }, orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    return rows.map(toNavLink);
  },
  ["published-nav-links"],
  { tags: ["nav-links"] }
);

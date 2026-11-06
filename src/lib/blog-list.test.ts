import { describe, expect, it } from "vitest";
import {
  toBlogPostViewMeta,
  blogListSelect,
  comparePostDates,
  getCategories,
  getTags,
  toBlogListItem,
  type BlogListRow,
} from "./blog-list";
import type { BlogPostListItem } from "./types";

function makeRow(overrides: Partial<BlogListRow> = {}): BlogListRow {
  return {
    slug: "hello-world",
    title: "Hello world",
    titleVi: "Xin chao",
    excerpt: "An excerpt",
    excerptVi: "Mot trich doan",
    date: "2026-01-02",
    category: "Engineering",
    tags: ["react", "next"],
    readTime: "5 min read",
    ...overrides,
  };
}

describe("toBlogListItem", () => {
  it("maps_list_without_either_body", () => {
    // Fixture deliberately carries both bodies so a `{...row}` spread would leak them.
    const row = {
      ...makeRow(),
      content: "# EN body",
      contentVi: "# VI body",
    } as BlogListRow;
    const item = toBlogListItem(row);

    expect(item).toMatchObject({ slug: row.slug, title: row.title });
    expect(Object.hasOwn(item, "content")).toBe(false);
    expect(Object.hasOwn(item, "content_vi")).toBe(false);
    expect(Object.hasOwn(item, "contentVi")).toBe(false);
    expect(item).not.toHaveProperty("content");
    expect(item).not.toHaveProperty("content_vi");
  });

  it("maps_nullable_vi_to_undefined", () => {
    const item = toBlogListItem(makeRow({ titleVi: null, excerptVi: null }));
    expect(item.title_vi).toBeUndefined();
    expect(item.excerpt_vi).toBeUndefined();

    const withVi = toBlogListItem(makeRow());
    expect(withVi.title_vi).toBe("Xin chao");
    expect(withVi.excerpt_vi).toBe("Mot trich doan");
  });

  it("list select whitelist never selects a body", () => {
    expect(blogListSelect).not.toHaveProperty("content");
    expect(blogListSelect).not.toHaveProperty("contentVi");
    expect(Object.keys(blogListSelect).sort()).toEqual(
      ["category", "date", "excerpt", "excerptVi", "readTime", "slug", "tags", "title", "titleVi"].sort()
    );
  });
});

describe("comparePostDates", () => {
  it("sorts_summaries_newest_first", () => {
    const items: BlogPostListItem[] = [
      toBlogListItem(makeRow({ slug: "old", date: "2024-03-01" })),
      toBlogListItem(makeRow({ slug: "new", date: "2026-05-10" })),
      toBlogListItem(makeRow({ slug: "mid", date: "2025-07-15" })),
    ];
    expect(items.sort(comparePostDates).map((p) => p.slug)).toEqual(["new", "mid", "old"]);
  });

  it("does not crash on an invalid date and keeps valid dates ordered", () => {
    const items: BlogPostListItem[] = [
      toBlogListItem(makeRow({ slug: "bad", date: "not a date" })),
      toBlogListItem(makeRow({ slug: "old", date: "2024-03-01" })),
      toBlogListItem(makeRow({ slug: "new", date: "2026-05-10" })),
    ];
    const sorted = items.sort(comparePostDates).map((p) => p.slug);
    expect(sorted).toHaveLength(3);
    expect(sorted.indexOf("new")).toBeLessThan(sorted.indexOf("old"));
    expect(sorted.at(-1)).toBe("bad");
  });
});

describe("categories and tags", () => {
  it("categories_use_metadata_only", () => {
    const items = [
      toBlogListItem(makeRow({ slug: "a", category: "Engineering", tags: ["react"] })),
      toBlogListItem(makeRow({ slug: "b", category: "Life", tags: ["travel", "react"] })),
      toBlogListItem(makeRow({ slug: "c", category: "Engineering", tags: [] })),
    ];
    for (const item of items) expect(item).not.toHaveProperty("content");
    expect(getCategories(items)).toEqual(["Engineering", "Life"]);
    expect(getTags(items)).toEqual(["react", "travel"]);
  });
});

describe("toBlogPostViewMeta", () => {
  it("drops_both_bodies_and_reports_vi_presence", () => {
    const post = {
      slug: "a", title: "A", excerpt: "e", date: "2026-01-01", category: "c", tags: ["t"],
      readTime: "5 min", content: "# EN", content_vi: "# VI", title_vi: "A vi",
    };
    const meta = toBlogPostViewMeta(post);
    expect(meta).not.toHaveProperty("content");
    expect(meta).not.toHaveProperty("content_vi");
    expect(meta).toMatchObject({ slug: "a", title_vi: "A vi", hasVi: true });
    expect(toBlogPostViewMeta({ ...post, content_vi: undefined }).hasVi).toBe(false);
  });
});

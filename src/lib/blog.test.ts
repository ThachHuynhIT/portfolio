import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  type AsyncFn = (...args: never[]) => Promise<unknown>;
  const cacheCalls: { keyParts: string[]; tags: string[] }[] = [];
  const store = new Map<string, unknown>();
  // Fake unstable_cache: memoises on keyParts + serialised args, like Next does.
  const unstable_cache = <T extends AsyncFn>(fn: T, keyParts: string[] = [], options: { tags?: string[] } = {}) => {
    cacheCalls.push({ keyParts, tags: options.tags ?? [] });
    return (async (...args: Parameters<T>) => {
      const key = JSON.stringify([keyParts, args]);
      if (!store.has(key)) store.set(key, await fn(...args));
      return store.get(key);
    }) as T;
  };
  return {
    cacheCalls,
    store,
    unstable_cache,
    revalidateTag: vi.fn(),
    requireAdminSession: vi.fn(async () => null),
    cmsBlogPost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("next/cache", () => ({
  unstable_cache: mocks.unstable_cache,
  revalidateTag: mocks.revalidateTag,
}));
vi.mock("@/lib/db", () => ({ db: { cmsBlogPost: mocks.cmsBlogPost } }));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: mocks.requireAdminSession }));

import { createPost, getPostBySlug, getPostSummaries, listPostSummaries } from "./blog";
import { blogListSelect } from "./blog-list";
import { MdxPolicyError } from "./mdx-policy";
import { GET as adminListGET, POST as adminCreatePOST } from "@/app/api/admin/blog/route";
import { DELETE as adminDELETE, GET as adminEditorGET, PUT as adminPUT } from "@/app/api/admin/blog/[slug]/route";

function fullRow(slug: string, overrides: Record<string, unknown> = {}) {
  return {
    id: slug,
    slug,
    title: `Title ${slug}`,
    titleVi: null,
    excerpt: "Excerpt",
    excerptVi: null,
    content: `# Body of ${slug}`,
    contentVi: `# VI body of ${slug}`,
    date: "2026-01-01",
    category: "Engineering",
    tags: ["a"],
    readTime: "5 min read",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

function listRow(slug: string, date: string) {
  return {
    slug,
    title: `Title ${slug}`,
    titleVi: null,
    excerpt: "Excerpt",
    excerptVi: null,
    date,
    category: "Engineering",
    tags: [],
    readTime: "5 min read",
  };
}

function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api/admin/blog", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === null ? undefined : JSON.stringify(body),
  });
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  mocks.store.clear();
  mocks.revalidateTag.mockClear();
  for (const fn of Object.values(mocks.cmsBlogPost)) fn.mockReset();
});

describe("blog reads", () => {
  it("caches list and by-slug reads under the blog tag with distinct keys", () => {
    const blogCaches = mocks.cacheCalls.filter((c) => c.tags.includes("blog"));
    expect(blogCaches.length).toBeGreaterThanOrEqual(2);
    const keys = blogCaches.map((c) => JSON.stringify(c.keyParts));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("list query selects no body and returns summaries newest first", async () => {
    mocks.cmsBlogPost.findMany.mockResolvedValue([listRow("old", "2024-01-01"), listRow("new", "2026-01-01")]);
    const items = await getPostSummaries();

    expect(mocks.cmsBlogPost.findMany).toHaveBeenCalledWith({ select: blogListSelect });
    const select = mocks.cmsBlogPost.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("content");
    expect(select).not.toHaveProperty("contentVi");
    expect(items.map((p) => p.slug)).toEqual(["new", "old"]);
    for (const item of items) {
      expect(item).not.toHaveProperty("content");
      expect(item).not.toHaveProperty("content_vi");
    }
  });

  it("different slugs do not share a cached value", async () => {
    mocks.cmsBlogPost.findUnique.mockImplementation(async ({ where }: { where: { slug: string } }) =>
      fullRow(where.slug)
    );
    const a = await getPostBySlug("a");
    const b = await getPostBySlug("b");
    const aAgain = await getPostBySlug("a");

    expect(a?.slug).toBe("a");
    expect(b?.slug).toBe("b");
    expect(b?.content).toBe("# Body of b");
    expect(aAgain).toEqual(a);
    expect(mocks.cmsBlogPost.findUnique).toHaveBeenCalledTimes(2);
  });

  it("admin list is uncached and body-free", async () => {
    mocks.cmsBlogPost.findMany.mockResolvedValue([listRow("x", "2026-01-01")]);
    await listPostSummaries();
    await listPostSummaries();
    expect(mocks.cmsBlogPost.findMany).toHaveBeenCalledTimes(2);
    expect(mocks.cmsBlogPost.findMany).toHaveBeenCalledWith({ select: blogListSelect });
  });
});

describe("blog writes", () => {
  it("createPost rejects disallowed MDX before touching the database", async () => {
    await expect(
      createPost({ slug: "bad", title: "Bad", content: "Hi", content_vi: "<script>alert(1)</script>" })
    ).rejects.toBeInstanceOf(MdxPolicyError);
    expect(mocks.cmsBlogPost.findUnique).not.toHaveBeenCalled();
    expect(mocks.cmsBlogPost.create).not.toHaveBeenCalled();
  });
});

describe("admin blog routes", () => {
  it("POST invalidates the blog tag only after a successful write", async () => {
    mocks.cmsBlogPost.findUnique.mockResolvedValue(null);
    mocks.cmsBlogPost.create.mockRejectedValue(new Error("db down"));
    const failed = await adminCreatePOST(jsonRequest({ slug: "new-post", title: "New" }));
    expect(failed.status).toBe(500);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();

    mocks.cmsBlogPost.create.mockResolvedValue(fullRow("new-post", { title: "New" }));
    const ok = await adminCreatePOST(jsonRequest({ slug: "New Post!", title: "New", content: "# Hi" }));
    expect(ok.status).toBe(201);
    expect(await ok.json()).toMatchObject({ slug: "new-post", title: "New" });
    expect(mocks.revalidateTag).toHaveBeenCalledTimes(1);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("blog");
  });

  it("POST returns 409 on an existing slug without invalidating", async () => {
    mocks.cmsBlogPost.findUnique.mockResolvedValue(fullRow("dup"));
    const res = await adminCreatePOST(jsonRequest({ slug: "dup", title: "Dup" }));
    expect(res.status).toBe(409);
    expect(mocks.cmsBlogPost.create).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("PUT maps an MDX policy violation to 400 without writing or invalidating", async () => {
    mocks.cmsBlogPost.findUnique.mockResolvedValue(fullRow("p"));
    const res = await adminPUT(jsonRequest({ title: "T", content: "{process.exit(1)}" }, "PUT"), params("p"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/line 1/);
    expect(mocks.cmsBlogPost.update).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("PUT failure does not invalidate; success does", async () => {
    mocks.cmsBlogPost.findUnique.mockResolvedValue(fullRow("p"));
    mocks.cmsBlogPost.update.mockRejectedValue(new Error("db down"));
    const failed = await adminPUT(jsonRequest({ title: "T", content: "ok" }, "PUT"), params("p"));
    expect(failed.status).toBe(500);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();

    mocks.cmsBlogPost.update.mockResolvedValue(fullRow("p", { title: "T" }));
    const ok = await adminPUT(jsonRequest({ title: "T", content: "ok" }, "PUT"), params("p"));
    expect(ok.status).toBe(200);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("blog");
  });

  it("DELETE of a missing post is 404 and failures do not invalidate", async () => {
    mocks.cmsBlogPost.findUnique.mockResolvedValue(null);
    const missing = await adminDELETE(jsonRequest(null, "DELETE"), params("gone"));
    expect(missing.status).toBe(404);

    mocks.cmsBlogPost.findUnique.mockResolvedValue(fullRow("p"));
    mocks.cmsBlogPost.delete.mockRejectedValue(new Error("db down"));
    const failed = await adminDELETE(jsonRequest(null, "DELETE"), params("p"));
    expect(failed.status).toBe(500);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();

    mocks.cmsBlogPost.delete.mockResolvedValue(fullRow("p"));
    const ok = await adminDELETE(jsonRequest(null, "DELETE"), params("p"));
    expect(ok.status).toBe(200);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("blog");
  });

  it("admin list drops both bodies; editor GET returns full bodies uncached", async () => {
    mocks.cmsBlogPost.findMany.mockResolvedValue([listRow("x", "2026-01-01")]);
    const list = (await (await adminListGET()).json()) as Record<string, unknown>[];
    expect(list[0]).not.toHaveProperty("content");
    expect(list[0]).not.toHaveProperty("content_vi");

    mocks.cmsBlogPost.findUnique.mockResolvedValue(fullRow("x"));
    await adminEditorGET(jsonRequest(null, "GET"), params("x"));
    const res = await adminEditorGET(jsonRequest(null, "GET"), params("x"));
    const post = (await res.json()) as Record<string, unknown>;
    expect(post.content).toBe("# Body of x");
    expect(post.content_vi).toBe("# VI body of x");
    expect(mocks.cmsBlogPost.findUnique).toHaveBeenCalledTimes(2);
  });
});

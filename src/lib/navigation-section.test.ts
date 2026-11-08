import { describe, expect, it } from "vitest";
import { getSectionNavTarget, getActiveSection, isSectionNavActive, filterBlogNavLinks } from "./navigation-section";

describe("filterBlogNavLinks", () => {
  const links = [
    { id: "home", label: "Home", href: "/" },
    { id: "blog", label: "Writing", href: "/blog" },
    { id: "hobby", label: "Hobby", href: "#", children: [
      { id: "photos", label: "Photos", href: "/photography" },
      { id: "writing", label: "Writing", href: "#blog" },
    ] },
    { id: "empty", label: "Empty", href: "#", children: [{ id: "b", label: "B", href: "/blog" }] },
    { id: "usable", label: "Usable", href: "/projects", children: [{ id: "b", label: "B", href: "/blog" }] },
  ];
  it("empty_blog_hides_only_blog_links", () => {
    const before = structuredClone(links);
    const result = filterBlogNavLinks(links, false);
    expect(result.map((link) => link.id)).toEqual(["home", "hobby", "usable"]);
    expect(result[1].children?.map((link) => link.id)).toEqual(["photos"]);
    expect(links).toEqual(before);
  });
  it("nonempty_blog_preserves_links", () => expect(filterBlogNavLinks(links, true)).toEqual(links));
});

describe("portfolio section navigation", () => {
  it("photos_and_blog_map_to_hobby", () => {
    expect(getSectionNavTarget("photos")).toBe("hobby");
    expect(getSectionNavTarget("blog")).toBe("hobby");
  });
  it("projects_stays_projects", () => {
    expect(getSectionNavTarget("projects")).toBe("projects");
  });
  it("empty_hidden_sections_skipped", () => {
    expect(getActiveSection([
      { id: "about", top: 300, height: 500 },
      { id: "photos", top: 800, height: 0 },
      { id: "blog", top: 850, height: 200, hidden: true },
    ], 900)).toBe("about");
    expect(getActiveSection([], 0)).toBe("home");
  });
  it("hobby_parent_active_from_child_href", () => {
    const hobby = { href: "#", children: [{ href: "/photography" }, { href: "/blog" }] };
    expect(isSectionNavActive(hobby, "photos")).toBe(true);
    expect(isSectionNavActive(hobby, "blog")).toBe(true);
    expect(isSectionNavActive(hobby, "projects")).toBe(false);
    expect(isSectionNavActive({ href: "#projects" }, "photos")).toBe(false);
    expect(isSectionNavActive({ href: "#home" }, "home")).toBe(true);
    expect(isSectionNavActive({ href: "/photography" }, "blog")).toBe(false);
    expect(isSectionNavActive({ href: "/blog" }, "photos")).toBe(false);
  });
});

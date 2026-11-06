import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_ICON_NAMES,
  ICON_ALIASES,
  MUSIC_ICON_NAMES,
  PUBLIC_ICON_NAMES,
  SOCIAL_BRAND_ICON_NAMES,
  TECH_BRAND_ICON_NAMES,
  getIconRegistry,
  isKnownIconName,
  isPublicIconName,
  resolveIconName,
} from "@/lib/icon-names";

/** Every stroke (lucide) name the original single-file registry accepted. */
const ORIGINAL_STROKE_NAMES = [
  "dashboard", "heart", "settings", "skills", "projects", "music", "blog", "links", "nav", "globe",
  "logout", "chevronLeft", "chevronRight", "plus", "edit", "trash", "eye", "check", "search", "star",
  "activity", "arrowLeft", "arrowRight", "arrowUp", "arrowDown", "arrowUpDown", "swap", "externalLink",
  "cornerDownRight", "menu", "zap", "camera", "image", "masonry", "grid", "compare", "slider", "aperture",
  "maximize", "close", "play", "pause", "video", "rocket", "fileText", "brain", "mail", "user", "users",
  "frontend", "backend", "tools", "design", "sparkles", "folder", "folderOpen", "bookOpen", "cake",
  "checkCircle", "xCircle", "alertTriangle", "mapPin", "calendar", "refresh", "uploadCloud", "headphones",
  "flame", "medal", "trophy", "shuffle", "mic", "disc", "listMusic", "partyPopper", "gift", "loader",
  "copy", "heartCrack", "clock", "table", "home",
];

/** Literal names rendered by layout/home/blog/projects/photography components (must stay synchronous). */
const PUBLIC_ROUTE_LITERALS = [
  "arrowRight", "music", "check", "swap", "close", "externalLink", "image", "zap", "sparkles",
  "frontend", "backend", "tools", "design", "rocket", "arrowLeft", "camera", "mapPin", "star", "user",
  "calendar", "compare", "folder", "grid", "masonry", "maximize", "play", "search", "aperture",
  "chevronLeft", "chevronRight", "globe", "video",
];

describe("icon-names", () => {
  afterEach(() => {
    vi.doUnmock("lucide-react");
    vi.doUnmock("react-icons/si");
    vi.doUnmock("react-icons/fa6");
    vi.resetModules();
  });

  it("aliases_remain_known", () => {
    expect(ICON_ALIASES.nav).toBe("menu");
    expect(isKnownIconName("nav")).toBe(true);
    expect(resolveIconName("nav")).toBe("menu");
    expect(getIconRegistry("nav")).toBe(getIconRegistry("menu"));
    for (const [alias, target] of Object.entries(ICON_ALIASES)) {
      expect(isKnownIconName(alias)).toBe(true);
      expect(resolveIconName(alias)).toBe(target);
    }
  });

  it("empty_unknown_names_false", () => {
    for (const name of ["", null, undefined, "unknown", "React", "toString", "constructor", "__proto__", "hasOwnProperty"]) {
      expect(isKnownIconName(name)).toBe(false);
      expect(getIconRegistry(name)).toBeNull();
      expect(resolveIconName(name)).toBeNull();
      expect(isPublicIconName(name)).toBe(false);
    }
  });

  it("tech_social_lists_preserved", () => {
    expect([...TECH_BRAND_ICON_NAMES]).toEqual([
      "react", "nextjs", "typescript", "javascript", "tailwind", "nodejs", "threejs", "prisma",
      "postgresql", "mongodb", "docker", "git", "figma", "cloudinary", "css", "vue", "angular", "redux",
      "graphql", "python", "aws", "java", "sass", "vite", "express",
    ]);
    expect([...SOCIAL_BRAND_ICON_NAMES]).toEqual([
      "github", "linkedin", "twitter", "facebook", "youtube", "instagram", "discord", "telegram",
    ]);
  });

  it("classifies_names_by_registry", () => {
    expect(getIconRegistry("arrowRight")).toBe("public");
    expect(getIconRegistry("frontend")).toBe("public");
    expect(getIconRegistry("headphones")).toBe("music");
    expect(getIconRegistry("menu")).toBe("music");
    expect(getIconRegistry("dashboard")).toBe("admin");
    expect(getIconRegistry("react")).toBe("tech");
    expect(getIconRegistry("express")).toBe("tech");
    expect(getIconRegistry("github")).toBe("social");

    // No icon from the old registry disappears.
    for (const name of [...ORIGINAL_STROKE_NAMES, ...TECH_BRAND_ICON_NAMES, ...SOCIAL_BRAND_ICON_NAMES]) {
      expect(isKnownIconName(name), name).toBe(true);
    }
    const canonical = [
      ...PUBLIC_ICON_NAMES, ...ADMIN_ICON_NAMES, ...MUSIC_ICON_NAMES,
      ...TECH_BRAND_ICON_NAMES, ...SOCIAL_BRAND_ICON_NAMES,
    ];
    // Each canonical name lives in exactly one registry, and nothing new was invented.
    expect(new Set(canonical).size).toBe(canonical.length);
    expect(canonical.length + Object.keys(ICON_ALIASES).length).toBe(
      ORIGINAL_STROKE_NAMES.length + TECH_BRAND_ICON_NAMES.length + SOCIAL_BRAND_ICON_NAMES.length,
    );

    // Fixed names on public routes render from the synchronous registry (no lazy slot).
    for (const name of PUBLIC_ROUTE_LITERALS) {
      expect(getIconRegistry(name), name).toBe("public");
      expect(isPublicIconName(name), name).toBe(true);
    }
  });

  it("public_name_module_has_no_runtime_registry_dependency", async () => {
    const boom = () => {
      throw new Error("icon-names must not import an icon component registry");
    };
    vi.resetModules();
    vi.doMock("lucide-react", boom);
    vi.doMock("react-icons/si", boom);
    vi.doMock("react-icons/fa6", boom);
    const mod = await import("@/lib/icon-names");
    expect(mod.isKnownIconName("github")).toBe(true);
    expect(mod.getIconRegistry("heart")).toBe("music");
  });
});

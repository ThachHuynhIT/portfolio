import { describe, expect, it } from "vitest";
import { getFallbackSiteConfig } from "@/lib/site-config-fallback";
import { buildMetadata } from "@/lib/seo";

describe("getFallbackSiteConfig", () => {
  it("complete_author_and_safe_metadata_when_db_fails", () => {
    const config = getFallbackSiteConfig();

    // Real defaults, not the old t/d/n/a/localhost placeholders.
    for (const value of [config.name, config.title, config.description]) {
      expect(value.trim().length).toBeGreaterThan(3);
    }
    for (const value of [config.author.name, config.author.title, config.author.bio, config.author.location]) {
      expect(value.trim().length).toBeGreaterThan(1);
    }
    expect(config.author.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(JSON.stringify(config)).not.toContain("localhost");

    const url = new URL(config.url);
    expect(url.protocol).toBe("https:");
    expect(config.resumeUrl).toBeNull();
    expect(config.sectionsContent).toEqual({});

    expect(() =>
      buildMetadata({
        title: config.title,
        description: config.description,
        path: "/",
        image: config.ogImage,
        siteName: config.name,
      })
    ).not.toThrow();
  });

  it("returns a fresh object each call so callers cannot mutate the defaults", () => {
    const first = getFallbackSiteConfig();
    first.author.name = "changed";
    first.name = "changed";
    const second = getFallbackSiteConfig();
    expect(second.author.name).not.toBe("changed");
    expect(second.name).not.toBe("changed");
  });
});

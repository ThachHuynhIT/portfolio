import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { EXCLUDED_ROUTE_PREFIXES, isExcludedRoute } from "@/lib/constants";
import { buildThemeInitScript, THEME_INIT_SCRIPT } from "@/lib/theme-init";

type Env = {
  path: string;
  stored?: string | null;
  storageThrows?: boolean;
  systemDark?: boolean;
  matchMediaThrows?: boolean;
};

// Runs the inline script in an isolated VM context with minimal DOM mocks and
// returns the data-theme it set on <html> (undefined if it set none).
function runScript(script: string, env: Env): string | undefined {
  const attributes: Record<string, string> = {};
  const context = {
    window: {
      location: { pathname: env.path },
      matchMedia: (query: string) => {
        if (env.matchMediaThrows) throw new Error("matchMedia unavailable");
        return { matches: query === "(prefers-color-scheme: dark)" && !!env.systemDark };
      },
    },
    localStorage: {
      getItem: (key: string) => {
        if (env.storageThrows) throw new Error("SecurityError: storage disabled");
        return key === "portfolio_theme" ? (env.stored ?? null) : null;
      },
    },
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) => {
          attributes[name] = value;
        },
      },
    },
  };
  runInNewContext(script, context);
  return attributes["data-theme"];
}

describe("buildThemeInitScript", () => {
  it("theme_script_matches_excluded_prefix_boundary", () => {
    const script = buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES);
    for (const path of ["/admin", "/admin/x", "/music", "/music/abc", "/couple", "/couple/"]) {
      expect(runScript(script, { path, stored: "light" })).toBe("dark");
    }
    for (const path of ["/administrator", "/musicxyz", "/", "/blog"]) {
      expect(runScript(script, { path, stored: "light" })).toBe("light");
    }
  });

  it("matches isExcludedRoute() from ThemeContext for every probed path", () => {
    const script = buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES);
    const paths = ["/", "/admin", "/admin/x", "/administrator", "/music", "/musics", "/couple/a/b", "/blog/admin"];
    for (const path of paths) {
      const theme = runScript(script, { path, stored: "light" });
      expect(theme === "dark").toBe(isExcludedRoute(path));
    }
  });

  it("uses the saved preference, else the system preference", () => {
    const script = buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES);
    expect(runScript(script, { path: "/", stored: "light", systemDark: true })).toBe("light");
    expect(runScript(script, { path: "/", stored: "dark", systemDark: false })).toBe("dark");
    expect(runScript(script, { path: "/", stored: null, systemDark: true })).toBe("dark");
    expect(runScript(script, { path: "/", stored: null, systemDark: false })).toBe("light");
    expect(runScript(script, { path: "/", stored: "purple", systemDark: true })).toBe("dark");
  });

  it("theme_script_survives_storage_error", () => {
    const script = buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES);
    // Same as detectPreferredTheme(): a storage read error falls back to the system preference.
    expect(runScript(script, { path: "/", storageThrows: true, systemDark: false })).toBe("light");
    expect(runScript(script, { path: "/", storageThrows: true, systemDark: true })).toBe("dark");
    // Any other failure must not throw out of the inline script.
    expect(() => runScript(script, { path: "/", matchMediaThrows: true })).not.toThrow();
  });

  it("is deterministic and is what THEME_INIT_SCRIPT exports", () => {
    expect(buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES)).toBe(buildThemeInitScript([...EXCLUDED_ROUTE_PREFIXES]));
    expect(THEME_INIT_SCRIPT).toBe(buildThemeInitScript(EXCLUDED_ROUTE_PREFIXES));
    // No characters an HTML parser or React could alter inside <script>.
    expect(THEME_INIT_SCRIPT).not.toMatch(/[<\r\n]/);
  });
});

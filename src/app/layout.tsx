import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Inter, Space_Grotesk } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { Navigation, Footer } from "@/components/ui";
import { MusicProvider } from "@/context/MusicContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { getPublishedNavLinks } from "@/lib/content/nav-links";
import { getPublishedSocialLinks } from "@/lib/content/social-links";
import { getPublishedSiteConfig } from "@/lib/content/site-config";
import { buildMetadata } from "@/lib/seo";
import { getFallbackSiteConfig } from "@/lib/site-config-fallback";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init";
import { getPostSummaries } from "@/lib/blog";
import { filterBlogNavLinks } from "@/lib/navigation-section";
import { getErrorMessage } from "@/lib/utils";
import type { NavLink, SiteConfig, SocialLink } from "@/lib/types";

// Floating overlay with no SSR value — mounted on every route, so keep it
// out of the initial/shared bundle.
const GlobalMusicPlayer = dynamic(
  () => import("@/components/music/GlobalMusicPlayer"),
  { ssr: false }
);

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// The catch sits outside the cached reader (getPublishedSiteConfig wraps
// unstable_cache), so a DB outage falls back to the real typed defaults for
// this render only and is never cached as a successful response.
function loadSiteConfig(): Promise<SiteConfig> {
  return getPublishedSiteConfig().catch((error: unknown) => {
    console.error(
      "[layout] site config unavailable, using defaults:",
      getErrorMessage(error) ?? "unknown error"
    );
    return getFallbackSiteConfig();
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await loadSiteConfig();

  // Only alternates/openGraph/twitter come from buildMetadata() — the root
  // layout needs a title *template* (so descendant pages' bare `title`
  // strings render as "Page | Site"), which buildMetadata's plain-string
  // `title` input doesn't produce, so it's built directly below instead of
  // spreading (and immediately overriding) the whole object.
  const { alternates, openGraph, twitter } = buildMetadata({
    title: siteConfig.title,
    description: siteConfig.description,
    path: "/",
    image: siteConfig.ogImage,
    siteName: siteConfig.name,
  });

  // Every site-config field may be left blank in the admin; skip whatever is
  // empty instead of emitting blank tags (or crashing on new URL("")).
  let metadataBase: URL | undefined;
  try {
    metadataBase = siteConfig.url?.trim() ? new URL(siteConfig.url) : undefined;
  } catch {
    metadataBase = undefined;
  }

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: {
      default: siteConfig.title || siteConfig.name || "",
      template: siteConfig.name ? `%s | ${siteConfig.name}` : "%s",
    },
    ...(siteConfig.description ? { description: siteConfig.description } : {}),
    keywords: [
      "web developer",
      "frontend",
      "react",
      "next.js",
      "three.js",
      "portfolio",
    ],
    ...(siteConfig.author.name ? { authors: [{ name: siteConfig.author.name }] } : {}),
    alternates,
    openGraph,
    twitter,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#faf9fc" },
  ],
};

import GlobalBackground, { PortfolioScope } from "@/components/layout/GlobalBackground";
import MotionProvider from "@/components/layout/MotionProvider";

// THEME_INIT_SCRIPT (src/lib/theme-init.ts) runs before hydration to set
// data-theme on <html> pre-paint. Emit it verbatim: its sha256 is pinned in
// the report-only CSP in next.config.js.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [allNavLinks, socialLinks, siteConfig, posts] = await Promise.all([
    getPublishedNavLinks().catch(() => [] as NavLink[]),
    getPublishedSocialLinks().catch(() => [] as SocialLink[]),
    loadSiteConfig(),
    getPostSummaries().catch(() => null),
  ]);
  // A failed read is unknown, rather than an empty blog. Preserve navigation.
  const navLinks = filterBlogNavLinks(allNavLinks, posts === null || posts.length > 0);

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${beVietnamPro.variable} antialiased bg-background text-foreground font-sans`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <MotionProvider>
            <GlobalBackground />
            <LanguageProvider>
              <MusicProvider>
                <PortfolioScope>
                  <Navigation navLinks={navLinks} />
                  <main>{children}</main>
                  <Footer navLinks={navLinks} socialLinks={socialLinks} siteConfig={siteConfig} />
                </PortfolioScope>
                <GlobalMusicPlayer />
              </MusicProvider>
            </LanguageProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

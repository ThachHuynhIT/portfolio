import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { Navigation, Footer } from "@/components/ui";
import { MusicProvider } from "@/context/MusicContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { getPublishedNavLinks } from "@/lib/content/nav-links";
import { getPublishedSocialLinks } from "@/lib/content/social-links";
import { getPublishedSiteConfig } from "@/lib/content/site-config";

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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thach Huynh | Creative Web Developer",
  description:
    "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  keywords: [
    "web developer",
    "frontend",
    "react",
    "next.js",
    "three.js",
    "portfolio",
  ],
  authors: [{ name: "Thach Huynh" }],
  openGraph: {
    title: "Thach Huynh | Creative Web Developer",
    description:
      "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
    type: "website",
    locale: "en_US",
    url: "https://portfolio-thach.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thach Huynh | Creative Web Developer",
    description:
      "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import GlobalBackground from "@/components/layout/GlobalBackground";

// KEEP IN SYNC WITH detectPreferredTheme()/isExcludedRoute() in
// src/context/ThemeContext.tsx — runs before hydration to set data-theme
// on <html> pre-paint, avoiding a flash of the wrong theme.
const THEME_INIT_SCRIPT = `(function(){try{
  var excluded=["/admin","/contra","/couple"];
  var path=window.location.pathname;
  if(excluded.some(function(p){return path.indexOf(p)===0})){
    document.documentElement.setAttribute("data-theme","dark");
    return;
  }
  var stored=localStorage.getItem("portfolio_theme");
  var theme=stored==="light"||stored==="dark"?stored:
    (window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  document.documentElement.setAttribute("data-theme",theme);
}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navLinks, socialLinks, siteConfig] = await Promise.all([
    getPublishedNavLinks(),
    getPublishedSocialLinks(),
    getPublishedSiteConfig(),
  ]);

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground font-sans`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <GlobalBackground />
          <LanguageProvider>
            <MusicProvider>
              <Navigation navLinks={navLinks} />
              <main>{children}</main>
              <Footer navLinks={navLinks} socialLinks={socialLinks} siteConfig={siteConfig} />
              <GlobalMusicPlayer />
            </MusicProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

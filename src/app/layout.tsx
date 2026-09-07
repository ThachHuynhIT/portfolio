import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation, Footer } from "@/components/ui";
import { MusicProvider } from "@/context/MusicContext";
import { LanguageProvider } from "@/context/LanguageContext";
import GlobalMusicPlayer from "@/components/music/GlobalMusicPlayer";

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

import GlobalBackground from "@/components/layout/GlobalBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-[#030014] text-white font-sans selection:bg-purple-500/30 selection:text-white`}
      >
        <GlobalBackground />
        <LanguageProvider>
          <MusicProvider>
            <Navigation />
            <main>{children}</main>
            <Footer />
            <GlobalMusicPlayer />
          </MusicProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

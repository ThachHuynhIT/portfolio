import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navigation, Footer } from "@/components/ui";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "John Doe | Creative Web Developer",
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
  authors: [{ name: "John Doe" }],
  openGraph: {
    title: "John Doe | Creative Web Developer",
    description:
      "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
    type: "website",
    locale: "en_US",
    url: "https://johndoe.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "John Doe | Creative Web Developer",
    description:
      "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-black text-white font-sans`}
      >
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

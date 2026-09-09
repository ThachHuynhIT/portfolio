"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

// Dynamically import 3D background on client side to prevent SSR issues with WebGL
const StarryBackground3D = dynamic(
  () => import("@/components/3d/StarryBackground3D"),
  { ssr: false }
);

const LIGHT_FALLBACK = (
  <div className="fixed inset-0 -z-10 bg-gradient-radial from-purple-300/25 via-cyan-100/15 to-transparent" />
);

/**
 * GlobalBackground - Renders 3D starry sky background across all portfolio pages.
 * Skips rendering on /admin to ensure maximum performance and high contrast for CMS tasks.
 * In light theme, swaps the WebGL starfield for a static soft gradient since stars
 * don't read well against a light background.
 */
export default function GlobalBackground() {
  const pathname = usePathname();
  const { resolvedTheme, isMounted } = useTheme();

  // Keep admin dashboard clean without 3D canvas overhead
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Avoid mounting the wrong variant before ThemeContext resolves on the client
  if (!isMounted) {
    return null;
  }

  if (resolvedTheme === "light") {
    return LIGHT_FALLBACK;
  }

  return <StarryBackground3D />;
}

"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Dynamically import 3D background on client side to prevent SSR issues with WebGL
const StarryBackground3D = dynamic(
  () => import("@/components/3d/StarryBackground3D"),
  { ssr: false }
);

/**
 * GlobalBackground - Renders 3D starry sky background across all portfolio pages.
 * Skips rendering on /admin to ensure maximum performance and high contrast for CMS tasks.
 */
export default function GlobalBackground() {
  const pathname = usePathname();

  // Keep admin dashboard clean without 3D canvas overhead
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return <StarryBackground3D />;
}

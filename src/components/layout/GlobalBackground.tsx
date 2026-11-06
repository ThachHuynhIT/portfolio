"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { isExcludedRoute } from "@/lib/constants";

const StarryBackground3D = dynamic(() => import("@/components/3d/StarryBackground3D"), { ssr: false });

export function PortfolioScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div data-home={pathname === "/" ? "true" : undefined} className={isExcludedRoute(pathname) ? undefined : "portfolio-theme portfolio-scope"}>{children}</div>;
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const { resolvedTheme, isMounted } = useTheme();
  if (pathname?.startsWith("/admin") || !isMounted) return null;
  if (pathname === "/") return null;
  if (resolvedTheme === "light") return <div className="fixed inset-0 -z-10 bg-gradient-radial from-purple-300/25 via-cyan-100/15 to-transparent" />;
  return <StarryBackground3D />;
}

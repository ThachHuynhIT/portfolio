"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isExcludedRoute } from "@/lib/constants";

export function PortfolioScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div data-home={pathname === "/" ? "true" : undefined} className={isExcludedRoute(pathname) ? undefined : "portfolio-theme portfolio-scope"}>{children}</div>;
}

export default function GlobalBackground() {
  const pathname = usePathname();
  if (pathname === "/" || ["/admin", "/couple"].some((prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`))) return null;
  const isMusic = pathname === "/music" || pathname?.startsWith("/music/");
  return (
    <div aria-hidden="true" data-portfolio-dark={isMusic ? "true" : undefined} className="portfolio-theme pointer-events-none fixed inset-0 -z-10 bg-portfolio-void">
      <div className="portfolio-stars absolute inset-0" />
    </div>
  );
}

import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, intro, children, className }: { title: ReactNode; intro?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("portfolio-page-header", className)}>
      <SectionHeading as="h1" className="portfolio-reveal portfolio-reveal--sweep">{title}</SectionHeading>
      {intro != null && <p className="portfolio-page-intro portfolio-reveal portfolio-reveal--focus text-portfolio-dust">{intro}</p>}
      {children != null && <div className="portfolio-reveal">{children}</div>}
    </div>
  );
}

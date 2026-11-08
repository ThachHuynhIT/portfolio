import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, intro, children, className }: { title: ReactNode; intro?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("portfolio-page-header", className)}>
      <SectionHeading as="h1">{title}</SectionHeading>
      {intro != null && <p className="portfolio-page-intro text-portfolio-dust">{intro}</p>}
      {children}
    </div>
  );
}

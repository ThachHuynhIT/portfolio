"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { headingRise, headingUnderline, starIgnition } from "@/lib/animations";
import { cn } from "@/lib/utils";

export default function SectionHeading({ children, id, as: Heading = "h2", className }: { children: ReactNode; id?: string; as?: "h1" | "h2"; className?: string }) {
  const reducedMotion = useReducedMotion();
  return <div className="portfolio-section-heading mb-8">
    <Heading id={id} className={cn("relative inline-block max-w-full pb-3 text-2xl font-bold text-portfolio-ink md:text-4xl", Heading === "h1" && "text-3xl sm:text-4xl md:text-5xl", className)}>
      <motion.span variants={headingRise} initial={false} whileInView={reducedMotion ? undefined : "visible"} viewport={{ once: true }}><motion.span aria-hidden="true" className="portfolio-heading-spark mr-3 inline-block h-1.5 w-1.5 rounded-full bg-portfolio-accretion align-middle" variants={starIgnition} initial={false} whileInView={reducedMotion ? undefined : "visible"} viewport={{ once: true }} />{children}</motion.span>
      <motion.span aria-hidden="true" className="portfolio-heading-line absolute inset-x-0 bottom-0 mx-auto h-px w-2/3 max-w-44 origin-center bg-portfolio-accretion" variants={headingUnderline} initial={false} whileInView={reducedMotion ? undefined : "visible"} viewport={{ once: true }} />
    </Heading>
  </div>;
}

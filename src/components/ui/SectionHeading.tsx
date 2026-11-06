"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { orbitArc, starIgnition } from "@/lib/animations";

export default function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  const reducedMotion = useReducedMotion();
  return <div className="portfolio-section-heading relative mb-8 w-fit pb-3">
    <h2 id={id} className="flex items-center gap-3 text-2xl font-bold text-portfolio-ink md:text-4xl">
      <motion.span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-portfolio-accretion" variants={starIgnition} initial={false} whileInView={reducedMotion ? undefined : "visible"} viewport={{ once: true }} />
      {children}
    </h2>
    <svg aria-hidden="true" viewBox="0 0 180 16" className="absolute bottom-0 left-4 h-4 w-44 fill-none stroke-portfolio-accretion">
      <motion.path className="portfolio-orbit-arc" d="M1 14 Q80 -10 179 12" pathLength="1" strokeDasharray="1" variants={orbitArc} initial={reducedMotion ? false : "rest"} whileInView="visible" viewport={{ once: true }} />
    </svg>
  </div>;
}

"use client";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { constellationDraw } from "@/lib/animations";
import { layoutConstellation } from "@/lib/constellation-layout";
import { useTranslation } from "@/context/LanguageContext";
import { resolveRequiredText, resolveSectionText } from "@/lib/content-overrides";
import type { Skill, SiteConfig } from "@/lib/types";
export interface SkillsSectionProps { skills: Skill[]; siteConfig: SiteConfig }
const categories = ["frontend", "backend", "tools", "design"] as const;
export default function SkillsSection({ skills, siteConfig }: SkillsSectionProps) {
  const { t, locale } = useTranslation();
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const copy = siteConfig.sectionsContent?.skills;
  const groups = categories.map((category) => ({ category, group: skills.filter((skill) => skill.category === category) })).filter(({ group }) => group.length);
  const highlight = (id?: string) => {
    root.current?.querySelectorAll<HTMLElement | SVGElement>("[data-skill], [data-from]").forEach((node) => {
      node.dataset.active = String(Boolean(id && (node.dataset.skill === id || node.dataset.from === id || node.dataset.to === id)));
    });
  };
  const title = resolveSectionText(locale, copy?.titlePrefix, copy?.titlePrefix_vi, t("skills.titlePrefix")) + resolveSectionText(locale, copy?.titleHighlight, copy?.titleHighlight_vi, t("skills.titleHighlight"));
  return <section id="skills" className="portfolio-section"><div className="portfolio-column">
    {title && <div className="portfolio-reveal text-center mb-10"><SectionHeading>{title}</SectionHeading></div>}
    <div ref={root} className="portfolio-constellation-grid" data-groups={groups.length}>
      {groups.map(({ category, group }) => {
        const layout = layoutConstellation(group);
        return <div key={category} className="portfolio-constellation portfolio-solid portfolio-reveal">
          <h3 className="text-lg font-semibold mb-4">{resolveRequiredText(locale, copy?.categories?.[category], copy?.categories?.[`${category}_vi`], t(`skills.categories.${category}`))}</h3>
          <div className="portfolio-constellation-map relative" style={{ "--constellation-height": `${Math.max(140, Math.ceil(layout.nodes.length / 2) * 84)}px` } as import("react").CSSProperties}>
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="portfolio-constellation-lines">
              {layout.edges.map(([a, b]) => {
                const from = layout.nodes.find((node) => node.id === a)!;
                const to = layout.nodes.find((node) => node.id === b)!;
                return <motion.line key={`${a}-${b}`} data-from={a} data-to={b} x1={from.x} y1={from.y} x2={to.x} y2={to.y} pathLength={1} strokeDasharray="1" variants={constellationDraw} initial={false} whileInView={reduced ? undefined : "visible"} viewport={{ once: true }} />;
              })}
            </svg>
            <ul className="portfolio-skill-list">{layout.nodes.map((node) => {
              const skill = group.find((item) => item.id === node.id)!;
              return <li key={node.id} style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                <span tabIndex={0} data-skill={node.id} onMouseEnter={() => highlight(node.id)} onMouseLeave={() => highlight()} onFocus={() => highlight(node.id)} onBlur={() => highlight()} className="portfolio-skill"><span aria-hidden="true">✦</span>{skill.name}</span>
              </li>;
            })}</ul>
          </div>
        </div>;
      })}
    </div>
  </div></section>;
}

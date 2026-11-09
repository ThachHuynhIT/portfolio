"use client";
import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { pickLocalized, resolveSectionText } from "@/lib/content-overrides";
import type { Project, SiteConfig } from "@/lib/types";
const ProjectDialog = dynamic(() => import("./ProjectDialog"));
export interface ProjectsSectionProps { projects: Project[]; siteConfig: SiteConfig }
export default function ProjectsSection({ projects, siteConfig }: ProjectsSectionProps) {
  const { t, locale } = useTranslation();
  const [selected, setSelected] = useState<Project | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const caseRefs = useRef(new Map<string, HTMLElement>());
  const copy = siteConfig.sectionsContent?.projects;
  const featured = projects.filter((project) => project.featured);
  const shown = (featured.length ? featured : projects).slice(0, 6);
  const title = resolveSectionText(locale, copy?.titlePrefix, copy?.titlePrefix_vi, t("projects.titlePrefix")) + resolveSectionText(locale, copy?.titleHighlight, copy?.titleHighlight_vi, t("projects.titleHighlight"));
  const all = resolveSectionText(locale, copy?.viewAll, copy?.viewAll_vi, t("projects.viewAll"));
  return <section id="projects" className="portfolio-section"><div className="portfolio-column">
    {title && <div className="portfolio-reveal text-center mb-10"><SectionHeading>{title}</SectionHeading></div>}
    <div className="grid gap-6 md:grid-cols-2">{shown.map((project, i) => {
      const name = pickLocalized(locale, project.title, project.title_vi);
      return <article ref={(element) => { if (element) caseRefs.current.set(project.id, element); else caseRefs.current.delete(project.id); }} key={project.id} className={`portfolio-case portfolio-solid portfolio-reveal ${i === 0 && project.featured ? "md:col-span-2" : ""}`} onPointerMove={(event) => {
        const card = caseRefs.current.get(project.id); if (!card) return; const rect = card.getBoundingClientRect();
        card.style.setProperty("--lens-x", `${event.clientX - rect.left}px`); card.style.setProperty("--lens-y", `${event.clientY - rect.top}px`);
      }}>
        {project.image && <div className="relative aspect-[16/9] mb-5 overflow-hidden"><Image src={project.image} alt={name} fill sizes={i === 0 && project.featured ? "(max-width: 1120px) calc(100vw - 80px), 1056px" : "(max-width: 767px) calc(100vw - 80px), 500px"} className="object-cover" /></div>}
        <h3 className="portfolio-case-title text-xl sm:text-2xl font-bold break-words"><button type="button" aria-haspopup="dialog" onClick={() => setSelected(project)} className="text-left min-h-11">{name}</button></h3>
        <p className="leading-relaxed my-4 text-portfolio-dust">{pickLocalized(locale, project.description, project.description_vi)}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        {(project.liveUrl || project.githubUrl) && <div className="flex gap-5 mt-4">{project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-text-link">{t("projects.viewLive")}</a>}{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="portfolio-text-link">{t("projects.sourceCode")}</a>}</div>}
      </article>;
    })}</div>
    {all && <div className="portfolio-reveal text-center mt-8"><Link className="portfolio-text-link" href="/projects">{all}</Link></div>}
    {selected && <ProjectDialog project={selected} onClose={close} projectsCopy={copy} />}
  </div></section>;
}

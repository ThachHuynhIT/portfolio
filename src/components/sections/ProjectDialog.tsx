"use client";
import { useEffect, useRef } from "react";
import PublicIcon from "@/components/ui/PublicIcon";
import ActionStars from "@/components/ui/ActionStars";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { resolveRequiredText, pickLocalized } from "@/lib/content-overrides";
import type { Project, ProjectsSectionContent } from "@/lib/types";
export default function ProjectDialog({ project, onClose, projectsCopy }: { project: Project; onClose: () => void; projectsCopy?: ProjectsSectionContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = ref.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]');
      const first = items?.[0]; const last = items?.[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = overflow; trigger?.focus(); };
  }, [onClose]);
  const title = pickLocalized(locale, project.title, project.title_vi);
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 light:bg-white/80" onClick={onClose}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" tabIndex={-1} onClick={(event) => event.stopPropagation()} className="portfolio-project-dialog portfolio-solid relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <button type="button" onClick={onClose} className="portfolio-dialog-close portfolio-action min-h-11 min-w-11 float-right inline-flex items-center justify-center" aria-label={resolveRequiredText(locale, projectsCopy?.closeModal, projectsCopy?.closeModal_vi, t("projects.closeModal"))}><PublicIcon name="close" size={24} /></button>
      <h2 id="project-dialog-title" className="text-2xl font-bold break-words mb-6 pr-12">{title}</h2>
      {project.image && <div className="relative aspect-video mb-6 overflow-hidden"><Image src={project.image} alt={title} fill sizes="(max-width: 700px) calc(100vw - 64px), 608px" className="object-cover" /></div>}
      <p className="leading-relaxed mb-6">{pickLocalized(locale, project.longDescription, project.longDescription_vi) || pickLocalized(locale, project.description, project.description_vi)}</p>
      <ul className="flex flex-wrap gap-3 text-portfolio-dust mb-6">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      <div className="flex flex-wrap gap-4">
        {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-action portfolio-action-primary inline-flex items-center justify-center px-6 py-3 font-medium"><ActionStars />{resolveRequiredText(locale, projectsCopy?.viewLive, projectsCopy?.viewLive_vi, t("projects.viewLive"))}</a>}
        {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="portfolio-action portfolio-action-secondary inline-flex items-center justify-center px-6 py-3 font-medium">{resolveRequiredText(locale, projectsCopy?.sourceCode, projectsCopy?.sourceCode_vi, t("projects.sourceCode"))}</a>}
      </div>
    </div>
  </div>;
}

"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import { useTranslation } from "@/context/LanguageContext";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [project, onClose]);
  const { t, locale } = useTranslation();
  const displayTitle = locale === "vi" && project.title_vi ? project.title_vi : project.title;
  const displayDesc = locale === "vi" && project.description_vi ? project.description_vi : project.description;
  const displayLongDesc = locale === "vi" && project.longDescription_vi ? project.longDescription_vi : project.longDescription || displayDesc;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div onClick={onClose} className="absolute inset-0 bg-black/60" />
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={displayTitle} tabIndex={-1} className="portfolio-solid relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-portfolio-hull border border-portfolio-hairline p-6 sm:p-8 focus:outline-none">
      <div className="flex justify-end mb-4"><button onClick={onClose} aria-label={t("projects.closeModal")} className="portfolio-action portfolio-action-secondary min-w-11 min-h-11"><Icon name="close" size={16} /></button></div>
      {project.image && <div className="relative aspect-video overflow-hidden mb-6"><Image src={project.image} alt={displayTitle} fill sizes="(max-width: 640px) 100vw, 672px" priority className="object-cover" /></div>}
      {project.featured && <span className="text-xs text-portfolio-accretion">{t("projects.featuredBadge")}</span>}
      <h2 className="text-2xl font-bold text-portfolio-ink mb-3 break-words">{displayTitle}</h2>
      <p className="text-portfolio-dust mb-6 leading-relaxed">{displayLongDesc}</p>
      <div className="flex flex-wrap gap-2 mb-6 text-xs text-portfolio-dust">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      <div className="flex flex-wrap gap-4">
        {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-text-link relative z-10">{t("projects.viewLive")}</a>}
        {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="portfolio-text-link relative z-10">{t("projects.sourceCode")}</a>}
      </div>
    </div>
  </div>;
}

export default function ProjectsGallery({ initialProjects }: { initialProjects: Project[] }) {
  const { t, locale } = useTranslation();
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const close = useCallback(() => setActiveProject(null), []);
  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialProjects.forEach((p) => {
      p.tags?.forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [initialProjects]);

  // Filter projects by tag and search query
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      const matchTag =
        selectedTag === "all" || project.tags?.includes(selectedTag);

      const title = locale === "vi" && project.title_vi ? project.title_vi : project.title;
      const desc = locale === "vi" && project.description_vi ? project.description_vi : project.description;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        project.tags?.some((tag) => tag.toLowerCase().includes(q));

      return matchTag && matchSearch;
    });
  }, [initialProjects, selectedTag, searchQuery, locale]);

  return <div className="portfolio-page"><section className="portfolio-section"><div className="portfolio-column">
    <PageHeader title={t("projects.allProjectsTitle")} intro={t("projects.allProjectsSubtitle")}><span className="text-xs text-portfolio-dust uppercase tracking-widest">{t("projects.badge")}</span></PageHeader>
    <div className="flex flex-col gap-4 mb-10">
      <div className="relative w-full sm:max-w-sm">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={locale === "vi" ? "Tìm kiếm dự án, công nghệ..." : "Search projects, tags..."} className="portfolio-input w-full pr-12" />
        {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label={t("projects.closeModal")} className="absolute right-0 top-0 min-w-11 min-h-11 text-portfolio-dust focus-visible:outline-2 focus-visible:outline-portfolio-accretion"><Icon name="close" size={14} /></button>}
      </div>
      <div className="portfolio-reveal flex flex-wrap gap-2">{["all", ...allTags].map(tag => <button key={tag} type="button" onClick={() => setSelectedTag(tag)} aria-pressed={selectedTag === tag} className={cn("rounded-lg border bg-portfolio-hull px-4 py-2 min-h-11 text-sm hover:border-portfolio-accretion focus-visible:outline-2 focus-visible:outline-portfolio-accretion", selectedTag === tag ? "border-portfolio-accretion text-portfolio-accretion" : "border-portfolio-control text-portfolio-dust")}>{tag === "all" ? <>{locale === "vi" ? "Tất cả" : "All"} ({initialProjects.length})</> : tag}</button>)}</div>
    </div>
    {filteredProjects.length > 0 ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{filteredProjects.map(project => {
      const cardTitle = locale === "vi" && project.title_vi ? project.title_vi : project.title;
      const cardDesc = locale === "vi" && project.description_vi ? project.description_vi : project.description;
      return <article key={project.id} className="portfolio-case portfolio-solid portfolio-reveal portfolio-reveal--lens min-w-0 flex flex-col">
        {project.image && <div className="relative aspect-[16/10] overflow-hidden mb-4"><Image src={project.image} alt={cardTitle} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /></div>}
        {project.featured && <span className="text-xs text-portfolio-accretion mb-2">{t("projects.featuredBadge")}</span>}
        <h2 className="text-lg font-bold break-words text-portfolio-ink"><button type="button" aria-haspopup="dialog" onClick={() => setActiveProject(project)} className="portfolio-text-link text-left min-h-11 after:absolute after:inset-0 after:content-['']">{cardTitle}</button></h2>
        <p className="text-portfolio-dust text-sm my-4 leading-relaxed flex-grow">{cardDesc}</p>
        <div className="flex flex-wrap gap-2 pt-3 border-t border-portfolio-hairline text-xs text-portfolio-dust">{project.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm">{project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="portfolio-text-link relative z-10">{t("projects.viewLive")}</a>}{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="portfolio-text-link relative z-10">{t("projects.sourceCode")}</a>}</div>
      </article>;
    })}</div> : <div className="portfolio-solid portfolio-reveal py-16 text-center"><p className="text-portfolio-dust">{t("projects.noProjectsFound")}</p></div>}
  </div></section>{activeProject && <ProjectDetailModal project={activeProject} onClose={close} />}</div>;
}

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, TiltCard, Button } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import type { Project } from "@/lib/types";

interface ProjectsGalleryProps {
  initialProjects: Project[];
}

function ProjectDetailModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [project, onClose]);

  const { t, locale } = useTranslation();
  if (!project) return null;

  const displayTitle = locale === "vi" && project.title_vi ? project.title_vi : project.title;
  const displayDesc = locale === "vi" && project.description_vi ? project.description_vi : project.description;
  const displayLongDesc =
    locale === "vi" && project.longDescription_vi
      ? project.longDescription_vi
      : project.longDescription || displayDesc;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm light:bg-white/80"
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={displayTitle}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl focus:outline-none"
      >
        <GlassCard className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            aria-label={t("projects.closeModal")}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-20 light:bg-neutral-900/[0.04] light:border-neutral-900/10 light:text-neutral-500 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.06]"
          >
            ✕
          </button>

          <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-slate-950 border border-white/10 shadow-lg light:bg-slate-100 light:border-neutral-900/10">
            {project.image ? (
              <Image
                src={project.image}
                alt={displayTitle}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                🚀
              </div>
            )}
            {project.featured && (
              <div className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full shadow-md">
                {t("projects.featuredBadge")}
              </div>
            )}
          </div>

          <h3 className="text-2xl font-bold text-white mb-3 light:text-neutral-900">{displayTitle}</h3>
          <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed light:text-neutral-600">{displayLongDesc}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-white/80 bg-white/5 border border-white/10 rounded-full light:text-neutral-700 light:bg-neutral-900/[0.04] light:border-neutral-900/10"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            {project.liveUrl && (
              <Button
                variant="primary"
                onClick={() =>
                  window.open(project.liveUrl, "_blank", "noopener,noreferrer")
                }
              >
                {t("projects.viewLive")}
              </Button>
            )}
            {project.githubUrl && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(project.githubUrl, "_blank", "noopener,noreferrer")
                }
              >
                {t("projects.sourceCode")}
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsGallery({ initialProjects }: ProjectsGalleryProps) {
  const { t, locale } = useTranslation();
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);

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

  return (
    <div className="min-h-screen pt-32 pb-24 text-white light:text-neutral-900">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        {/* Page Header */}
        <div className="text-center mb-14">
          <span className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-3 block">
            {t("projects.badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight light:text-neutral-900">
            {t("projects.allProjectsTitle")}
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed light:text-neutral-600">
            {t("projects.allProjectsSubtitle")}
          </p>
        </div>

        {/* Search & Tag Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "vi" ? "Tìm kiếm dự án, công nghệ..." : "Search projects, tags..."}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all light:bg-neutral-900/[0.04] light:border-neutral-900/10 light:text-neutral-900 light:placeholder-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs light:text-neutral-500 light:hover:text-neutral-900"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tags Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedTag === "all"
                  ? "bg-white text-black font-semibold shadow-md light:bg-neutral-900 light:text-white light:shadow-neutral-400/20"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 light:bg-neutral-900/[0.04] light:text-neutral-500 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.06] light:border-neutral-900/10"
                }`}
            >
              {locale === "vi" ? "Tất cả" : "All"} ({initialProjects.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedTag === tag
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-md shadow-purple-500/20"
                    : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 light:bg-neutral-900/[0.04] light:text-neutral-500 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.06] light:border-neutral-900/10"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const cardTitle = locale === "vi" && project.title_vi ? project.title_vi : project.title;
              const cardDesc = locale === "vi" && project.description_vi ? project.description_vi : project.description;

              return (
                <TiltCard
                  key={project.id}
                  className="h-full group cursor-pointer"
                  onClick={() => setActiveProject(project)}
                >
                  <div className="p-5 flex flex-col h-full">
                    {/* Project Thumbnail Image */}
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-slate-950 border border-white/10 shadow-sm light:bg-slate-100 light:border-neutral-900/10">
                      {project.image ? (
                        <Image
                          src={project.image}
                          alt={cardTitle}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                          🚀
                        </div>
                      )}
                      {project.featured && (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[11px] font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full shadow-md shadow-purple-500/30">
                          {t("projects.featuredBadge")}
                        </div>
                      )}
                    </div>

                    {/* Project Info */}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors light:text-neutral-900">
                      {cardTitle}
                    </h3>
                    <p className="text-white/60 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed flex-grow light:text-neutral-600">
                      {cardDesc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5 light:border-neutral-900/10">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[11px] font-medium text-white/70 bg-white/5 border border-white/10 rounded-md light:text-neutral-600 light:bg-neutral-900/[0.04] light:border-neutral-900/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 rounded-2xl bg-white/[0.02] border border-white/5 light:bg-neutral-900/[0.03] light:border-neutral-900/10">
            <p className="text-white/60 text-base light:text-neutral-600">{t("projects.noProjectsFound")}</p>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      <AnimatePresence>
        {activeProject && (
          <ProjectDetailModal
            project={activeProject}
            onClose={() => setActiveProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

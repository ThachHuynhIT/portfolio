"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AnimatedSection, GlassCard, TiltCard, Button, ImageWithSkeleton, Icon } from "@/components/ui";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { Project, ProjectsSectionContent, SiteConfig } from "@/lib/types";
import { useTranslation } from "@/context/LanguageContext";
import { resolveSectionText } from "@/lib/content-overrides";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  projectsCopy: ProjectsSectionContent | undefined;
}

function ProjectModal({ project, onClose, projectsCopy }: ProjectModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    // Focus the modal after mounting
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
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
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 light:bg-white/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={displayTitle}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-2xl focus:outline-none"
      >
        <GlassCard className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label={resolveSectionText(locale, projectsCopy?.closeModal, projectsCopy?.closeModal_vi, t("projects.closeModal"))}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 flex items-center justify-center text-white/60 light:text-neutral-500 hover:text-white light:hover:text-neutral-900 hover:bg-white/10 light:hover:bg-neutral-900/[0.06] transition-all z-20"
          >
            <Icon name="close" size={16} />
          </button>

          {/* Project Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-slate-950 border border-white/10 light:border-neutral-900/10 shadow-lg light:shadow-neutral-400/10">
            {project.image ? (
              <ImageWithSkeleton
                src={project.image}
                alt={displayTitle}
                fill
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-purple-300">
                <Icon name="rocket" size={48} />
              </div>
            )}
            {project.featured && (
              <div className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full shadow-md">
                {resolveSectionText(locale, projectsCopy?.featuredBadge, projectsCopy?.featuredBadge_vi, t("projects.featuredBadge"))}
              </div>
            )}
          </div>

          {/* Project Info */}
          <h3 className="text-2xl font-bold text-white light:text-neutral-900 mb-3">{displayTitle}</h3>
          <p className="text-white/70 light:text-neutral-600 text-sm sm:text-base mb-6 leading-relaxed">{displayLongDesc}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-white/80 light:text-neutral-700 bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {project.liveUrl && (
              <Button
                variant="primary"
                onClick={() =>
                  window.open(project.liveUrl, "_blank", "noopener,noreferrer")
                }
              >
                {resolveSectionText(locale, projectsCopy?.viewLive, projectsCopy?.viewLive_vi, t("projects.viewLive"))}
              </Button>
            )}
            {project.githubUrl && (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(project.githubUrl, "_blank", "noopener,noreferrer")
                }
              >
                {resolveSectionText(locale, projectsCopy?.sourceCode, projectsCopy?.sourceCode_vi, t("projects.sourceCode"))}
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export interface ProjectsSectionProps {
  projects: Project[];
  siteConfig: SiteConfig;
}

export default function ProjectsSection({ projects, siteConfig }: ProjectsSectionProps) {
  const { t, locale } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projectsCopy = siteConfig.sectionsContent?.projects;

  // Pick featured projects for homepage display (compact 6 projects)
  const featuredProjects = useMemo(() => {
    const featured = projects.filter((p) => p.featured);
    return featured.length > 0 ? featured.slice(0, 6) : projects.slice(0, 6);
  }, [projects]);

  return (
    <section id="projects" className="relative pt-8 pb-56 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-xs text-purple-400 light:text-purple-700 font-semibold tracking-widest uppercase mb-3 block">
              {resolveSectionText(locale, projectsCopy?.badge, projectsCopy?.badge_vi, t("projects.badge"))}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white light:text-neutral-900 mb-4 tracking-tight">
              {resolveSectionText(locale, projectsCopy?.titlePrefix, projectsCopy?.titlePrefix_vi, t("projects.titlePrefix"))}
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {resolveSectionText(locale, projectsCopy?.titleHighlight, projectsCopy?.titleHighlight_vi, t("projects.titleHighlight"))}
              </span>
            </h2>
            <p className="text-white/60 light:text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {resolveSectionText(locale, projectsCopy?.subtitle, projectsCopy?.subtitle_vi, t("projects.subtitle"))}
            </p>
          </div>
        </AnimatedSection>

        {/* Compact 3-column Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {featuredProjects.map((project) => {
            const cardTitle = locale === "vi" && project.title_vi ? project.title_vi : project.title;
            const cardDesc = locale === "vi" && project.description_vi ? project.description_vi : project.description;

            return (
              <motion.div key={project.id} variants={fadeInUp}>
                <TiltCard
                  className="h-full group cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="p-4 sm:p-5 flex flex-col h-full">
                    {/* Project Thumbnail Image */}
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-slate-950 border border-white/10 light:border-neutral-900/10 shadow-sm light:shadow-neutral-400/10">
                      {project.image ? (
                        <ImageWithSkeleton
                          src={project.image}
                          alt={cardTitle}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-purple-300">
                          <Icon name="rocket" size={32} />
                        </div>
                      )}
                      {project.featured && (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[11px] font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full shadow-md shadow-purple-500/30">
                          {resolveSectionText(locale, projectsCopy?.featuredBadge, projectsCopy?.featuredBadge_vi, t("projects.featuredBadge"))}
                        </div>
                      )}
                    </div>

                    {/* Project Info */}
                    <h3 className="text-base sm:text-lg font-bold text-white light:text-neutral-900 mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {cardTitle}
                    </h3>
                    <p className="text-white/60 light:text-neutral-500 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">
                      {cardDesc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5 light:border-neutral-900/10">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[11px] font-medium text-white/70 light:text-neutral-600 bg-white/5 light:bg-neutral-900/[0.04] border border-white/10 light:border-neutral-900/10 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Projects Button */}
        <div className="mt-14 text-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white light:text-neutral-900 bg-white/[0.06] light:bg-neutral-900/[0.05] hover:bg-white/[0.12] light:hover:bg-neutral-900/[0.08] border border-white/15 light:border-neutral-900/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group"
          >
            <span>{resolveSectionText(locale, projectsCopy?.viewAll, projectsCopy?.viewAll_vi, t("projects.viewAll"))}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              <Icon name="arrowRight" size={16} />
            </span>
          </Link>
        </div>
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            projectsCopy={projectsCopy}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

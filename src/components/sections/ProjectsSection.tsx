"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { AnimatedSection, TiltCard, Button, GlassCard } from "@/components/ui";
import { projects } from "@/lib/constants";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { Project } from "@/lib/types";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

function ProjectModal({ project, onClose }: ProjectModalProps) {
  if (!project) return null;

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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <GlassCard className="p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>

          {/* Project Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
            <div className="absolute inset-0 flex items-center justify-center text-6xl">
              🚀
            </div>
          </div>

          {/* Project Info */}
          <h3 className="text-2xl font-bold text-white mb-3">{project.title}</h3>
          <p className="text-white/70 mb-6">{project.longDescription}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-white/80 bg-white/5 border border-white/10 rounded-full"
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
                onClick={() => window.open(project.liveUrl, "_blank")}
              >
                View Live
              </Button>
            )}
            {project.githubUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(project.githubUrl, "_blank")}
              >
                Source Code
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="projects" className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent" />

      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-purple-500 font-medium tracking-wider uppercase mb-4 block">
              My Work
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Featured{" "}
              <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                Projects
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A selection of projects that showcase my skills and passion for creating
              exceptional digital experiences
            </p>
          </div>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={fadeInUp}>
              <TiltCard
                className="h-full"
                onClick={() => setSelectedProject(project)}
              >
                <div className="p-6">
                  {/* Project Image */}
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      🚀
                    </div>
                    {project.featured && (
                      <div className="absolute top-3 right-3 px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-white/60 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium text-white/70 bg-white/5 border border-white/10 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

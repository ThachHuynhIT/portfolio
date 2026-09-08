"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/ui";
import { skills } from "@/lib/constants";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { useTranslation } from "@/context/LanguageContext";

const categories = ["frontend", "backend", "tools", "design"] as const;

type CategoryType = (typeof categories)[number] | "all";

const categoryIcons: Record<string, string> = {
  frontend: "💻",
  backend: "⚙️",
  tools: "🛠️",
  design: "🎨",
};

export default function SkillsSection() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");

  const publishedSkills = skills.filter((s) => s.published !== false);

  const displayedCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter((cat) => cat === selectedCategory);

  return (
    <section id="skills" className="relative py-28 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-600/10 via-purple-600/10 to-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* ── Section Header ── */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/[0.04] light:bg-neutral-900/[0.04] text-cyan-400 border border-white/10 light:border-neutral-900/10 mb-4 backdrop-blur-md">
              <span>⚡</span>
              <span>{t("skills.badge")}</span>
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white light:text-neutral-900 mb-5 tracking-tight">
              {t("skills.titlePrefix")}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                {t("skills.titleHighlight")}
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 light:text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
              {t("skills.subtitle")}
            </p>
          </div>
        </AnimatedSection>

        {/* ── Category Filter Tabs ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-white light:bg-neutral-900 text-slate-950 light:text-white shadow-lg shadow-white/10 light:shadow-neutral-400/20"
                : "bg-white/[0.04] light:bg-neutral-900/[0.04] text-slate-400 light:text-neutral-500 hover:text-white light:hover:text-neutral-900 hover:bg-white/10 light:hover:bg-neutral-900/[0.06] border border-white/5 light:border-neutral-900/10"
            }`}
          >
            <span>✨</span>
            <span>{t("photography.all") || "Tất cả"}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white light:bg-neutral-900 light:text-white"
                  : "bg-white/10 light:bg-neutral-900/[0.06] text-slate-400 light:text-neutral-500"
              }`}
            >
              {publishedSkills.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = publishedSkills.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-white/[0.04] light:bg-neutral-900/[0.04] text-slate-400 light:text-neutral-500 hover:text-white light:hover:text-neutral-900 hover:bg-white/10 light:hover:bg-neutral-900/[0.06] border border-white/5 light:border-neutral-900/10"
                }`}
              >
                <span>{categoryIcons[cat]}</span>
                <span>{t(`skills.categories.${cat}`)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-black/30 text-white"
                      : "bg-white/10 light:bg-neutral-900/[0.06] text-slate-400 light:text-neutral-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Skills Grouped Listing (Simplified, No %) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={`grid gap-6 ${
              displayedCategories.length === 1
                ? "grid-cols-1 max-w-2xl mx-auto"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {displayedCategories.map((category) => {
              const categorySkills = publishedSkills.filter(
                (skill) => skill.category === category
              );

              if (categorySkills.length === 0) return null;

              return (
                <div
                  key={category}
                  className="rounded-3xl bg-slate-900/50 light:bg-neutral-900/[0.03] border border-white/10 light:border-neutral-900/10 p-6 sm:p-7 backdrop-blur-md hover:border-white/20 light:hover:border-neutral-900/15 transition-all shadow-xl light:shadow-neutral-400/10 flex flex-col justify-between"
                >
                  {/* Category Card Header */}
                  <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/10 light:border-neutral-900/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/[0.06] light:bg-neutral-900/[0.06] border border-white/10 light:border-neutral-900/10 flex items-center justify-center text-xl shadow-inner">
                        {categoryIcons[category]}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white light:text-neutral-900">
                          {t(`skills.categories.${category}`)}
                        </h3>
                        <p className="text-xs text-slate-400 light:text-neutral-500">
                          {categorySkills.length} {t("skills.badge").toLowerCase()}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] light:bg-neutral-900/[0.04] text-slate-400 light:text-neutral-500 font-mono border border-white/5 light:border-neutral-900/10">
                      {category.toUpperCase()}
                    </span>
                  </div>

                  {/* Skills List as Clean Interactive Chips (No %) */}
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap gap-2.5"
                  >
                    {categorySkills.map((skill) => {
                      const isImg =
                        skill.icon &&
                        (skill.icon.startsWith("http") || skill.icon.startsWith("/"));

                      return (
                        <motion.div
                          key={skill.name}
                          variants={fadeInUp}
                          whileHover={{ scale: 1.04, y: -2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/[0.04] light:bg-neutral-900/[0.04] hover:bg-white/[0.08] light:hover:bg-neutral-900/[0.06] border border-white/10 light:border-neutral-900/10 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-colors cursor-default"
                        >
                          {/* Skill Icon */}
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {isImg ? (
                              <img
                                src={skill.icon}
                                alt={skill.name}
                                className="w-5 h-5 object-contain"
                              />
                            ) : (
                              <span className="text-base leading-none">
                                {skill.icon || "⚡"}
                              </span>
                            )}
                          </div>

                          {/* Skill Name */}
                          <span className="text-xs sm:text-sm font-medium text-slate-200 light:text-neutral-700 group-hover:text-white light:group-hover:text-neutral-900 transition-colors">
                            {skill.name}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

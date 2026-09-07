"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { AnimatedSection, GlassCard } from "@/components/ui";
import { skills } from "@/lib/constants";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { useTranslation } from "@/context/LanguageContext";

// Dynamic imports for 3D components
const SceneContainer = dynamic(
  () => import("@/components/3d/SceneContainer"),
  { ssr: false }
);

const FloatingTechStack = dynamic(
  () => import("@/components/3d/FloatingTechStack"),
  { ssr: false }
);

const categories = ["frontend", "backend", "tools", "design"] as const;

export default function SkillsSection() {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section id="skills" className="relative py-32 overflow-hidden">
      {/* 3D Background */}
      {isMounted && (
        <div className="absolute inset-0 opacity-30">
          <SceneContainer>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <FloatingTechStack />
          </SceneContainer>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-cyan-500 font-medium tracking-wider uppercase mb-4 block">
              {t("skills.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t("skills.titlePrefix")}
              <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                {t("skills.titleHighlight")}
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t("skills.subtitle")}
            </p>
          </div>
        </AnimatedSection>

        {/* Skills Grid by Category */}
        <div className="space-y-12">
          {categories.map((category) => (
            <AnimatedSection key={category}>
              <h3 className="text-xl font-semibold text-white mb-6">
                {t(`skills.categories.${category}`)}
              </h3>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
              >
                {skills
                  .filter((skill) => skill.category === category)
                  .map((skill) => (
                    <motion.div key={skill.name} variants={fadeInUp}>
                      <GlassCard className="p-4 text-center group cursor-pointer">
                        <div className="h-10 flex items-center justify-center mb-2">
                          {skill.icon && (skill.icon.startsWith("http") || skill.icon.startsWith("/")) ? (
                            <img
                              src={skill.icon}
                              alt={skill.name}
                              className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <span className="text-3xl">{skill.icon || "⚡"}</span>
                          )}
                        </div>
                        <div className="text-white/80 text-sm font-medium">
                          {skill.name}
                        </div>
                        {/* Skill level bar */}
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                          />
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

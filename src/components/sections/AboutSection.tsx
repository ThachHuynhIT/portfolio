"use client";

import { motion } from "framer-motion";
import { AnimatedSection, GlassCard } from "@/components/ui";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { useTranslation } from "@/context/LanguageContext";

export default function AboutSection() {
  const { t } = useTranslation();

  const stats = [
    { label: t("about.stats.years"), value: "5+" },
    { label: t("about.stats.projects"), value: "50+" },
    { label: t("about.stats.clients"), value: "30+" },
    { label: t("about.stats.tech"), value: "20+" },
  ];

  return (
    <section id="about" className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/5 via-transparent to-transparent" />

      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-purple-500 font-medium tracking-wider uppercase mb-4 block">
              {t("about.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t("about.titlePrefix")}
              <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                {t("about.titleHighlight")}
              </span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Bio */}
          <AnimatedSection>
            <GlassCard className="p-8">
              <h3 className="text-2xl font-semibold text-white mb-6">
                {t("about.role")}
              </h3>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>{t("about.bioP1")}</p>
                <p>{t("about.bioP2")}</p>
                <p>{t("about.bioP3")}</p>
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* Right: Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <GlassCard className="text-center p-6 h-full">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

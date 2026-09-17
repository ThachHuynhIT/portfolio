"use client";

import { motion } from "framer-motion";
import { AnimatedSection, GlassCard } from "@/components/ui";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { useTranslation } from "@/context/LanguageContext";
import { resolveSectionText, resolveStatValue } from "@/lib/content-overrides";
import { ABOUT_STAT_DEFS } from "@/lib/section-defaults";
import type { SiteConfig } from "@/lib/types";

export interface AboutSectionProps {
  siteConfig: SiteConfig;
}

export default function AboutSection({ siteConfig }: AboutSectionProps) {
  const { t, locale } = useTranslation();
  const about = siteConfig.sectionsContent?.about;

  const stats = ABOUT_STAT_DEFS.map((def, i) => {
    const override = about?.stats?.[i];
    return {
      label: resolveSectionText(locale, override?.label, override?.label_vi, t(`about.stats.${def.key}`)),
      value: resolveStatValue(locale, override, def.fallbackValue),
    };
  });

  return (
    <section id="about" className="relative pt-8 pb-60 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/5 via-transparent to-transparent" />

      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-purple-500 light:text-purple-700 font-medium tracking-wider uppercase mb-4 block">
              {resolveSectionText(locale, about?.badge, about?.badge_vi, t("about.badge"))}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white light:text-neutral-900 mb-6">
              {resolveSectionText(locale, about?.titlePrefix, about?.titlePrefix_vi, t("about.titlePrefix"))}
              <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                {resolveSectionText(locale, about?.titleHighlight, about?.titleHighlight_vi, t("about.titleHighlight"))}
              </span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Bio */}
          <AnimatedSection>
            <GlassCard className="p-8">
              <h3 className="text-2xl font-semibold text-white light:text-neutral-900 mb-6">
                {resolveSectionText(locale, about?.role, about?.role_vi, t("about.role"))}
              </h3>
              <div className="space-y-4 text-white/70 light:text-neutral-600 leading-relaxed">
                <p>{resolveSectionText(locale, about?.bioP1, about?.bioP1_vi, t("about.bioP1"))}</p>
                <p>{resolveSectionText(locale, about?.bioP2, about?.bioP2_vi, t("about.bioP2"))}</p>
                <p>{resolveSectionText(locale, about?.bioP3, about?.bioP3_vi, t("about.bioP3"))}</p>
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
            {stats.map((stat, i) => (
              <motion.div key={ABOUT_STAT_DEFS[i].key} variants={fadeInUp}>
                <GlassCard className="text-center p-6 h-full">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/60 light:text-neutral-500 text-sm">{stat.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

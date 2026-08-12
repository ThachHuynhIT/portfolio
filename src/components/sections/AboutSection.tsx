"use client";

import { motion } from "framer-motion";
import { AnimatedSection, GlassCard } from "@/components/ui";
import { siteConfig } from "@/lib/constants";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const stats = [
  { label: "Years Experience", value: "5+" },
  { label: "Projects Completed", value: "50+" },
  { label: "Happy Clients", value: "30+" },
  { label: "Technologies", value: "20+" },
];

export default function AboutSection() {
  return (
    <section id="about" className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/5 via-transparent to-transparent" />

      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-purple-500 font-medium tracking-wider uppercase mb-4 block">
              About Me
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Crafting Digital{" "}
              <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                Experiences
              </span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Bio */}
          <AnimatedSection>
            <GlassCard className="p-8">
              <h3 className="text-2xl font-semibold text-white mb-6">
                {siteConfig.author.title}
              </h3>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p>
                  I&apos;m a passionate web developer with over 5 years of experience
                  creating modern, performant, and visually stunning web applications.
                  My expertise lies in React, Next.js, and the entire JavaScript ecosystem.
                </p>
                <p>
                  I specialize in building immersive digital experiences that push the
                  boundaries of what&apos;s possible on the web. From 3D visualizations to
                  complex data dashboards, I love tackling challenging problems.
                </p>
                <p>
                  When I&apos;m not coding, you&apos;ll find me exploring the latest web technologies,
                  contributing to open-source projects, or sharing my knowledge through blog posts.
                </p>
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
            {stats.map((stat, index) => (
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

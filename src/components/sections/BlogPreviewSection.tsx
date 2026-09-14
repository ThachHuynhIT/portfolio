"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedSection, GlassCard, Icon } from "@/components/ui";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useTranslation } from "@/context/LanguageContext";
import type { BlogPost } from "@/lib/types";
import { translateBlogCategory, translateReadTime } from "@/lib/content-overrides";

interface BlogPreviewSectionProps {
  posts: BlogPost[];
}

export default function BlogPreviewSection({ posts }: BlogPreviewSectionProps) {
  const { t, locale } = useTranslation();

  if (!posts || posts.length === 0) return null;

  return (
    <section id="blog" className="relative py-28 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-xs text-purple-400 font-semibold tracking-widest uppercase mb-3 block">
              {t("blogPreview.badge")}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white light:text-neutral-900 mb-4 tracking-tight">
              {t("blogPreview.titlePrefix")}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {t("blogPreview.titleHighlight")}
              </span>
            </h2>
            <p className="text-white/60 light:text-neutral-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {t("blogPreview.subtitle")}
            </p>
          </div>
        </AnimatedSection>

        {/* 3-column Blog Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {posts.map((post) => {
            const title = locale === "vi" && post.title_vi ? post.title_vi : post.title;
            const excerpt = locale === "vi" && post.excerpt_vi ? post.excerpt_vi : post.excerpt;

            return (
              <motion.div key={post.slug} variants={fadeInUp}>
                <Link href={`/blog/${post.slug}`} className="block h-full group">
                  <GlassCard className="h-full p-6 flex flex-col justify-between group-hover:border-purple-500/40 transition-all duration-300">
                    <div>
                      {/* Top metadata */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full light:text-purple-700">
                          {translateBlogCategory(post.category, locale)}
                        </span>
                        <span className="text-xs text-white/40 light:text-neutral-500 font-medium">
                          {translateReadTime(post.readTime, locale, t("blog.minRead"))}
                        </span>
                      </div>

                      {/* Post Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-white light:text-neutral-900 mb-3 group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                        {title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-white/60 light:text-neutral-600 text-xs sm:text-sm mb-6 line-clamp-3 leading-relaxed">
                        {excerpt}
                      </p>
                    </div>

                    <div>
                      {/* Date & Tags */}
                      <div className="flex items-center justify-between text-xs text-white/40 light:text-neutral-500 pt-4 border-t border-white/5 light:border-neutral-900/10 mb-3">
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString(
                            locale === "vi" ? "vi-VN" : "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </time>
                        <span className="text-purple-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold text-xs">
                          {t("blogPreview.readMore")} <Icon name="arrowRight" size={12} />
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] text-white/50 light:text-neutral-500 bg-white/5 light:bg-neutral-900/[0.04] rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All Blog CTA Button */}
        <div className="mt-14 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white light:text-neutral-900 bg-white/[0.06] light:bg-neutral-900/[0.05] hover:bg-white/[0.12] light:hover:bg-neutral-900/[0.08] border border-white/15 light:border-neutral-900/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group"
          >
            <span>{t("blogPreview.viewAll")}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              <Icon name="arrowRight" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import { shootingStarRow } from "@/lib/animations";
import { useTranslation } from "@/context/LanguageContext";
import { pickLocalized, translateReadTime } from "@/lib/content-overrides";
import type { BlogPostListItem } from "@/lib/types";
export default function BlogPreviewSection({ posts }: { posts: BlogPostListItem[] }) {
  const { t, locale } = useTranslation();
  const reduced = useReducedMotion();
  if (!posts.length) return null;
  return <section id="blog" className="portfolio-section"><div className="portfolio-column">
    <div className="text-center mb-10"><SectionHeading>{t("blogPreview.titlePrefix")}{t("blogPreview.titleHighlight")}</SectionHeading></div>
    <ul className="portfolio-solid">{posts.map((post) => <motion.li key={post.slug} variants={reduced ? undefined : shootingStarRow} initial={false} whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-[9rem_1fr_auto] gap-3 py-6 border-b border-portfolio-hairline last:border-0 items-baseline">
      <time dateTime={post.date} className="text-sm text-portfolio-dust">{new Date(post.date).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
      <h3 className="text-xl font-semibold break-words"><Link className="portfolio-text-link" href={`/blog/${post.slug}`}>{pickLocalized(locale, post.title, post.title_vi)}</Link></h3>
      <span className="text-sm text-portfolio-dust">{translateReadTime(post.readTime, locale, t("blog.minRead"))}</span>
    </motion.li>)}</ul>
    <div className="mt-8 text-center"><Link className="portfolio-text-link" href="/blog">{t("blogPreview.viewAll")}</Link></div>
  </div></section>;
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import type { BlogPostListItem } from "@/lib/types";
import { useTranslation } from "@/context/LanguageContext";
import { translateBlogCategory, translateReadTime } from "@/lib/content-overrides";
import { cn } from "@/lib/utils";

interface BlogListProps {
  posts: BlogPostListItem[];
  categories: string[];
}

export default function BlogList({ posts, categories }: BlogListProps) {
  const { t, locale } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () =>
      selectedCategory
        ? posts.filter((post) => post.category === selectedCategory)
        : posts,
    [posts, selectedCategory]
  );

  return <>
    <PageHeader title={<>{t("blog.titlePrefix")}{t("blog.titleHighlight")}</>} intro={t("blog.subtitle")}><span className="text-xs text-portfolio-dust uppercase tracking-widest">{t("blog.badge")}</span></PageHeader>
    {categories.length > 0 && <div className="portfolio-reveal flex flex-wrap gap-2 mb-8">{[null, ...categories].map(category => <button key={category ?? "all"} type="button" onClick={() => setSelectedCategory(category)} aria-pressed={selectedCategory === category} className={cn("min-h-11 px-4 py-2 rounded-lg border bg-portfolio-hull text-sm hover:border-portfolio-accretion focus-visible:outline-2 focus-visible:outline-portfolio-accretion", selectedCategory === category ? "border-portfolio-accretion text-portfolio-accretion" : "border-portfolio-control text-portfolio-dust")}>{category === null ? t("blog.all") : translateBlogCategory(category, locale)}</button>)}</div>}
    {filteredPosts.length > 0 ? <ul className="portfolio-solid">{filteredPosts.map(post => <li key={post.slug} className="portfolio-reveal grid sm:grid-cols-[9rem_minmax(0,1fr)_auto] gap-3 py-6 border-b border-portfolio-hairline last:border-0 items-baseline">
      <time dateTime={post.date} className="text-sm text-portfolio-dust">{new Date(post.date).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
      <h2 className="text-xl font-semibold text-portfolio-ink break-words"><Link className="portfolio-text-link !text-portfolio-ink" href={`/blog/${post.slug}`}>{locale === "vi" && post.title_vi ? post.title_vi : post.title}</Link></h2>
      <span className="text-sm text-portfolio-dust">{translateReadTime(post.readTime, locale, t("blog.minRead"))}</span>
      <div className="sm:col-start-2 sm:col-span-2 min-w-0 text-portfolio-dust">
        <p className="text-sm leading-relaxed mb-3">{locale === "vi" && post.excerpt_vi ? post.excerpt_vi : post.excerpt}</p>
        <div className="flex flex-wrap gap-2 text-xs"><span className="rounded border border-portfolio-hairline bg-portfolio-hull px-2 py-1">{translateBlogCategory(post.category, locale)}</span>{post.tags.slice(0, 3).map(tag => <span key={tag} className="py-1 break-words">#{tag}</span>)}</div>
      </div>
    </li>)}</ul> : <div className="portfolio-solid portfolio-reveal py-16 text-center"><p className="text-portfolio-dust">{!posts.length ? t("blog.empty") : locale === "vi" ? "Chưa có bài viết nào thuộc danh mục này." : "No posts in this category yet."}</p></div>}
  </>;
}

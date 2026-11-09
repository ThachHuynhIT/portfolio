"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { useTranslation } from "@/context/LanguageContext";
import FlagIcon from "@/components/ui/FlagIcon";
import Icon from "@/components/ui/Icon";
import type { BlogPostViewMeta } from "@/lib/blog-list";
import { translateBlogCategory, translateReadTime } from "@/lib/content-overrides";

interface BlogPostViewProps {
  post: BlogPostViewMeta;
  contentEn: React.ReactNode;
  contentVi?: React.ReactNode | null;
}

export default function BlogPostView({ post, contentEn, contentVi }: BlogPostViewProps) {
  const { t, locale } = useTranslation();

  const isVi = locale === "vi";
  const title = isVi && post.title_vi ? post.title_vi : post.title;
  const excerpt = isVi && post.excerpt_vi ? post.excerpt_vi : post.excerpt;
  const renderedContent = isVi && post.hasVi && contentVi ? contentVi : contentEn;

  return <div className="portfolio-page"><section className="portfolio-section"><div className="portfolio-column">
    <div className="portfolio-reading !bg-none mx-auto min-w-0 max-w-[80ch]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Link href="/blog" className="portfolio-text-link inline-flex items-center gap-2"><span aria-hidden="true">←</span>{isVi ? "Quay lại Blog" : "Back to Blog"}</Link>
        <div className="flex flex-wrap items-center gap-2 text-xs text-portfolio-dust bg-portfolio-hull border border-portfolio-hairline rounded-lg px-3 py-2">
          <span>{isVi ? "Ngôn ngữ:" : "Language:"}</span>
          <span className="inline-flex items-center gap-1 text-portfolio-ink"><FlagIcon code={isVi ? "vi" : "en"} size={14} />{isVi ? "Tiếng Việt" : "English"}</span>
          {isVi && !post.hasVi && <span className="text-portfolio-accretion">(Đang hiển thị bản gốc EN)</span>}
        </div>
      </div>
      <PageHeader title={title} intro={excerpt}>
        <div className="flex flex-wrap gap-4 items-center text-sm text-portfolio-dust">
          <span className="rounded border border-portfolio-hairline bg-portfolio-hull px-3 py-1">{translateBlogCategory(post.category, locale)}</span>
          <span>{translateReadTime(post.readTime, locale, t("blog.minRead"))}</span>
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString(isVi ? "vi-VN" : "en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 text-sm text-portfolio-dust">{post.tags.map(tag => <span key={tag} className="rounded border border-portfolio-hairline bg-portfolio-hull px-3 py-1 break-all">#{tag}</span>)}</div>
      </PageHeader>
      <article className="portfolio-article portfolio-solid portfolio-reveal min-w-0 p-5 sm:p-8 md:p-12"><div className="max-w-[68ch] mx-auto min-w-0">{renderedContent}</div></article>
      <div className="portfolio-solid portfolio-reveal mt-12 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-full border border-portfolio-hairline bg-portfolio-hull text-portfolio-accretion flex items-center justify-center"><Icon name="user" size={28} /></div>
          <div className="min-w-0"><h2 className="text-lg font-semibold text-portfolio-ink">Thach Huynh</h2><p className="text-portfolio-dust text-sm">{isVi ? "Lập trình viên Web Sáng tạo chuyên về các trải nghiệm kỹ thuật số sống động và hiện đại." : "Creative Web Developer specializing in immersive digital experiences."}</p></div>
        </div>
      </div>
    </div>
  </div></section></div>;
}

"use client";

import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import FlagIcon from "@/components/ui/FlagIcon";
import Icon from "@/components/ui/Icon";
import type { BlogPost } from "@/lib/types";
import { translateBlogCategory, translateReadTime } from "@/lib/content-overrides";

interface BlogPostViewProps {
  post: BlogPost;
  contentEn: React.ReactNode;
  contentVi?: React.ReactNode | null;
}

export default function BlogPostView({ post, contentEn, contentVi }: BlogPostViewProps) {
  const { t, locale } = useTranslation();

  const isVi = locale === "vi";
  const title = isVi && post.title_vi ? post.title_vi : post.title;
  const excerpt = isVi && post.excerpt_vi ? post.excerpt_vi : post.excerpt;
  const renderedContent = isVi && post.content_vi && contentVi ? contentVi : contentEn;

  return (
    <article className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 max-w-3xl">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors light:text-neutral-600 light:hover:text-neutral-900"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>{isVi ? "Quay lại Blog" : "Back to Blog"}</span>
          </Link>

          {/* Translation Availability Indicator */}
          <div className="flex items-center gap-2 text-xs text-white/50 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/8 light:text-neutral-500 light:bg-neutral-900/[0.04] light:border-neutral-900/10">
            <span className="text-[11px] uppercase tracking-wider text-white/40 light:text-neutral-500">
              {isVi ? "Ngôn ngữ:" : "Language:"}
            </span>
            <span className="inline-flex items-center gap-1 text-white/80 font-medium light:text-neutral-800">
              <FlagIcon code={isVi ? "vi" : "en"} size={14} />
              {isVi ? "Tiếng Việt" : "English"}
            </span>
            {isVi && !post.content_vi && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                (Đang hiển thị bản gốc EN)
              </span>
            )}
          </div>
        </div>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 rounded-full">
              {translateBlogCategory(post.category, locale)}
            </span>
            <span className="text-white/40 text-sm light:text-neutral-500">
              {translateReadTime(post.readTime, locale, t("blog.minRead"))}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white light:text-neutral-900 mb-6">
            {title}
          </h1>

          <p className="text-xl text-white/60 light:text-neutral-600 mb-6">{excerpt}</p>

          <div className="flex items-center gap-4 text-sm text-white/40 light:text-neutral-500">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm text-white/60 bg-white/5 border border-white/10 rounded-full light:text-neutral-600 light:bg-neutral-900/[0.04] light:border-neutral-900/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <GlassCard className="p-8 md:p-12">
          <div className="prose prose-invert max-w-none">
            {renderedContent}
          </div>
        </GlassCard>

        {/* Author */}
        <div className="mt-12">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white">
                <Icon name="user" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white light:text-neutral-900">Thach Huynh</h3>
                <p className="text-white/60 text-sm light:text-neutral-600">
                  {isVi
                    ? "Lập trình viên Web Sáng tạo chuyên về các trải nghiệm kỹ thuật số sống động và hiện đại."
                    : "Creative Web Developer specializing in immersive digital experiences."}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </article>
  );
}

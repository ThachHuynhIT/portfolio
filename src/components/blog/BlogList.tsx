"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { BlogPost } from "@/lib/types";
import { useTranslation } from "@/context/LanguageContext";

interface BlogListProps {
  posts: BlogPost[];
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

  return (
    <>
      {/* Header */}
      <div className="text-center mb-16">
        <span className="text-sm text-purple-500 font-medium tracking-wider uppercase mb-4 block">
          {t("blog.badge")}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white light:text-neutral-900 mb-6">
          {t("blog.titlePrefix")}
          <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
            {t("blog.titleHighlight")}
          </span>
        </h1>
        <p className="text-white/60 light:text-neutral-600 max-w-2xl mx-auto">
          {t("blog.subtitle")}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            aria-pressed={selectedCategory === null}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              selectedCategory === null
                ? "text-white bg-gradient-to-r from-purple-500 to-cyan-500 shadow-md shadow-purple-500/20"
                : "text-white/70 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 light:text-neutral-700 light:bg-neutral-900/[0.04] light:border-neutral-900/10 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.06]"
            }`}
          >
            {t("blog.all")}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                selectedCategory === category
                  ? "text-white bg-gradient-to-r from-purple-500 to-cyan-500 shadow-md shadow-purple-500/20"
                  : "text-white/70 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 light:text-neutral-700 light:bg-neutral-900/[0.04] light:border-neutral-900/10 light:hover:text-neutral-900 light:hover:bg-neutral-900/[0.06]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <GlassCard className="h-full p-6 group cursor-pointer">
                <span className="inline-block px-3 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 rounded-full mb-4">
                  {post.category}
                </span>

                <h2 className="text-xl font-semibold text-white light:text-neutral-900 mb-3 group-hover:text-purple-400 transition-colors">
                  {locale === "vi" && post.title_vi ? post.title_vi : post.title}
                </h2>

                <p className="text-white/60 light:text-neutral-600 text-sm mb-4 line-clamp-2">
                  {locale === "vi" && post.excerpt_vi ? post.excerpt_vi : post.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-white/40 light:text-neutral-500">
                  <span>
                    {new Date(post.date).toLocaleDateString(
                      locale === "vi" ? "vi-VN" : "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                  <span>{post.readTime}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs text-white/50 bg-white/5 rounded light:text-neutral-500 light:bg-neutral-900/[0.04]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-white/60 light:text-neutral-600 text-lg">
            {posts.length === 0
              ? locale === "vi"
                ? "Chưa có bài viết nào. Hãy quay lại sau nhé!"
                : "No blog posts yet. Check back soon!"
              : locale === "vi"
              ? "Chưa có bài viết nào thuộc danh mục này."
              : "No posts in this category yet."}
          </p>
        </div>
      )}
    </>
  );
}

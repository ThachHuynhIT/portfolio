"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { BlogPost } from "@/lib/types";

interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
}

export default function BlogList({ posts, categories }: BlogListProps) {
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
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            aria-pressed={selectedCategory === null}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              selectedCategory === null
                ? "text-white bg-gradient-to-r from-purple-500 to-cyan-500"
                : "text-white/70 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                selectedCategory === category
                  ? "text-white bg-gradient-to-r from-purple-500 to-cyan-500"
                  : "text-white/70 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10"
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

                <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">
                  {post.title}
                </h2>

                <p className="text-white/60 text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>{post.readTime}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs text-white/50 bg-white/5 rounded"
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
          <p className="text-white/60 text-lg">
            {posts.length === 0
              ? "No blog posts yet. Check back soon!"
              : "No posts in this category yet."}
          </p>
        </div>
      )}
    </>
  );
}

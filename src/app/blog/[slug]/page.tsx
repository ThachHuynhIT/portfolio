import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { GlassCard } from "@/components/ui";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | Thach Huynh`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

// Custom MDX components for styling
const mdxComponents = {
  h1: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-bold text-white mt-12 mb-6" {...props} />
  ),
  h2: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className="text-3xl font-bold text-white mt-10 mb-4" {...props} />
  ),
  h3: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className="text-2xl font-semibold text-white mt-8 mb-3" {...props} />
  ),
  p: (props: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="text-white/70 leading-relaxed mb-4" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
      {...props}
    />
  ),
  ul: (props: React.HTMLProps<HTMLUListElement>) => (
    <ul className="list-disc list-inside text-white/70 mb-4 space-y-2" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside text-white/70 mb-4 space-y-2" {...props} />
  ),
  li: (props: React.HTMLProps<HTMLLIElement>) => (
    <li className="text-white/70" {...props} />
  ),
  blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-purple-500 pl-4 italic text-white/60 my-6"
      {...props}
    />
  ),
  code: (props: React.HTMLProps<HTMLElement>) => (
    <code
      className="bg-white/10 text-purple-400 px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props: React.HTMLProps<HTMLPreElement>) => (
    <pre
      className="bg-black/50 border border-white/10 rounded-xl p-4 overflow-x-auto my-6 text-sm"
      {...props}
    />
  ),
  strong: (props: React.HTMLProps<HTMLElement>) => (
    <strong className="font-semibold text-white" {...props} />
  ),
  hr: (props: React.HTMLProps<HTMLHRElement>) => (
    <hr className="border-white/10 my-8" {...props} />
  ),
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 max-w-3xl">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
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
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 rounded-full">
              {post.category}
            </span>
            <span className="text-white/40 text-sm">{post.readTime}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-white/60 mb-6">{post.excerpt}</p>

          <div className="flex items-center gap-4 text-sm text-white/40">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
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
                className="px-3 py-1 text-sm text-white/60 bg-white/5 border border-white/10 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <GlassCard className="p-8 md:p-12">
          <div className="prose prose-invert max-w-none">
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  rehypePlugins: [rehypeHighlight, rehypeSlug],
                },
              }}
            />
          </div>
        </GlassCard>

        {/* Author */}
        <div className="mt-12">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-2xl">
                👨‍💻
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Thach Huynh</h3>
                <p className="text-white/60 text-sm">
                  Creative Web Developer specializing in immersive digital experiences.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </article>
  );
}

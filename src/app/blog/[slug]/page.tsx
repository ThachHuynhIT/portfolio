import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import BlogPostView from "@/components/blog/BlogPostView";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const metadata = buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
  });

  return {
    ...metadata,
    // Merge rather than replace — buildMetadata's openGraph carries fields
    // (siteName, images) that a future post with a cover image would need;
    // overwriting the whole object here would silently drop them. Cast
    // needed because Next's OpenGraph type is a discriminated union keyed
    // on `type`, which TypeScript can't re-narrow through a spread.
    openGraph: {
      ...metadata.openGraph,
      publishedTime: post.date,
      tags: post.tags,
    } as Metadata["openGraph"],
  };
}

// Custom MDX components for styling.
//
// IMPORTANT: className must always be merged via cn(ours, props.className)
// with `className` destructured OUT of `...rest` first. Spreading raw
// `{...props}` AFTER a hardcoded `className` looks harmless, but rehype
// plugins (rehype-highlight in particular) inject their own `className`
// into the AST node's props (e.g. "hljs language-typescript" on <code>) —
// since that key exists in `props`, spreading it after our className
// silently replaces ours instead of merging, leaving the element with
// zero color/background styling. This previously made blog code blocks
// render near-invisible (default/inherited text color on a dark <pre>).
const mdxComponents = {
  h1: ({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
    <h1 className={cn("text-4xl font-bold text-white light:text-neutral-900 mt-12 mb-6", className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className={cn("text-3xl font-bold text-white light:text-neutral-900 mt-10 mb-4", className)} {...props} />
  ),
  h3: ({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className={cn("text-2xl font-semibold text-white light:text-neutral-900 mt-8 mb-3", className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
    <p className={cn("text-white/70 light:text-neutral-600 leading-relaxed mb-4", className)} {...props} />
  ),
  a: ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn("text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: React.HTMLProps<HTMLUListElement>) => (
    <ul className={cn("list-disc list-inside text-white/70 light:text-neutral-600 mb-4 space-y-2", className)} {...props} />
  ),
  ol: ({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("list-decimal list-inside text-white/70 light:text-neutral-600 mb-4 space-y-2", className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLProps<HTMLLIElement>) => (
    <li className={cn("text-white/70 light:text-neutral-600", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote
      className={cn("border-l-4 border-purple-500 pl-4 italic text-white/60 light:text-neutral-600 my-6", className)}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLProps<HTMLElement>) => (
    <code
      className={cn(
        "bg-white/10 text-purple-400 px-1.5 py-0.5 rounded text-sm font-mono light:bg-neutral-900/[0.06]",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.HTMLProps<HTMLPreElement>) => (
    <pre
      className={cn(
        "bg-black/50 border border-white/10 rounded-xl p-4 overflow-x-auto my-6 text-sm text-neutral-200 light:bg-neutral-900 light:border-neutral-800",
        className
      )}
      {...props}
    />
  ),
  strong: ({ className, ...props }: React.HTMLProps<HTMLElement>) => (
    <strong className={cn("font-semibold text-white light:text-neutral-900", className)} {...props} />
  ),
  hr: ({ className, ...props }: React.HTMLProps<HTMLHRElement>) => (
    <hr className={cn("border-white/10 light:border-neutral-900/10 my-8", className)} {...props} />
  ),
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const contentEn = (
    <MDXRemote
      source={post.content}
      components={mdxComponents}
      options={{
        mdxOptions: {
          rehypePlugins: [rehypeHighlight, rehypeSlug],
        },
      }}
    />
  );

  const contentVi = post.content_vi ? (
    <MDXRemote
      source={post.content_vi}
      components={mdxComponents}
      options={{
        mdxOptions: {
          rehypePlugins: [rehypeHighlight, rehypeSlug],
        },
      }}
    />
  ) : null;

  return (
    <BlogPostView
      post={post}
      contentEn={contentEn}
      contentVi={contentVi}
    />
  );
}

import "../blog-article.css";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getPostSummaries } from "@/lib/blog";
import { mdxPolicyRemarkPlugins, validateMdxSource } from "@/lib/mdx-policy";
import BlogPostView from "@/components/blog/BlogPostView";
import { toBlogPostViewMeta } from "@/lib/blog-list";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getPostSummaries();
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
    <h1 className={cn("text-4xl font-bold text-portfolio-ink mt-12 mb-6", className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className={cn("text-3xl font-bold text-portfolio-ink mt-10 mb-4", className)} {...props} />
  ),
  h3: ({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className={cn("text-2xl font-semibold text-portfolio-ink mt-8 mb-3", className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
    <p className={cn("text-portfolio-dust leading-relaxed mb-4", className)} {...props} />
  ),
  a: ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className={cn("portfolio-text-link", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: React.HTMLProps<HTMLUListElement>) => (
    <ul className={cn("list-disc list-inside text-portfolio-dust mb-4 space-y-2", className)} {...props} />
  ),
  ol: ({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("list-decimal list-inside text-portfolio-dust mb-4 space-y-2", className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLProps<HTMLLIElement>) => (
    <li className={cn("text-portfolio-dust", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote
      className={cn("border-l-4 border-portfolio-accretion pl-4 italic text-portfolio-dust my-6", className)}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLProps<HTMLElement>) => (
    <code
      className={cn(
        "bg-portfolio-hull text-portfolio-ink px-1.5 py-0.5 rounded text-sm font-mono",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.HTMLProps<HTMLPreElement>) => (
    <pre
      className={cn(
        "border border-portfolio-hairline rounded-lg p-4 overflow-x-auto max-w-full my-6 text-sm",
        className
      )}
      {...props}
    />
  ),
  strong: ({ className, ...props }: React.HTMLProps<HTMLElement>) => (
    <strong className={cn("font-semibold text-portfolio-ink", className)} {...props} />
  ),
  hr: ({ className, ...props }: React.HTMLProps<HTMLHRElement>) => (
    <hr className={cn("border-portfolio-hairline my-8", className)} {...props} />
  ),
};

/**
 * Applies the MDX policy (no ESM, expressions or JSX; safe URLs only) before
 * compiling. Stored content that breaks the policy is never compiled or run:
 * a neutral notice is shown instead, without any error detail.
 */
async function renderMdxBody(source: string) {
  try {
    await validateMdxSource(source);
  } catch {
    return (
      <p className="text-portfolio-dust leading-relaxed mb-4">
        This content could not be displayed.
      </p>
    );
  }

  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: mdxPolicyRemarkPlugins,
          rehypePlugins: [rehypeHighlight, rehypeSlug],
        },
      }}
    />
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const [contentEn, contentVi] = await Promise.all([
    renderMdxBody(post.content),
    post.content_vi ? renderMdxBody(post.content_vi) : Promise.resolve(null),
  ]);

  return (
    <BlogPostView
      post={toBlogPostViewMeta(post)}
      contentEn={contentEn}
      contentVi={contentVi}
    />
  );
}

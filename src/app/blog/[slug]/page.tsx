import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import BlogPostView from "@/components/blog/BlogPostView";

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
    <h1 className="text-4xl font-bold text-white light:text-neutral-900 mt-12 mb-6" {...props} />
  ),
  h2: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className="text-3xl font-bold text-white light:text-neutral-900 mt-10 mb-4" {...props} />
  ),
  h3: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className="text-2xl font-semibold text-white light:text-neutral-900 mt-8 mb-3" {...props} />
  ),
  p: (props: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="text-white/70 light:text-neutral-600 leading-relaxed mb-4" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
      {...props}
    />
  ),
  ul: (props: React.HTMLProps<HTMLUListElement>) => (
    <ul className="list-disc list-inside text-white/70 light:text-neutral-600 mb-4 space-y-2" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside text-white/70 light:text-neutral-600 mb-4 space-y-2" {...props} />
  ),
  li: (props: React.HTMLProps<HTMLLIElement>) => (
    <li className="text-white/70 light:text-neutral-600" {...props} />
  ),
  blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-purple-500 pl-4 italic text-white/60 light:text-neutral-600 my-6"
      {...props}
    />
  ),
  code: (props: React.HTMLProps<HTMLElement>) => (
    <code
      className="bg-white/10 text-purple-400 px-1.5 py-0.5 rounded text-sm font-mono light:bg-neutral-900/[0.06]"
      {...props}
    />
  ),
  pre: (props: React.HTMLProps<HTMLPreElement>) => (
    <pre
      className="bg-black/50 border border-white/10 rounded-xl p-4 overflow-x-auto my-6 text-sm light:bg-neutral-900 light:border-neutral-800"
      {...props}
    />
  ),
  strong: (props: React.HTMLProps<HTMLElement>) => (
    <strong className="font-semibold text-white light:text-neutral-900" {...props} />
  ),
  hr: (props: React.HTMLProps<HTMLHRElement>) => (
    <hr className="border-white/10 light:border-neutral-900/10 my-8" {...props} />
  ),
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

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

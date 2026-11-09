import { getPostSummaries, getAllCategories } from "@/lib/blog";
import BlogList from "@/components/blog/BlogList";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Thoughts on web development, 3D graphics, and creative coding.",
  path: "/blog",
});

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPostSummaries(), getAllCategories()]);

  return <div className="portfolio-page"><section className="portfolio-section"><div className="portfolio-column"><BlogList posts={posts} categories={categories} /></div></section></div>;
}

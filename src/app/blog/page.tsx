import { getAllPosts, getAllCategories } from "@/lib/blog";
import BlogList from "@/components/blog/BlogList";

export const metadata = {
  title: "Blog | Thach Huynh",
  description: "Thoughts on web development, 3D graphics, and creative coding.",
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategories()]);

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6">
        <BlogList posts={posts} categories={categories} />
      </div>
    </div>
  );
}

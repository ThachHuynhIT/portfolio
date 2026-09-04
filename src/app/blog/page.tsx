import { getAllPosts, getAllCategories } from "@/lib/blog";
import BlogList from "@/components/blog/BlogList";

export const metadata = {
  title: "Blog | Thach Huynh",
  description: "Thoughts on web development, 3D graphics, and creative coding.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm text-purple-500 font-medium tracking-wider uppercase mb-4 block">
            Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Thoughts &{" "}
            <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Insights
            </span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Exploring web development, 3D graphics, and the future of creative coding.
          </p>
        </div>

        <BlogList posts={posts} categories={categories} />
      </div>
    </div>
  );
}

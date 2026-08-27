"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import type { BlogPost } from "@/lib/types";

type BlogMeta = Omit<BlogPost, "content">;

export default function BlogAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BlogMeta | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/blog");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch blog posts:", err);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/blog/${deleteTarget.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      toast.success(`Post "${deleteTarget.title}" deleted successfully!`);
      setDeleteTarget(null);
      fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete post";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="Blog Posts"
        description="Write new MDX posts, edit existing content, or manage post categories."
        icon="blog"
        action={
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
          >
            <span className="text-base leading-none">+</span>
            New Post
          </Link>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Tags</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {posts.map((post) => (
              <tr key={post.slug} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white mb-1">{post.title}</div>
                  <div className="text-xs text-gray-500 font-mono">/blog/{post.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">{post.date}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Link
                    href={`/admin/blog/${post.slug}/edit`}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all inline-block"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(post)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will delete the .mdx file permanently.`}
        confirmLabel="Delete Post"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

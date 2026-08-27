"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import MarkdownPreview from "@/components/admin/MarkdownPreview";
import { useToast } from "@/context/ToastContext";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = params?.slug as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    async function loadPost() {
      if (!slugParam) return;
      try {
        const res = await fetch(`/api/admin/blog/${slugParam}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load post");
        }
        const post = await res.json();
        setTitle(post.title || "");
        setExcerpt(post.excerpt || "");
        setDate(post.date || "");
        setCategory(post.category || "");
        setTags(Array.isArray(post.tags) ? post.tags.join(", ") : "");
        setReadTime(post.readTime || "");
        setContent(post.content || "");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load post");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slugParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/blog/${slugParam}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          date,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          readTime,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update blog post");
      }

      toast.success(`Blog post "${title}" updated successfully!`);
      router.push("/admin/blog");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update blog post";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading post data...</div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title={`Edit: ${title}`}
        description={`Editing /blog/${slugParam}.mdx`}
        icon="blog"
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metadata Form */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Post Metadata (Frontmatter)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Title" id="post-title" required>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label="URL Slug (Read-only)" id="post-slug">
              <input
                id="post-slug"
                type="text"
                value={slugParam}
                disabled
                className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-gray-500 font-mono cursor-not-allowed"
              />
            </FormField>
          </div>

          <FormField label="Excerpt / Summary" id="post-excerpt" required>
            <textarea
              id="post-excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Publish Date" id="post-date" required>
              <input
                id="post-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label="Category" id="post-cat" required>
              <input
                id="post-cat"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label="Tags (comma separated)" id="post-tags">
              <input
                id="post-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>

            <FormField label="Read Time" id="post-time">
              <input
                id="post-time"
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>
          </div>
        </div>

        {/* Content Editor & Preview Tabs */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
            <h2 className="text-lg font-bold text-white">Post Content (MDX)</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "edit"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                ✏️ Edit Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "preview"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                👁️ Live Preview
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <textarea
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          ) : (
            <div className="p-6 bg-gray-950 border border-gray-800 rounded-xl min-h-[400px]">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-purple-500/25 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

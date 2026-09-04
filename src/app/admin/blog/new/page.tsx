"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import MarkdownPreview from "@/components/admin/MarkdownPreview";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { useToast } from "@/context/ToastContext";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("development");
  const [tags, setTags] = useState("React, Next.js");
  const [readTime, setReadTime] = useState("5 min read");
  const [content, setContent] = useState("# Welcome to my new post\n\nWrite your MDX content here...");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === "") {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
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
        throw new Error(data.error || "Failed to create blog post");
      }

      toast.success(`Blog post "${title}" created successfully!`);
      router.push("/admin/blog");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create blog post";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Write New Post"
        description="Create a new MDX blog post with frontmatter metadata and live preview."
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
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Mastering Next.js 14 App Router"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label="URL Slug" id="post-slug" required hint="e.g. mastering-nextjs-14">
              <input
                id="post-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>
          </div>

          <FormField label="Excerpt / Summary" id="post-excerpt" required>
            <textarea
              id="post-excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for card previews and SEO meta description..."
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">Post Content (MDX)</h2>
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-purple-300 hover:text-white rounded-lg text-xs font-medium border border-gray-700 transition-all shadow-sm"
              >
                <span>🖼️</span>
                <span>Chèn ảnh từ Cloud / Upload</span>
              </button>
            </div>
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
            {saving ? "Publishing Post..." : "Publish Post"}
          </button>
        </div>
      </form>

      {/* Image Picker Modal for Blog */}
      <MediaPickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url, asset) => {
          const alt = asset?.filename ? asset.filename.split(".")[0] : "image";
          setContent((prev) => `${prev}\n\n![${alt}](${url})\n\n`);
          toast.success("Đã chèn ảnh vào nội dung bài viết!");
        }}
        title="Chọn ảnh hoặc tải ảnh mới để chèn vào bài viết"
        defaultCategory="blog"
      />
    </div>
  );
}

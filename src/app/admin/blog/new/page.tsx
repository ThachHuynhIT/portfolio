"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFormFooter from "@/components/admin/AdminFormFooter";
import FormField from "@/components/admin/FormField";
import MarkdownPreview from "@/components/admin/MarkdownPreview";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import LanguageTabSelector from "@/components/admin/LanguageTabSelector";
import FlagIcon from "@/components/ui/FlagIcon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/TranslationContext";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [contentLang, setContentLang] = useState<"en" | "vi">("en");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // English content
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("# Welcome to my new post\n\nWrite your MDX content here...");

  // Vietnamese content
  const [title_vi, setTitleVi] = useState("");
  const [excerpt_vi, setExcerptVi] = useState("");
  const [content_vi, setContentVi] = useState("");

  // Shared metadata
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("development");
  const [tags, setTags] = useState("React, Next.js");
  const [readTime, setReadTime] = useState("5 min read");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === "") {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const copyEnglishToVietnamese = () => {
    if (!content_vi && content) {
      setContentVi(content);
      toast.success(t.admin.blog.copyEnToViSuccess);
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
          title_vi,
          slug,
          excerpt,
          excerpt_vi,
          date,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          readTime,
          content,
          content_vi,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create blog post");
      }

      toast.success(t.admin.blog.toastCreated);
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
        title={t.admin.blog.createTitle}
        description={t.admin.blog.createDescription}
        icon="blog"
        closeHref="/admin/blog"
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Multilingual Switcher Header */}
      <LanguageTabSelector
        activeLang={contentLang}
        onChange={setContentLang}
        hasTranslation={{
          en: Boolean(title.trim()),
          vi: Boolean(title_vi.trim()),
        }}
        label={t.admin.blog.contentLangLabel}
        className="mb-6"
      />

      {contentLang === "vi" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-6">
          <FlagIcon code="vi" size={16} />
          <span>{t.admin.blog.viDraftNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metadata Form */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">{t.admin.blog.postMetadata}</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/8">
              <FlagIcon code={contentLang} size={14} />
              {contentLang === "en" ? t.common.english : t.common.vietnamese}
            </span>
          </div>

          {contentLang === "en" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={`${t.admin.blog.titleEn} *`} id="post-title" required>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t.admin.blog.fieldTitlePlaceholder}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <FormField
                label={`${t.admin.blog.sharedUrlSlug} *`}
                id="post-slug"
                required
                hint={t.admin.blog.sharedUrlHint}
              >
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t.admin.blog.titleVi}
                id="post-title-vi"
                helper={t.admin.blog.titleViHelper}
              >
                <input
                  id="post-title-vi"
                  type="text"
                  value={title_vi}
                  onChange={(e) => setTitleVi(e.target.value)}
                  placeholder={title || t.admin.blog.fieldTitlePlaceholder}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </FormField>

              <FormField
                label={`${t.admin.blog.sharedUrlSlug} *`}
                id="post-slug"
                required
                hint={t.admin.blog.sharedUrlHint}
              >
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
          )}

          {contentLang === "en" ? (
            <FormField label={`${t.admin.blog.excerptEn} *`} id="post-excerpt" required>
              <textarea
                id="post-excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={t.admin.blog.fieldExcerptPlaceholder}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>
          ) : (
            <FormField
              label={t.admin.blog.excerptVi}
              id="post-excerpt-vi"
              helper={t.admin.blog.excerptViHelper}
            >
              <textarea
                id="post-excerpt-vi"
                rows={2}
                value={excerpt_vi}
                onChange={(e) => setExcerptVi(e.target.value)}
                placeholder={excerpt || t.admin.blog.fieldExcerptPlaceholder}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-800">
            <FormField label={t.admin.blog.fieldDate} id="post-date" required>
              <input
                id="post-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label={t.admin.blog.fieldCategory} id="post-cat" required>
              <input
                id="post-cat"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                required
              />
            </FormField>

            <FormField label={t.admin.blog.fieldTags} id="post-tags">
              <input
                id="post-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </FormField>

            <FormField label={t.admin.blog.fieldReadTime} id="post-time">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 mb-4 gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FlagIcon code={contentLang} size={18} />
                <h2 className="text-lg font-bold text-white">
                  {contentLang === "en" ? t.admin.blog.contentEnMdx : t.admin.blog.contentViMdx}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-purple-300 hover:text-white rounded-lg text-xs font-medium border border-gray-700 transition-all shadow-sm"
              >
                <span>🖼️</span>
                <span>{t.admin.blog.insertImage}</span>
              </button>
              {contentLang === "vi" && !content_vi && content && (
                <button
                  type="button"
                  onClick={copyEnglishToVietnamese}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium border border-purple-500/30 transition-all"
                >
                  <span>📋</span>
                  <span>{t.admin.blog.copyEnToVi}</span>
                </button>
              )}
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
                ✏️ {t.admin.blog.tabEdit}
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
                👁️ {t.admin.blog.tabPreview}
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <textarea
              rows={18}
              value={contentLang === "en" ? content : content_vi}
              onChange={(e) => {
                if (contentLang === "en") {
                  setContent(e.target.value);
                } else {
                  setContentVi(e.target.value);
                }
              }}
              placeholder={
                contentLang === "en"
                  ? t.admin.blog.contentPlaceholderEn
                  : t.admin.blog.contentPlaceholderVi
              }
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          ) : (
            <div className="p-6 bg-gray-950 border border-gray-800 rounded-xl min-h-[400px]">
              <MarkdownPreview
                content={
                  contentLang === "en"
                    ? content
                    : content_vi || t.admin.blog.noViContentPreview + content
                }
              />
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <AdminFormFooter
          closeHref="/admin/blog"
          closeLabel={t.admin.common.cancel}
          saveLabel={t.admin.blog.createTitle}
          isSaving={saving}
        />
      </form>

      {/* Image Picker Modal for Blog */}
      <MediaPickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url, asset) => {
          const alt = asset?.filename ? asset.filename.split(".")[0] : "image";
          if (contentLang === "en") {
            setContent((prev) => `${prev}\n\n![${alt}](${url})\n\n`);
          } else {
            setContentVi((prev) => `${prev}\n\n![${alt}](${url})\n\n`);
          }
          toast.success(t.admin.blog.imageInserted);
        }}
        title={t.admin.blog.imagePickerTitle}
        defaultCategory="blog"
      />
    </div>
  );
}

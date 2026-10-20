"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FlagIcon from "@/components/ui/FlagIcon";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/TranslationContext";
import type { BlogPost } from "@/lib/types";
import { cn } from "@/lib/utils";
import { gap, radius, text } from "@/lib/design-tokens";

type BlogMeta = Omit<BlogPost, "content">;

export default function BlogAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
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
      toast.error(t.admin.blog.toastLoadFailed);
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
      setPosts((prev) => prev.filter((p) => p.slug !== deleteTarget.slug));
      toast.success(t.admin.blog.toastDeleted);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete post";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">
          {t.admin.blog.loadingPosts}
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title={t.admin.blog.title}
        description={t.admin.blog.description}
        icon="blog"
        action={
          <Link
            href="/admin/blog/new"
            className={cn("inline-flex items-center gap-1.5 px-4 py-2", radius.control, "bg-violet-600 hover:bg-violet-500", text.primaryDark, "text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20")}
          >
            <span className="text-base leading-none">+</span>
            {t.admin.blog.newPost}
          </Link>
        }
      />

      <div className={cn("bg-gray-900 border border-gray-800", radius.card, "overflow-hidden")}>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">{t.admin.blog.colTitle}</th>
              <th className="px-6 py-4">{t.admin.blog.colCategory}</th>
              <th className="px-6 py-4">{t.admin.blog.colDate}</th>
              <th className="px-6 py-4">{t.admin.common.tags}</th>
              <th className="px-6 py-4 text-right">{t.admin.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {posts.map((post) => (
              <tr key={post.slug} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className={cn("flex items-center", gap.tight, "mb-1 flex-wrap")}>
                    <span className={cn("font-semibold", text.primaryDark)}>{post.title}</span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        title={t.common.english}
                      >
                        <FlagIcon code="en" size={12} /> EN
                      </span>
                      {post.title_vi ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          title={`${t.common.vietnamese}: ${post.title_vi}`}
                        >
                          <FlagIcon code="vi" size={12} /> VI
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-500 border border-gray-700/60"
                          title="—"
                        >
                          <FlagIcon code="vi" size={12} /> -
                        </span>
                      )}
                    </span>
                  </div>
                  {post.title_vi && (
                    <div className="text-xs text-slate-400 italic mb-1 flex items-center gap-1">
                      <Icon name="cornerDownRight" size={12} />
                      <span>{post.title_vi}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 font-mono">/blog/{post.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2.5 py-1", radius.pill, "text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20")}>
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
                    className={cn("px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400", radius.chip, "text-xs font-medium transition-all inline-block")}
                  >
                    {t.admin.common.edit}
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(post)}
                    className={cn("px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400", radius.chip, "text-xs font-medium transition-all")}
                  >
                    {t.admin.common.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t.admin.blog.deleteTitle}
        message={t.admin.blog.deleteMessage.replace("{title}", deleteTarget?.title || "")}
        confirmLabel={t.admin.common.delete}
        cancelLabel={t.admin.common.cancel}
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

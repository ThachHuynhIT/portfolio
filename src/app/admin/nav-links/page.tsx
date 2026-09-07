"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FlagIcon from "@/components/ui/FlagIcon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import type { NavLink } from "@/lib/types";

export default function NavLinksAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [links, setLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NavLink | null>(null);

  const [formLabel, setFormLabel] = useState("");
  const [formLabelVi, setFormLabelVi] = useState("");
  const [formHref, setFormHref] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/nav-links");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch nav links:", err);
      toast.error("Failed to load navigation links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openCreateModal = () => {
    setFormLabel("");
    setFormLabelVi("");
    setFormHref("#");
    setFormPublished(true);
    setIsCreating(true);
    setEditingLink(null);
  };

  const openEditModal = (link: NavLink) => {
    setEditingLink(link);
    setFormLabel(link.label);
    setFormLabelVi(link.label_vi || "");
    setFormHref(link.href);
    setFormPublished(link.published !== false);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingLink(null);
  };

  const handleTogglePublish = async (link: NavLink) => {
    const nextPublished = link.published === false ? true : false;
    try {
      const res = await fetch("/api/admin/nav-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, published: nextPublished }),
      });
      if (!res.ok) throw new Error("Failed to toggle publish status");
      toast.success(`"${link.label}" is now ${nextPublished ? "Published" : "Draft"}`);
      fetchLinks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      label: formLabel,
      label_vi: formLabelVi || undefined,
      href: formHref,
      published: formPublished,
    };

    try {
      if (isCreating) {
        const res = await fetch("/api/admin/nav-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create nav link");
        toast.success(`Nav link "${formLabel}" added successfully!`);
      } else if (editingLink) {
        const res = await fetch("/api/admin/nav-links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingLink.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update nav link");
        toast.success(`Nav link "${formLabel}" updated successfully!`);
      }
      closeModal();
      fetchLinks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save nav link";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/nav-links?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete nav link");
      toast.success(`Nav link "${deleteTarget.label}" deleted!`);
      setDeleteTarget(null);
      fetchLinks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete link";
      toast.error(msg);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const reordered = [...links];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setLinks(reordered);

    try {
      const res = await fetch("/api/admin/nav-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered }),
      });
      if (!res.ok) throw new Error("Failed to reorder nav links");
      toast.success("Nav link order updated!");
    } catch {
      toast.error("Error saving new order");
      fetchLinks();
    }
  };

  const filteredLinks = links.filter((link) => {
    if (statusFilter === "published") return link.published !== false;
    if (statusFilter === "draft") return link.published === false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">{t("admin.common.loading", "Loading navigation links...")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={t("admin.navLinks.title", "Navigation Links")}
        description={t("admin.navLinks.description", "Reorder, customize bilingual labels, targets, and visibility of main site navigation links.")}
        icon="nav"
        closeHref="/admin"
        action={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">{t("admin.common.all", "All")} ({links.length})</option>
              <option value="published">{t("admin.common.published", "Published")} ({links.filter((l) => l.published !== false).length})</option>
              <option value="draft">{t("admin.common.draft", "Draft")} ({links.filter((l) => l.published === false).length})</option>
            </select>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20 cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              {t("admin.navLinks.addLink", "Add Link")}
            </button>
          </div>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-4 py-4 text-center w-28">{t("admin.common.order", "Order")}</th>
              <th className="px-6 py-4">{t("admin.navLinks.colLabel", "Labels (EN / VI)")}</th>
              <th className="px-6 py-4">{t("admin.navLinks.colHref", "Target Href")}</th>
              <th className="px-6 py-4">{t("admin.common.status", "Status")}</th>
              <th className="px-6 py-4 text-right">{t("admin.common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLinks.map((link) => {
              const originalIndex = links.findIndex((l) => l.id === link.id);

              return (
                <tr key={link.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-7 text-xs text-slate-400 font-mono font-bold bg-white/5 py-1 px-1.5 rounded-lg border border-white/5">
                        #{originalIndex + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={originalIndex === 0}
                          onClick={() => handleMove(originalIndex, "up")}
                          className="w-6 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-purple-600/30 text-[10px] text-slate-300 hover:text-purple-300 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-slate-500 transition-all active:scale-95 cursor-pointer"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={originalIndex === links.length - 1}
                          onClick={() => handleMove(originalIndex, "down")}
                          className="w-6 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-purple-600/30 text-[10px] text-slate-300 hover:text-purple-300 disabled:opacity-20 disabled:hover:bg-white/5 disabled:hover:text-slate-500 transition-all active:scale-95 cursor-pointer"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Bilingual Labels */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <FlagIcon locale="en" width={14} height={9} />
                        <span>{link.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-purple-300/80">
                        <FlagIcon locale="vi" width={14} height={9} />
                        <span>
                          {link.label_vi || (
                            <span className="text-slate-500 italic text-[11px]">Chưa có tiếng Việt</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-xs text-cyan-400">{link.href}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(link)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        link.published !== false
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                      }`}
                      title={t("admin.common.status", "Click to toggle status")}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${link.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                      {link.published !== false ? t("admin.common.published", "Published") : t("admin.common.draft", "Draft")}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(link)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    >
                      {t("admin.common.edit", "Edit")}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(link)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    >
                      {t("admin.common.delete", "Delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      <AdminModal
        isOpen={isCreating || !!editingLink}
        onClose={closeModal}
        title={isCreating ? t("admin.navLinks.modalCreateTitle", "Add Nav Link") : t("admin.navLinks.modalEditTitle", "Edit Nav Link")}
        subtitle={
          isCreating
            ? t("admin.navLinks.description", "Configure bilingual link label, URL/anchor target, and header visibility.")
            : `Editing "${editingLink?.label}".`
        }
        icon="nav"
        onSubmit={handleSave}
        saveLabel={isCreating ? t("admin.common.create", "Save Link") : t("admin.common.save", "Save Changes")}
        closeLabel={t("admin.common.close", "Close")}
        isSaving={isSaving}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <FormField label={t("admin.navLinks.fieldLabelEn", "Menu Label (English / Default)")} id="nav-label" required>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none">
                <FlagIcon locale="en" width={16} height={11} />
              </div>
              <input
                id="nav-label"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder={t("admin.navLinks.fieldLabelEnPlaceholder", "e.g. Projects")}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                required
              />
            </div>
          </FormField>

          <FormField label={t("admin.navLinks.fieldLabelVi", "Nhãn Menu (Tiếng Việt)")} id="nav-label-vi">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none">
                <FlagIcon locale="vi" width={16} height={11} />
              </div>
              <input
                id="nav-label-vi"
                type="text"
                value={formLabelVi}
                onChange={(e) => setFormLabelVi(e.target.value)}
                placeholder={t("admin.navLinks.fieldLabelViPlaceholder", "Ví dụ: Dự án")}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </FormField>

          <FormField label={t("admin.navLinks.fieldHref", "Target Href")} id="nav-href" required>
            <input
              id="nav-href"
              type="text"
              value={formHref}
              onChange={(e) => setFormHref(e.target.value)}
              placeholder={t("admin.navLinks.fieldHrefPlaceholder", "#projects, /blog, /music, etc.")}
              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm font-mono"
              required
            />
          </FormField>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={formPublished}
                onChange={(e) => setFormPublished(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-500"
              />
              {t("admin.navLinks.fieldPublished", "Show in Header / Navigation bar")}
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t("admin.navLinks.deleteTitle", "Delete Navigation Link")}
        message={t("admin.navLinks.deleteMessage", `Are you sure you want to delete "${deleteTarget?.label}"?`)}
        confirmLabel={t("admin.common.delete", "Delete Link")}
        cancelLabel={t("admin.common.cancel", "Cancel")}
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import IconPickerModal from "@/components/admin/IconPickerModal";
import Icon, { isKnownIconName } from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import type { SocialLink } from "@/lib/types";

export default function SocialLinksAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);

  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formIcon, setFormIcon] = useState("github");
  const [formPublished, setFormPublished] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/social-links");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch social links:", err);
      toast.error("Failed to load social links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openCreateModal = () => {
    setFormName("");
    setFormUrl("https://");
    setFormIcon("github");
    setFormPublished(true);
    setIsCreating(true);
    setEditingLink(null);
  };

  const openEditModal = (link: SocialLink) => {
    setEditingLink(link);
    setFormName(link.name);
    setFormUrl(link.url);
    setFormIcon(link.icon);
    setFormPublished(link.published !== false);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingLink(null);
  };

  const handleTogglePublish = async (link: SocialLink) => {
    const nextPublished = link.published === false ? true : false;
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, published: nextPublished }),
      });
      if (!res.ok) throw new Error("Failed to toggle publish status");
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, published: nextPublished } : l)));
      toast.success(`"${link.name}" is now ${nextPublished ? "Published" : "Draft"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      name: formName,
      url: formUrl,
      icon: formIcon,
      published: formPublished,
    };

    try {
      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/social-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create social link");
        const created: SocialLink = await res.json();
        setLinks((prev) => [...prev, created]);
        toast.success(`Social link "${formName}" added successfully!`);
      } else if (editingLink) {
        res = await fetch("/api/admin/social-links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingLink.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update social link");
        const updated: SocialLink = await res.json();
        setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        toast.success(`Social link "${formName}" updated successfully!`);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save social link";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/social-links?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete social link");
      setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      toast.success(`Social link "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete social link";
      toast.error(msg);
    }
  };

  const filteredLinks = links.filter((l) => {
    if (statusFilter === "published") return l.published !== false;
    if (statusFilter === "draft") return l.published === false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">{t("admin.common.loading", "Loading social links...")}</div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title={t("admin.socialLinks.title", "Social Links")}
        description={t("admin.socialLinks.description", "Manage your social media profiles and links.")}
        icon="links"
        action={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">{t("admin.common.all", "All Links")} ({links.length})</option>
              <option value="published">{t("admin.common.published", "Published")} ({links.filter((l) => l.published !== false).length})</option>
              <option value="draft">{t("admin.common.draft", "Draft")} ({links.filter((l) => l.published === false).length})</option>
            </select>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
            >
              <span className="text-base leading-none">+</span>
              {t("admin.socialLinks.addLink", "Add Link")}
            </button>
          </div>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">{t("admin.socialLinks.fieldName", "Platform Name")}</th>
              <th className="px-6 py-4">{t("admin.socialLinks.fieldIcon", "Icon Identifier")}</th>
              <th className="px-6 py-4">{t("admin.socialLinks.fieldUrl", "URL")}</th>
              <th className="px-6 py-4">{t("admin.common.status", "Status")}</th>
              <th className="px-6 py-4 text-right">{t("admin.common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLinks.map((link) => (
              <tr key={link.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-white">{link.name}</td>
                <td className="px-6 py-4">
                  {link.icon && (link.icon.startsWith("http") || link.icon.startsWith("/")) ? (
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center">
                      <img src={link.icon} alt={link.name} className="w-full h-full object-contain rounded-full" />
                    </div>
                  ) : isKnownIconName(link.icon) ? (
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      <Icon name={link.icon} size={16} />
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-purple-400 font-semibold">{link.icon}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{link.url}</td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(link)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
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
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all"
                  >
                    {t("admin.common.edit", "Edit")}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(link)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all"
                  >
                    {t("admin.common.delete", "Delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      <AdminModal
        isOpen={isCreating || !!editingLink}
        onClose={closeModal}
        title={isCreating ? t("admin.socialLinks.modalCreateTitle", "Add Social Link") : t("admin.socialLinks.modalEditTitle", "Edit Social Link")}
        subtitle={
          isCreating
            ? t("admin.socialLinks.description", "Configure social link platform name, icon, and external destination URL.")
            : `Editing "${editingLink?.name}".`
        }
        icon="links"
        onSubmit={handleSave}
        saveLabel={isCreating ? t("admin.common.create", "Save Link") : t("admin.common.save", "Save Changes")}
        closeLabel={t("admin.common.close", "Close")}
        isSaving={isSaving}
        maxWidth="max-w-xl"
      >
        <FormField label={t("admin.socialLinks.fieldName", "Platform Name")} id="social-name" required>
          <input
            id="social-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={t("admin.socialLinks.fieldNamePlaceholder", "GitHub, LinkedIn, Twitter, Facebook...")}
            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            required
          />
        </FormField>

        <div className="space-y-1.5">
          <MediaImagePicker
            label={t("admin.socialLinks.fieldIcon", "Icon / Logo")}
            value={formIcon}
            onChange={setFormIcon}
            category="general"
            subType="social"
            required
            helperText="Choose an icon from Cloud, upload a custom logo, or pick a platform logo below."
          />
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsIconPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              <Icon name="sparkles" size={13} />
              Chọn logo mạng xã hội có sẵn
            </button>
            {formIcon && !formIcon.startsWith("http") && !formIcon.startsWith("/") && (
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                {isKnownIconName(formIcon) ? (
                  <Icon name={formIcon} size={16} />
                ) : (
                  <span className="font-mono text-[10px] text-purple-400">{formIcon}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <FormField label={t("admin.socialLinks.fieldUrl", "URL")} id="social-url" required>
          <input
            id="social-url"
            type="url"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder={t("admin.socialLinks.fieldUrlPlaceholder", "https://...")}
            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            required
          />
        </FormField>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="social-published"
            checked={formPublished}
            onChange={(e) => setFormPublished(e.target.checked)}
            className="rounded border-white/20 bg-slate-950 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="social-published" className="text-sm text-gray-200 cursor-pointer">
            {t("admin.socialLinks.fieldPublished", "Published (Visible publicly on website)")}
          </label>
        </div>
      </AdminModal>

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        value={formIcon}
        onSelect={setFormIcon}
        categories={["social"]}
        title="Chọn logo mạng xã hội"
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t("admin.socialLinks.deleteTitle", "Delete Social Link")}
        message={t("admin.socialLinks.deleteMessage", `Are you sure you want to delete "${deleteTarget?.name}"?`).replace("{name}", deleteTarget?.name || "")}
        confirmLabel={t("admin.common.delete", "Delete")}
        cancelLabel={t("admin.common.cancel", "Cancel")}
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

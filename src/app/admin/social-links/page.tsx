"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import { useToast } from "@/context/ToastContext";
import type { SocialLink } from "@/lib/types";

export default function SocialLinksAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
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
      toast.success(`"${link.name}" is now ${nextPublished ? "Published" : "Draft"}`);
      fetchLinks();
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
        toast.success(`Social link "${formName}" added successfully!`);
      } else if (editingLink) {
        res = await fetch("/api/admin/social-links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingLink.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update social link");
        toast.success(`Social link "${formName}" updated successfully!`);
      }
      closeModal();
      fetchLinks();
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
      toast.success(`Social link "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      fetchLinks();
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
        <div className="text-purple-400 animate-pulse font-medium">Loading social links...</div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Social Links"
        description="Manage your social media profiles and links."
        icon="links"
        action={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Links ({links.length})</option>
              <option value="published">Published ({links.filter((l) => l.published !== false).length})</option>
              <option value="draft">Draft ({links.filter((l) => l.published === false).length})</option>
            </select>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
            >
              <span className="text-base leading-none">+</span>
              Add Link
            </button>
          </div>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Platform Name</th>
              <th className="px-6 py-4">Icon Identifier</th>
              <th className="px-6 py-4">URL</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
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
                    title="Click to toggle status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${link.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    {link.published !== false ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(link)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(link)}
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

      {/* Modal for Create/Edit */}
      <AdminModal
        isOpen={isCreating || !!editingLink}
        onClose={closeModal}
        title={isCreating ? "Add Social Link" : "Edit Social Link"}
        subtitle={
          isCreating
            ? "Configure social link platform name, icon, and external destination URL."
            : `Editing "${editingLink?.name}".`
        }
        icon="links"
        onSubmit={handleSave}
        saveLabel={isCreating ? "Save Link" : "Save Changes"}
        closeLabel="Close"
        isSaving={isSaving}
        maxWidth="max-w-xl"
      >
        <FormField label="Platform Name" id="social-name" required>
          <input
            id="social-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="GitHub, LinkedIn, Twitter, Facebook..."
            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            required
          />
        </FormField>

        <div className="space-y-1.5">
          <MediaImagePicker
            label="Icon / Logo"
            value={formIcon}
            onChange={setFormIcon}
            category="general"
            subType="social"
            required
            helperText="Choose an icon from Cloud, upload a custom logo, or pick a preset keyword below."
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 mr-1">Suggested presets:</span>
            {["github", "linkedin", "twitter", "facebook", "youtube", "instagram", "discord", "telegram"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFormIcon(key);
                }}
                className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                  formIcon === key
                    ? "bg-purple-600 text-white border-purple-500 font-semibold"
                    : "bg-slate-950 text-gray-400 border-white/10 hover:text-white"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <FormField label="URL" id="social-url" required>
          <input
            id="social-url"
            type="url"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
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
            Published (Visible publicly on website)
          </label>
        </div>
      </AdminModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Social Link"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

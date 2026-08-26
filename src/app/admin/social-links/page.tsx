"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { SocialLink } from "@/lib/types";

export default function SocialLinksAdminPage() {
  const router = useRouter();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);

  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formIcon, setFormIcon] = useState("github");

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
    setIsCreating(true);
    setEditingLink(null);
  };

  const openEditModal = (link: SocialLink) => {
    setEditingLink(link);
    setFormName(link.name);
    setFormUrl(link.url);
    setFormIcon(link.icon);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingLink(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formName,
      url: formUrl,
      icon: formIcon,
    };

    if (isCreating) {
      await fetch("/api/admin/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else if (editingLink) {
      await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingLink.id, ...payload }),
      });
    }

    closeModal();
    fetchLinks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await fetch(`/api/admin/social-links?id=${deleteTarget.id}`, {
      method: "DELETE",
    });

    setDeleteTarget(null);
    fetchLinks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading social links...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <AdminHeader
        title="Social Links"
        description="Manage your social media profiles and links."
        icon="links"
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
          >
            <span className="text-base leading-none">+</span>
            Add Link
          </button>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-w-3xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Platform Name</th>
              <th className="px-6 py-4">Icon Identifier</th>
              <th className="px-6 py-4">URL</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-white">{link.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-purple-400">{link.icon}</td>
                <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{link.url}</td>
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

      {(isCreating || editingLink) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {isCreating ? "Add Social Link" : "Edit Social Link"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <FormField label="Platform Name" id="social-name" required>
                <input
                  id="social-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="GitHub, LinkedIn, Twitter..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <FormField label="Icon Key" id="social-icon" required hint="Used by Footer SVG renderer (github, linkedin, twitter)">
                <input
                  id="social-icon"
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <FormField label="URL" id="social-url" required>
                <input
                  id="social-url"
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Social Link"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

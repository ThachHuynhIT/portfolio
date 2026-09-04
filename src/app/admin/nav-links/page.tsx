"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import type { NavLink } from "@/lib/types";

export default function NavLinksAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [links, setLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NavLink | null>(null);

  const [formLabel, setFormLabel] = useState("");
  const [formHref, setFormHref] = useState("");

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
    setFormHref("#");
    setIsCreating(true);
    setEditingLink(null);
  };

  const openEditModal = (link: NavLink) => {
    setEditingLink(link);
    setFormLabel(link.label);
    setFormHref(link.href);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingLink(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      label: formLabel,
      href: formHref,
    };

    try {
      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/nav-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create nav link");
        toast.success(`Nav link "${formLabel}" added successfully!`);
      } else if (editingLink) {
        res = await fetch("/api/admin/nav-links", {
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
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/nav-links?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete nav link");
      toast.success(`Nav link "${deleteTarget.label}" deleted successfully!`);
      setDeleteTarget(null);
      fetchLinks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete nav link";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading navigation links...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <AdminHeader
        title="Navigation Links"
        description="Edit navbar items and anchor links displayed in the site header."
        icon="nav"
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
              <th className="px-6 py-4">Label</th>
              <th className="px-6 py-4">Target Href</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-white">{link.label}</td>
                <td className="px-6 py-4 font-mono text-xs text-cyan-400">{link.href}</td>
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
          <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {isCreating ? "Add Nav Link" : "Edit Nav Link"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <FormField label="Link Label" id="nav-label" required>
                <input
                  id="nav-label"
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Home, Projects, Blog..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <FormField label="Target Href" id="nav-href" required hint="e.g. #projects or /blog">
                <input
                  id="nav-href"
                  type="text"
                  value={formHref}
                  onChange={(e) => setFormHref(e.target.value)}
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
        title="Delete Nav Link"
        message={`Are you sure you want to delete "${deleteTarget?.label}"?`}
        confirmLabel="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

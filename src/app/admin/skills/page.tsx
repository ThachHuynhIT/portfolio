"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import type { Skill } from "@/lib/types";

export default function SkillsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);

  // Form fields state
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formCategory, setFormCategory] = useState<Skill["category"]>("frontend");
  const [formLevel, setFormLevel] = useState(90);

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/admin/skills");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      toast.error("Failed to load skills list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const openCreateModal = () => {
    setFormName("");
    setFormIcon("⚛️");
    setFormCategory("frontend");
    setFormLevel(85);
    setIsCreating(true);
    setEditingSkill(null);
  };

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormIcon(skill.icon);
    setFormCategory(skill.category);
    setFormLevel(skill.level);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingSkill(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formName,
      icon: formIcon,
      category: formCategory,
      level: formLevel,
    };

    try {
      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create skill");
        toast.success(`Skill "${formName}" added successfully!`);
      } else if (editingSkill) {
        res = await fetch("/api/admin/skills", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSkill.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update skill");
        toast.success(`Skill "${formName}" updated successfully!`);
      }
      closeModal();
      fetchSkills();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save skill";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/skills?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete skill");
      toast.success(`Skill "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      fetchSkills();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete skill";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title="Skills"
        description="Manage technologies and proficiency levels displayed in your portfolio."
        icon="skills"
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
          >
            <span className="text-base leading-none">+</span>
            Add Skill
          </button>
        }
      />

      {/* Skills Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Icon</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {skills.map((skill) => (
              <tr key={skill.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 text-2xl">{skill.icon}</td>
                <td className="px-6 py-4 font-semibold text-white">{skill.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 uppercase">
                    {skill.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{skill.level}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(skill)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(skill)}
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
      {(isCreating || editingSkill) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {isCreating ? "Add New Skill" : "Edit Skill"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <FormField label="Skill Name" id="skill-name" required>
                <input
                  id="skill-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Icon Emoji / Char" id="skill-icon" required>
                  <input
                    id="skill-icon"
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </FormField>

                <FormField label="Category" id="skill-category" required>
                  <select
                    id="skill-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Skill["category"])}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="tools">Tools</option>
                    <option value="design">Design</option>
                  </select>
                </FormField>
              </div>

              <FormField label={`Proficiency Level (${formLevel}%)`} id="skill-level" required>
                <input
                  id="skill-level"
                  type="range"
                  min={1}
                  max={100}
                  value={formLevel}
                  onChange={(e) => setFormLevel(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
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
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Skill"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

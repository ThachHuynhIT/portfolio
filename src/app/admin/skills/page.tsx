"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import type { Skill } from "@/lib/types";

export default function SkillsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);

  // Form fields state
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formCategory, setFormCategory] = useState<Skill["category"]>("frontend");
  const [formLevel, setFormLevel] = useState(90);
  const [formPublished, setFormPublished] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

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
    setFormPublished(true);
    setIsCreating(true);
    setEditingSkill(null);
  };

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormIcon(skill.icon);
    setFormCategory(skill.category);
    setFormLevel(skill.level);
    setFormPublished(skill.published !== false);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingSkill(null);
  };

  const handleTogglePublish = async (skill: Skill) => {
    const nextPublished = skill.published === false ? true : false;
    try {
      const res = await fetch("/api/admin/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skill.id, published: nextPublished }),
      });
      if (!res.ok) throw new Error("Failed to toggle publish status");
      toast.success(`"${skill.name}" is now ${nextPublished ? "Published" : "Draft"}`);
      fetchSkills();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      name: formName,
      icon: formIcon,
      category: formCategory,
      level: formLevel,
      published: formPublished,
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
    } finally {
      setIsSaving(false);
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

  const filteredSkills = skills.filter((s) => {
    if (statusFilter === "published") return s.published !== false;
    if (statusFilter === "draft") return s.published === false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">{t("admin.common.loading", "Loading skills...")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <AdminHeader
        title={t("admin.skills.title", "Skills & Tech Stack")}
        description={t("admin.skills.description", "Manage technologies and proficiency levels displayed in your portfolio.")}
        icon="skills"
        action={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">{t("admin.skills.allCategories", "All Skills")} ({skills.length})</option>
              <option value="published">{t("admin.common.published", "Published")} ({skills.filter((s) => s.published !== false).length})</option>
              <option value="draft">{t("admin.common.draft", "Draft")} ({skills.filter((s) => s.published === false).length})</option>
            </select>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
            >
              <span className="text-base leading-none">+</span>
              {t("admin.skills.addSkill", "Add Skill")}
            </button>
          </div>
        }
      />

      {/* Skills Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950 text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">{t("admin.skills.colSkill", "SKILL & ICON")}</th>
              <th className="px-6 py-4">{t("admin.common.name", "NAME")}</th>
              <th className="px-6 py-4">{t("admin.skills.colCategory", "CATEGORY")}</th>
              <th className="px-6 py-4">{t("admin.skills.colProficiency", "PROFICIENCY")}</th>
              <th className="px-6 py-4">{t("admin.skills.colStatus", "STATUS")}</th>
              <th className="px-6 py-4 text-right">{t("admin.skills.colActions", "ACTIONS")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredSkills.map((skill) => (
              <tr key={skill.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  {skill.icon && (skill.icon.startsWith("http") || skill.icon.startsWith("/")) ? (
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center">
                      <img src={skill.icon} alt={skill.name} className="w-full h-full object-contain rounded" />
                    </div>
                  ) : (
                    <span className="text-2xl">{skill.icon || "⚡"}</span>
                  )}
                </td>
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
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(skill)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                      skill.published !== false
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                    title={t("admin.common.status", "Click to toggle status")}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${skill.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    {skill.published !== false ? t("admin.common.published", "Published") : t("admin.common.draft", "Draft")}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(skill)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all"
                  >
                    {t("admin.common.edit", "Edit")}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(skill)}
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
        isOpen={isCreating || !!editingSkill}
        onClose={closeModal}
        title={isCreating ? t("admin.skills.modalCreateTitle", "Add New Skill") : t("admin.skills.modalEditTitle", "Edit Skill")}
        subtitle={
          isCreating
            ? t("admin.skills.description", "Configure skill title, category, proficiency level, and icon.")
            : `Updating "${editingSkill?.name}".`
        }
        icon="skills"
        onSubmit={handleSave}
        saveLabel={isCreating ? t("admin.common.create", "Save Skill") : t("admin.common.save", "Save Changes")}
        closeLabel={t("admin.common.close", "Close")}
        isSaving={isSaving}
        maxWidth="max-w-xl"
      >
        <FormField label={t("admin.skills.fieldName", "Skill Name")} id="skill-name" required>
          <input
            id="skill-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={t("admin.skills.fieldNamePlaceholder", "e.g. Next.js, TypeScript")}
            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
            required
          />
        </FormField>

        <MediaImagePicker
          label={t("admin.skills.fieldIcon", "Skill Icon / Image")}
          value={formIcon}
          onChange={setFormIcon}
          category="general"
          subType="skill"
          required
          helperText="Select a logo from Cloud, upload a new image, or paste an image URL / Emoji (⚛️, ▲, 📘...)."
        />

        <FormField label={t("admin.skills.fieldCategory", "Category")} id="skill-category" required>
          <select
            id="skill-category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as Skill["category"])}
            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="tools">Tools</option>
            <option value="design">Design</option>
          </select>
        </FormField>

        <FormField label={`${t("admin.skills.fieldLevel", "Proficiency Level")} (${formLevel}%)`} id="skill-level" required>
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

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="skill-published"
            checked={formPublished}
            onChange={(e) => setFormPublished(e.target.checked)}
            className="rounded border-white/20 bg-slate-950 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="skill-published" className="text-sm text-gray-200 cursor-pointer">
            {t("admin.skills.fieldPublished", "Published (Visible on portfolio)")}
          </label>
        </div>
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t("admin.skills.deleteTitle", "Delete Skill")}
        message={t("admin.skills.deleteMessage", `Are you sure you want to delete "${deleteTarget?.name}"?`).replace("{name}", deleteTarget?.name || "")}
        confirmLabel={t("admin.common.delete", "Delete")}
        cancelLabel={t("admin.common.cancel", "Cancel")}
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

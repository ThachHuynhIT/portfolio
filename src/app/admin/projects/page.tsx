"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import LanguageTabSelector from "@/components/admin/LanguageTabSelector";
import FlagIcon from "@/components/ui/FlagIcon";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/LanguageContext";
import type { Project } from "@/lib/types";

export default function ProjectsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // Multilingual Form State
  const [activeLang, setActiveLang] = useState<"en" | "vi">("en");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLongDesc, setFormLongDesc] = useState("");

  const [formTitleVi, setFormTitleVi] = useState("");
  const [formDescVi, setFormDescVi] = useState("");
  const [formLongDescVi, setFormLongDescVi] = useState("");

  // Shared Form State
  const [formImage, setFormImage] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formLiveUrl, setFormLiveUrl] = useState("");
  const [formGithubUrl, setFormGithubUrl] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPublished, setFormPublished] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      toast.error("Failed to load projects list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setActiveLang("en");
    setFormTitle("");
    setFormDesc("");
    setFormLongDesc("");
    setFormTitleVi("");
    setFormDescVi("");
    setFormLongDescVi("");
    setFormImage("/projects/dashboard.jpg");
    setFormTags("Next.js, TypeScript, React");
    setFormLiveUrl("");
    setFormGithubUrl("");
    setFormFeatured(false);
    setFormPublished(true);
    setIsCreating(true);
    setEditingProject(null);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setActiveLang("en");
    setFormTitle(project.title);
    setFormDesc(project.description);
    setFormLongDesc(project.longDescription || "");
    setFormTitleVi(project.title_vi || "");
    setFormDescVi(project.description_vi || "");
    setFormLongDescVi(project.longDescription_vi || "");
    setFormImage(project.image);
    setFormTags(project.tags.join(", "));
    setFormLiveUrl(project.liveUrl || "");
    setFormGithubUrl(project.githubUrl || "");
    setFormFeatured(!!project.featured);
    setFormPublished(project.published !== false);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingProject(null);
  };

  const handleTogglePublish = async (project: Project) => {
    const nextPublished = project.published === false ? true : false;
    try {
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, published: nextPublished }),
      });
      if (!res.ok) throw new Error("Failed to toggle publish status");
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, published: nextPublished } : p)));
      toast.success(`"${project.title}" is now ${nextPublished ? "Published" : "Draft"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      title: formTitle,
      description: formDesc,
      longDescription: formLongDesc,
      title_vi: formTitleVi || undefined,
      description_vi: formDescVi || undefined,
      longDescription_vi: formLongDescVi || undefined,
      image: formImage,
      tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
      liveUrl: formLiveUrl,
      githubUrl: formGithubUrl,
      featured: formFeatured,
      published: formPublished,
    };

    try {
      if (isCreating) {
        const res = await fetch("/api/admin/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create project");
        const created: Project = await res.json();
        setProjects((prev) => [...prev, created]);
        toast.success(`Project "${formTitle}" added successfully!`);
      } else if (editingProject) {
        const res = await fetch("/api/admin/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProject.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update project");
        const updated: Project = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(`Project "${formTitle}" updated successfully!`);
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save project";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/projects?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(`Project "${deleteTarget.title}" deleted!`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(msg);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === "published") return p.published !== false;
    if (statusFilter === "draft") return p.published === false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-purple-400 animate-pulse font-medium">Loading projects...</div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title={t("admin.projects.title", "Projects Showcase")}
        description={t("admin.projects.description", "Manage your portfolio showcase items, tech stack tags, and links.")}
        icon="projects"
        closeHref="/admin"
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
          >
            <span>+ {t("admin.projects.addProject", "Add Project")}</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["all", "published", "draft"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === filter
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {filter === "all" ? t("admin.common.all", "All Projects") : (filter === "published" ? t("admin.common.published", "Published") : t("admin.common.draft", "Draft"))} (
            {filter === "all"
              ? projects.length
              : projects.filter((p) => (filter === "published" ? p.published !== false : p.published === false)).length}
            )
          </button>
        ))}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between p-5 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all group"
          >
            <div>
              <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4 bg-gray-800">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{project.title}</h3>
                  {project.title_vi && (
                    <p className="text-xs text-purple-300/80 font-medium">🇻🇳 {project.title_vi}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Language Badges (WordPress-style) */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[11px]">
                    <FlagIcon locale="en" width={14} height={9} />
                    <span className="text-slate-300 font-mono text-[10px]">EN</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border transition-colors ${
                      project.title_vi
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-white/5 text-slate-500 border-white/5 opacity-50"
                    }`}
                    title={project.title_vi ? "Đã có bản dịch Tiếng Việt" : "Chưa có bản dịch Tiếng Việt"}
                  >
                    <FlagIcon locale="vi" width={14} height={9} />
                    <span className="font-mono text-[10px] inline-flex items-center gap-0.5">
                      VI {project.title_vi && <Icon name="check" size={9} />}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTogglePublish(project)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      project.published !== false
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                    title={t("admin.common.status", "Click to toggle status")}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        project.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                      }`}
                    />
                    {project.published !== false ? t("admin.common.published", "Published") : t("admin.common.draft", "Draft")}
                  </button>

                  {project.featured && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {t("admin.common.featured", "Featured")}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex gap-3 text-xs text-gray-500">
                {project.liveUrl && (
                  <span className="inline-flex items-center gap-1">
                    Demo <Icon name="checkCircle" size={11} className="text-emerald-400" />
                  </span>
                )}
                {project.githubUrl && (
                  <span className="inline-flex items-center gap-1">
                    GitHub <Icon name="checkCircle" size={11} className="text-emerald-400" />
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(project)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  {t("admin.common.edit", "Edit")}
                </button>
                <button
                  onClick={() => setDeleteTarget(project)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all cursor-pointer"
                >
                  {t("admin.common.delete", "Delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit */}
      <AdminModal
        isOpen={isCreating || !!editingProject}
        onClose={closeModal}
        title={isCreating ? t("admin.projects.modalCreateTitle", "Add New Project") : t("admin.projects.modalEditTitle", "Edit Project")}
        subtitle={
          isCreating
            ? t("admin.projects.description", "Fill in bilingual project details, tech stack, and URLs to feature in your portfolio.")
            : `Editing "${editingProject?.title}".`
        }
        icon="projects"
        onSubmit={handleSave}
        saveLabel={isCreating ? t("admin.common.create", "Save Project") : t("admin.common.save", "Save Changes")}
        closeLabel={t("admin.common.close", "Close")}
        isSaving={isSaving}
        maxWidth="max-w-2xl"
      >
        {/* WordPress-style Language Tab Switcher */}
        <LanguageTabSelector
          activeLang={activeLang}
          onChange={setActiveLang}
          hasTranslation={{
            en: !!formTitle,
            vi: !!formTitleVi,
          }}
          label="Translate Project / Dịch thông tin dự án:"
        />

        {/* English Content Tab */}
        {activeLang === "en" && (
          <div className="space-y-4 p-4 rounded-xl bg-slate-900/40 border border-white/5 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FlagIcon locale="en" width={16} height={11} />
              <span>English Content</span>
            </div>

            <FormField label={`${t("admin.projects.fieldTitle", "Project Title")} (English)`} id="proj-title-en" required>
              <input
                id="proj-title-en"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. AI-Powered Dashboard"
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                required
              />
            </FormField>

            <FormField label={`${t("admin.projects.fieldShortDesc", "Short Description")} (English)`} id="proj-desc-en" required>
              <textarea
                id="proj-desc-en"
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="A brief summary shown on cards..."
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                required
              />
            </FormField>

            <FormField label={`${t("admin.projects.fieldLongDesc", "Long Description")} (English - Optional Details)`} id="proj-long-desc-en">
              <textarea
                id="proj-long-desc-en"
                rows={3}
                value={formLongDesc}
                onChange={(e) => setFormLongDesc(e.target.value)}
                placeholder="Detailed project description shown in modal..."
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </FormField>
          </div>
        )}

        {/* Vietnamese Content Tab */}
        {activeLang === "vi" && (
          <div className="space-y-4 p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/15 mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <FlagIcon locale="vi" width={16} height={11} />
              <span>Nội dung Tiếng Việt</span>
            </div>

            <FormField label={`${t("admin.projects.fieldTitle", "Tiêu đề Dự án")} (Tiếng Việt)`} id="proj-title-vi">
              <input
                id="proj-title-vi"
                type="text"
                value={formTitleVi}
                onChange={(e) => setFormTitleVi(e.target.value)}
                placeholder="Ví dụ: Bảng điều khiển Tích hợp AI"
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </FormField>

            <FormField label={`${t("admin.projects.fieldShortDesc", "Mô tả ngắn")} (Tiếng Việt)`} id="proj-desc-vi">
              <textarea
                id="proj-desc-vi"
                rows={2}
                value={formDescVi}
                onChange={(e) => setFormDescVi(e.target.value)}
                placeholder="Mô tả ngắn gọn hiển thị trên thẻ dự án..."
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </FormField>

            <FormField label={`${t("admin.projects.fieldLongDesc", "Mô tả chi tiết")} (Tiếng Việt - Tùy chọn)`} id="proj-long-desc-vi">
              <textarea
                id="proj-long-desc-vi"
                rows={3}
                value={formLongDescVi}
                onChange={(e) => setFormLongDescVi(e.target.value)}
                placeholder="Chi tiết tính năng, kiến trúc giải pháp hiển thị trong popup..."
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </FormField>
          </div>
        )}

        {/* Shared Fields Across Languages */}
        <div className="pt-2 border-t border-white/10 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t("admin.common.optional", "Shared Media & Links / Cài đặt chung:")}
          </p>

          <MediaImagePicker
            label={t("admin.projects.fieldImage", "Cover Image")}
            value={formImage}
            onChange={setFormImage}
            category="project"
            subType="cover"
            required
            helperText="Select or upload a high-resolution screenshot or mockup of your project."
          />

          <FormField label={t("admin.projects.fieldTags", "Tech Stack Tags (Comma separated)")} id="proj-tags" required>
            <input
              id="proj-tags"
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="Next.js, TypeScript, TailwindCSS, Three.js"
              className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("admin.projects.fieldLiveUrl", "Live Demo URL")} id="proj-live">
              <input
                id="proj-live"
                type="url"
                value={formLiveUrl}
                onChange={(e) => setFormLiveUrl(e.target.value)}
                placeholder="https://myproject.com"
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </FormField>

            <FormField label={t("admin.projects.fieldGithubUrl", "GitHub Repository URL")} id="proj-repo">
              <input
                id="proj-repo"
                type="url"
                value={formGithubUrl}
                onChange={(e) => setFormGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project"
                className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </FormField>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={formFeatured}
                onChange={(e) => setFormFeatured(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-500"
              />
              {t("admin.projects.fieldFeaturedDesc", "Feature this project on homepage")}
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={formPublished}
                onChange={(e) => setFormPublished(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-500"
              />
              {t("admin.common.published", "Publish immediately")}
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t("admin.projects.deleteTitle", "Delete Project")}
        message={t("admin.projects.deleteMessage", `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`).replace("{title}", deleteTarget?.title || "")}
        confirmLabel={t("admin.common.delete", "Delete Project")}
        cancelLabel={t("admin.common.cancel", "Cancel")}
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

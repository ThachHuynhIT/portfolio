"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import { useToast } from "@/context/ToastContext";
import type { Project } from "@/lib/types";

export default function ProjectsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLongDesc, setFormLongDesc] = useState("");
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
    setFormTitle("");
    setFormDesc("");
    setFormLongDesc("");
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
    setFormTitle(project.title);
    setFormDesc(project.description);
    setFormLongDesc(project.longDescription || "");
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
      toast.success(`"${project.title}" is now ${nextPublished ? "Published" : "Draft"}`);
      fetchProjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formTitle,
      description: formDesc,
      longDescription: formLongDesc,
      image: formImage,
      tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
      liveUrl: formLiveUrl,
      githubUrl: formGithubUrl,
      featured: formFeatured,
      published: formPublished,
    };

    try {
      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create project");
        toast.success(`Project "${formTitle}" added successfully!`);
      } else if (editingProject) {
        res = await fetch("/api/admin/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProject.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update project");
        toast.success(`Project "${formTitle}" updated successfully!`);
      }
      closeModal();
      fetchProjects();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save project";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/admin/projects?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      toast.success(`Project "${deleteTarget.title}" deleted successfully!`);
      setDeleteTarget(null);
      fetchProjects();
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
    <>
      <AdminHeader
        title="Projects"
        description="Add, edit, or feature projects displayed on your portfolio homepage."
        icon="projects"
        action={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Projects ({projects.length})</option>
              <option value="published">Published ({projects.filter((p) => p.published !== false).length})</option>
              <option value="draft">Draft ({projects.filter((p) => p.published === false).length})</option>
            </select>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20"
            >
              <span className="text-base leading-none">+</span>
              Add Project
            </button>
          </div>
        }
      />

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-bold text-white">{project.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(project)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                      project.published !== false
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                    title="Click to toggle status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${project.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    {project.published !== false ? "Published" : "Draft"}
                  </button>
                  {project.featured && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Featured
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
                {project.liveUrl && <span>Demo ✅</span>}
                {project.githubUrl && <span>GitHub ✅</span>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(project)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg text-xs font-medium transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(project)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit */}
      {(isCreating || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {isCreating ? "Add New Project" : "Edit Project"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <FormField label="Project Title" id="proj-title" required>
                <input
                  id="proj-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <FormField label="Short Description" id="proj-desc" required>
                <textarea
                  id="proj-desc"
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <FormField label="Long Description (Optional Markdown/Details)" id="proj-long-desc">
                <textarea
                  id="proj-long-desc"
                  rows={4}
                  value={formLongDesc}
                  onChange={(e) => setFormLongDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </FormField>

              <MediaImagePicker
                label="Cover Image"
                value={formImage}
                onChange={setFormImage}
                category="project"
                subType="cover"
                required
                helperText="Select or upload a high-resolution screenshot or mockup of your project."
              />

              <FormField label="Tech Stack Tags (Comma separated)" id="proj-tags" required>
                <input
                  id="proj-tags"
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Next.js, TypeScript, TailwindCSS, Three.js"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Live Demo URL" id="proj-live">
                  <input
                    id="proj-live"
                    type="url"
                    value={formLiveUrl}
                    onChange={(e) => setFormLiveUrl(e.target.value)}
                    placeholder="https://myproject.com"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </FormField>
                <FormField label="GitHub Repository URL" id="proj-github">
                  <input
                    id="proj-github"
                    type="url"
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-300">Feature this project</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-emerald-400">Published (Visible on portfolio)</span>
                </label>
              </div>

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
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

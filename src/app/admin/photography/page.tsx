"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/TranslationContext";
import type { PhotoItem } from "@/lib/types";
import { extractImageMetadata } from "@/lib/exif-extractor";
import Icon from "@/components/ui/Icon";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

const DEFAULT_CATEGORIES = [
  "Street & Urban",
  "Portrait & People",
  "Landscape & Nature",
  "Night & Cyberpunk",
  "Architecture",
  "Macro & Detail",
  "Color Grade & Retouch",
  "Video & Motion",
];

export default function PhotographyAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PhotoItem | null>(null);

  // File upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBeforeImage, setUploadingBeforeImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [exifNotice, setExifNotice] = useState<string | null>(null);

  const [isMainPickerOpen, setIsMainPickerOpen] = useState(false);
  const [isBeforePickerOpen, setIsBeforePickerOpen] = useState(false);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Form states - completely empty by default
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("image");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formBeforeImage, setFormBeforeImage] = useState("");
  const [formAspectRatio, setFormAspectRatio] = useState<"portrait" | "landscape" | "square">("landscape");
  const [formDate, setFormDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPublished, setFormPublished] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");

  // Camera EXIF form states - completely empty by default
  const [formMake, setFormMake] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formLens, setFormLens] = useState("");
  const [formFocalLength, setFormFocalLength] = useState("");
  const [formAperture, setFormAperture] = useState("");
  const [formShutterSpeed, setFormShutterSpeed] = useState("");
  const [formIso, setFormIso] = useState("");

  // Retouch form states - completely empty by default
  const [formSoftware, setFormSoftware] = useState("");
  const [formColorGrade, setFormColorGrade] = useState("");
  const [formRetouchNotes, setFormRetouchNotes] = useState("");

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/admin/photography");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch photography items:", err);
      toast.error("Failed to load photography items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Default form is completely empty
  const openCreateModal = () => {
    setFormMediaType("image");
    setFormVideoUrl("");
    setFormTitle("");
    setFormCategory("");
    setFormCustomCategory("");
    setFormDescription("");
    setFormImage("");
    setFormBeforeImage("");
    setFormAspectRatio("landscape");
    setFormDate("");
    setFormLocation("");
    setFormTags("");
    setFormFeatured(false);
    setFormPublished(true);

    setFormMake("");
    setFormModel("");
    setFormLens("");
    setFormFocalLength("");
    setFormAperture("");
    setFormShutterSpeed("");
    setFormIso("");

    setFormSoftware("");
    setFormColorGrade("");
    setFormRetouchNotes("");

    setExifNotice(null);
    setIsCreating(true);
    setEditingPhoto(null);
  };

  const openEditModal = (photo: PhotoItem) => {
    setEditingPhoto(photo);
    setFormMediaType(photo.mediaType || (photo.videoUrl ? "video" : "image"));
    setFormVideoUrl(photo.videoUrl || "");
    setFormTitle(photo.title || "");
    if (DEFAULT_CATEGORIES.includes(photo.category)) {
      setFormCategory(photo.category);
      setFormCustomCategory("");
    } else if (photo.category) {
      setFormCategory("Other");
      setFormCustomCategory(photo.category);
    } else {
      setFormCategory("");
      setFormCustomCategory("");
    }
    setFormDescription(photo.description || "");
    setFormImage(photo.image || "");
    setFormBeforeImage(photo.beforeImage || "");
    setFormAspectRatio(photo.aspectRatio || "landscape");
    setFormDate(photo.date || "");
    setFormLocation(photo.location || "");
    setFormTags(photo.tags ? photo.tags.join(", ") : "");
    setFormFeatured(!!photo.featured);
    setFormPublished(photo.published !== false);

    setFormMake(photo.camera?.make || "");
    setFormModel(photo.camera?.model || "");
    setFormLens(photo.camera?.lens || "");
    setFormFocalLength(photo.camera?.focalLength || "");
    setFormAperture(photo.camera?.aperture || "");
    setFormShutterSpeed(photo.camera?.shutterSpeed || "");
    setFormIso(photo.camera?.iso || "");

    setFormSoftware(photo.editing?.software || "");
    setFormColorGrade(photo.editing?.colorGrade || "");
    setFormRetouchNotes(photo.editing?.notes || "");

    setExifNotice(null);
    setIsCreating(false);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingPhoto(null);
    setExifNotice(null);
  };

  // Upload file & auto extract EXIF metadata
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isBeforeImage: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isBeforeImage) {
      setUploadingBeforeImage(true);
    } else {
      setUploadingImage(true);
    }

    try {
      // 1. Extract EXIF metadata from image file
      const meta = await extractImageMetadata(file);
      const filledFields: string[] = [];

      if (!isBeforeImage) {
        if (meta.title && !formTitle) {
          setFormTitle(meta.title);
          filledFields.push("Title");
        }
        if (meta.aspectRatio) {
          setFormAspectRatio(meta.aspectRatio);
          filledFields.push("Aspect Ratio");
        }
      }

      if (meta.date && !formDate) {
        setFormDate(meta.date);
        filledFields.push("Date");
      }
      if (meta.make && !formMake) {
        setFormMake(meta.make);
        filledFields.push("Camera Make");
      }
      if (meta.model && !formModel) {
        setFormModel(meta.model);
        filledFields.push("Camera Model");
      }
      if (meta.lens && !formLens) {
        setFormLens(meta.lens);
        filledFields.push("Lens");
      }
      if (meta.focalLength && !formFocalLength) {
        setFormFocalLength(meta.focalLength);
        filledFields.push("Focal Length");
      }
      if (meta.aperture && !formAperture) {
        setFormAperture(meta.aperture);
        filledFields.push("Aperture");
      }
      if (meta.shutterSpeed && !formShutterSpeed) {
        setFormShutterSpeed(meta.shutterSpeed);
        filledFields.push("Shutter Speed");
      }
      if (meta.iso && !formIso) {
        setFormIso(meta.iso);
        filledFields.push("ISO");
      }
      if (meta.software && !formSoftware) {
        setFormSoftware(meta.software);
        filledFields.push("Software");
      }

      if (filledFields.length > 0) {
        const msg = `Auto-extracted ${filledFields.length} EXIF parameters: ${filledFields.join(", ")}`;
        setExifNotice(msg);
        toast.success(msg);
      }

      // 2. Upload directly to Cloudinary (auto converts iPhone HEIC to JPEG buffer)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/photography/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const uploadResult = await res.json();
      if (isBeforeImage) {
        setFormBeforeImage(uploadResult.url);
        toast.success("RAW photo uploaded successfully to Cloudinary!");
      } else {
        setFormImage(uploadResult.url);
        toast.success("Processed photo uploaded successfully to Cloudinary!");
      }
    } catch (error) {
      console.error("[Upload Error]", error);
      toast.error("Error uploading photo or reading EXIF data.");
    } finally {
      if (isBeforeImage) {
        setUploadingBeforeImage(false);
      } else {
        setUploadingImage(false);
      }
      e.target.value = "";
    }
  };

  // Upload Video File directly to Cloudinary
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      if (!formTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setFormTitle(cleanName);
      }
      if (!formCategory) {
        setFormCategory("Video & Motion");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/photography/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload video to Cloudinary");
      }

      const uploadResult = await res.json();
      setFormVideoUrl(uploadResult.url);
      setFormMediaType("video");
      if (!formImage) {
        setFormImage(uploadResult.url); // placeholder poster
      }
      toast.success("Video uploaded successfully to Cloudinary!");
    } catch (err) {
      console.error("[Video Upload Error]", err);
      toast.error("Error uploading video to Cloudinary.");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const category =
      formCategory === "Other" && formCustomCategory.trim()
        ? formCustomCategory.trim()
        : formCategory;

    if (!category) {
      toast.error("Please select or enter a category for this artwork.");
      return;
    }

    if (formMediaType === "image" && !formImage.trim()) {
      toast.error("Please upload an image or provide an image URL.");
      return;
    }

    if (formMediaType === "video" && !formVideoUrl.trim() && !formImage.trim()) {
      toast.error("Please upload a video or provide a video URL.");
      return;
    }

    setIsSaving(true);
    const payload = {
      title: formTitle.trim(),
      category,
      description: formDescription.trim() || undefined,
      image: formImage.trim() || formVideoUrl.trim(),
      beforeImage: formBeforeImage.trim() || undefined,
      mediaType: formMediaType,
      videoUrl: formVideoUrl.trim() || undefined,
      aspectRatio: formAspectRatio,
      date: formDate || new Date().toISOString().split("T")[0],
      location: formLocation.trim() || undefined,
      tags: formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featured: formFeatured,
      published: formPublished,
      camera: {
        make: formMake.trim() || undefined,
        model: formModel.trim() || undefined,
        lens: formLens.trim() || undefined,
        focalLength: formFocalLength.trim() || undefined,
        aperture: formAperture.trim() || undefined,
        shutterSpeed: formShutterSpeed.trim() || undefined,
        iso: formIso.trim() || undefined,
      },
      editing: {
        software: formSoftware.trim() || undefined,
        colorGrade: formColorGrade.trim() || undefined,
        notes: formRetouchNotes.trim() || undefined,
      },
    };

    try {
      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/photography", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (editingPhoto) {
        res = await fetch("/api/admin/photography", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPhoto.id, ...payload }),
        });
      } else {
        return;
      }

        if (res.ok) {
        toast.success(
          isCreating ? t.admin.photography.toastCreated : t.admin.photography.toastUpdated
        );
        closeModal();
        fetchPhotos();
      } else {
        toast.error("Failed to save artwork.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (photo: PhotoItem) => {
    const newStatus = photo.published === false;
    try {
      const res = await fetch("/api/admin/photography", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id, published: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus ? t.admin.photography.toastPublished : t.admin.photography.toastDraft);
        fetchPhotos();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleToggleFeatured = async (photo: PhotoItem) => {
    const nextFeatured = !photo.featured;
    try {
      const res = await fetch("/api/admin/photography", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id, featured: nextFeatured }),
      });
      if (res.ok) {
        toast.success(nextFeatured ? t.admin.photography.toastFeatured : t.admin.photography.toastUnfeatured);
        fetchPhotos();
      } else {
        toast.error("Failed to update featured status");
      }
    } catch {
      toast.error("Error updating featured status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/photography?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t.admin.photography.toastDeleted);
        setDeleteTarget(null);
        fetchPhotos();
      } else {
        toast.error("Failed to delete artwork.");
      }
    } catch {
      toast.error("Error deleting artwork.");
    }
  };

  const filteredPhotos = photos.filter((photo) => {
    if (statusFilter === "published") return photo.published !== false;
    if (statusFilter === "draft") return photo.published === false;
    if (statusFilter === "featured") return Boolean(photo.featured);
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdminHeader
        title={t.admin.photography.title}
        description={t.admin.photography.description}
        icon="camera"
        action={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">{t.admin.photography.filterAll} ({photos.length})</option>
              <option value="published">{t.admin.photography.filterPublished} ({photos.filter((p) => p.published !== false).length})</option>
              <option value="draft">{t.admin.photography.filterDraft} ({photos.filter((p) => p.published === false).length})</option>
              <option value="featured">{t.admin.photography.filterFeatured} ({photos.filter((p) => p.featured).length})</option>
            </select>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              <Icon name="plus" size={14} />
              <span>{t.admin.photography.addArtwork}</span>
            </button>
          </div>
        }
      />

      {/* ── Photo & Video List ── */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          {t.admin.common.loading}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          <Icon name="camera" size={32} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">{t.admin.photography.noArtworksTitle}</h3>
          <p className="text-xs text-slate-400 mb-4">
            {t.admin.photography.noArtworksDesc}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors"
          >
            {t.admin.photography.addArtwork}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo) => {
            const isVideo = photo.mediaType === "video" || Boolean(photo.videoUrl);

            return (
              <div
                key={photo.id}
                className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all shadow-md"
              >
                {/* Preview Thumbnail */}
                <div className="relative aspect-[16/10] w-full bg-black">
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                        <Icon name="play" size={16} className="text-cyan-400 translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  <Image
                    src={photo.image}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-cyan-300 backdrop-blur-md border border-white/10">
                      {photo.category}
                    </span>
                    {isVideo && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-600 text-black shadow">
                        Video
                      </span>
                    )}
                    {!isVideo && photo.beforeImage && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-600 text-white shadow">
                        Before/After
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeatured(photo);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-all shadow-md ${
                        photo.featured
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                          : "bg-black/70 text-slate-400 border-slate-700 hover:text-amber-300 hover:border-amber-500/30"
                      }`}
                      title={photo.featured ? "Bỏ ảnh nổi bật" : "Đánh dấu là ảnh nổi bật (Featured)"}
                    >
                      <span>{photo.featured ? t.admin.photography.markFeatured : t.admin.photography.setFeatured}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublish(photo);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-all shadow-md ${
                        photo.published !== false
                          ? "bg-black/70 text-emerald-400 border-emerald-500/30 hover:bg-black/90"
                          : "bg-black/70 text-slate-400 border-slate-700 hover:bg-black/90"
                      }`}
                      title="Click to toggle status"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${photo.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                      {photo.published !== false ? t.admin.common.published : t.admin.common.draft}
                    </button>
                  </div>
                </div>

                {/* Card Meta */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                      {photo.title}
                    </h3>
                    {photo.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {photo.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">{photo.date}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(photo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all"
                        title={t.admin.common.edit}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(photo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title={t.admin.common.delete}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <AdminModal
        isOpen={isCreating || !!editingPhoto}
        onClose={closeModal}
        title={isCreating ? t.admin.photography.modalCreateTitle : t.admin.photography.modalEditTitle}
        subtitle={t.admin.photography.modalSubtitle}
        icon="camera"
        onSubmit={handleSave}
        saveLabel={isCreating ? t.admin.photography.modalCreateTitle : t.admin.common.save}
        closeLabel={t.admin.common.close}
        isSaving={isSaving}
        saveDisabled={uploadingImage || uploadingBeforeImage || uploadingVideo}
        maxWidth="max-w-2xl"
      >
        {/* Media Type Switcher: Photo vs Video */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setFormMediaType("image")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              formMediaType === "image"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name="image" size={14} />
            <span>{t.admin.photography.photoTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFormMediaType("video");
              if (!formCategory) setFormCategory("Video & Motion");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              formMediaType === "video"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon name="video" size={14} />
            <span>{t.admin.photography.videoTab}</span>
          </button>
        </div>

        {/* EXIF auto-fill notification banner */}
        {exifNotice && (
          <div className="mb-6 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5">
            <Icon name="aperture" size={16} className="text-cyan-400 flex-shrink-0" />
            <span>{exifNotice}</span>
          </div>
        )}

        <div className="space-y-6">
              {/* ── Section 1: Upload File & Media to Cloudinary ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Icon name={formMediaType === "video" ? "video" : "image"} size={13} />
                  <span>
                    {formMediaType === "video" ? t.admin.photography.section1Video : t.admin.photography.section1Media}
                  </span>
                </h3>

                {/* If Video mode: Video Upload Box */}
                {formMediaType === "video" && (
                  <div className="rounded-2xl border border-dashed border-cyan-500/30 p-4 bg-cyan-500/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200">
                        {t.admin.photography.videoFileLabel} <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[11px] text-cyan-400">
                        {t.admin.photography.videoFileHint}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={videoFileInputRef}
                        type="file"
                        accept="video/*,.mp4,.webm,.mov,.m4v"
                        className="hidden"
                        onChange={handleVideoSelect}
                      />

                      <button
                        type="button"
                        disabled={uploadingVideo}
                        onClick={() => videoFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        <Icon name="video" size={14} />
                        <span>
                          {uploadingVideo ? t.admin.photography.uploadingVideo : t.admin.photography.uploadVideoToCloud}
                        </span>
                      </button>

                      {formVideoUrl && (
                        <span className="text-xs text-cyan-300 flex items-center gap-1 font-mono">
                          <Icon name="check" size={13} />
                          Video uploaded
                        </span>
                      )}
                    </div>

                    {formVideoUrl && (
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-white/10 mt-2">
                        <video
                          src={formVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {t.admin.photography.videoOrPaste}
                      </span>
                      <input
                        type="text"
                        value={formVideoUrl}
                        onChange={(e) => setFormVideoUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/... or https://..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Main Image Upload Box (or Poster for Video) */}
                <div className="rounded-2xl border border-dashed border-white/15 p-4 bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      {formMediaType === "video" ? t.admin.photography.videoPosterLabel : t.admin.photography.retouchedPhotoLabel}
                      {formMediaType === "image" && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <span className="text-[11px] text-cyan-400">
                      {t.admin.photography.photoSupportHint}
                    </span>
                  </div>

                  {/* Upload button & file input */}
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={mainFileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, false)}
                    />

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => mainFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Icon name="camera" size={14} />
                      <span>
                        {uploadingImage ? t.admin.photography.uploadingPhoto : t.admin.photography.uploadToCloud}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMainPickerOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/10"
                    >
                      <span>📁</span>
                      <span>{t.admin.photography.chooseFromCloud}</span>
                    </button>

                    {formImage && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <Icon name="check" size={13} />
                        Image set
                      </span>
                    )}
                  </div>

                  {/* Preview if uploaded */}
                  {formImage && (
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-white/10 mt-2">
                      <Image
                        src={formImage}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormImage("")}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                        title="Remove image"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  )}

                  {/* Manual URL Input fallback */}
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 block mb-1">
                      {t.admin.photography.photoOrPaste}
                    </span>
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                {/* Before Image Upload Box (Only in Image Mode) */}
                {formMediaType === "image" && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 bg-white/[0.01] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {t.admin.photography.rawPhotoLabel}
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {t.admin.photography.rawPhotoHint}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={beforeFileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, true)}
                      />

                      <button
                        type="button"
                        disabled={uploadingBeforeImage}
                        onClick={() => beforeFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <Icon name="compare" size={14} />
                        <span>
                          {uploadingBeforeImage ? t.admin.photography.uploadingRaw : t.admin.photography.uploadRawToCloud}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsBeforePickerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-white/10"
                      >
                        <span>📁</span>
                        <span>{t.admin.photography.chooseFromCloud}</span>
                      </button>

                      {formBeforeImage && (
                        <span className="text-xs text-purple-400 flex items-center gap-1 font-mono">
                          <Icon name="check" size={13} />
                          RAW photo set
                        </span>
                      )}
                    </div>

                    {formBeforeImage && (
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border border-white/10 mt-2">
                        <Image
                          src={formBeforeImage}
                          alt="Before Preview"
                          fill
                          className="object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFormBeforeImage("")}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                          title="Remove RAW image"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {t.admin.photography.rawOrPaste}
                      </span>
                      <input
                        type="text"
                        value={formBeforeImage}
                        onChange={(e) => setFormBeforeImage(e.target.value)}
                        placeholder="Optional: https://res.cloudinary.com/... or https://..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 2: Basic Information ── */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {t.admin.photography.section2Basic}
                </h3>

                <FormField label={t.admin.photography.fieldTitle} id="title" required>
                  <input
                    id="title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder={t.admin.photography.fieldTitlePlaceholder}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t.admin.photography.fieldCategory} id="category" required>
                    <select
                      id="category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">-- {t.admin.photography.fieldCategory} --</option>
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Other">Other (Custom)</option>
                    </select>
                  </FormField>

                  {formCategory === "Other" && (
                    <FormField label={t.admin.photography.fieldCustomCategory} id="customCategory" required>
                      <input
                        id="customCategory"
                        type="text"
                        value={formCustomCategory}
                        onChange={(e) => setFormCustomCategory(e.target.value)}
                        placeholder="e.g. Travel, Aerial / Drone..."
                        className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                      />
                    </FormField>
                  )}

                  <FormField label={t.admin.photography.fieldAspectRatio} id="aspectRatio">
                    <select
                      id="aspectRatio"
                      value={formAspectRatio}
                      onChange={(e) =>
                        setFormAspectRatio(e.target.value as "portrait" | "landscape" | "square")
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="landscape">{t.admin.photography.ratioLandscape}</option>
                      <option value="portrait">{t.admin.photography.ratioPortrait}</option>
                      <option value="square">{t.admin.photography.ratioSquare}</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t.admin.photography.fieldDate} id="date">
                    <input
                      id="date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>

                  <FormField label={t.admin.photography.fieldLocation} id="location">
                    <input
                      id="location"
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder={t.admin.photography.fieldLocationPlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                </div>

                <FormField label={t.admin.photography.fieldDescription} id="description">
                  <textarea
                    id="description"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t.admin.photography.fieldDescriptionPlaceholder}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <FormField label={t.admin.photography.fieldTags} id="tags">
                  <input
                    id="tags"
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder={t.admin.photography.fieldTagsPlaceholder}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={formPublished}
                      onChange={(e) => setFormPublished(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-white/20 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    <span>{t.admin.photography.fieldPublished}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-white/20 text-purple-500 focus:ring-purple-500/20"
                    />
                    <span>{t.admin.photography.fieldFeatured}</span>
                  </label>
                </div>
              </div>

              {/* ── Section 3: Camera & EXIF Settings ── */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Icon name="camera" size={13} />
                    <span>{t.admin.photography.section3Exif}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    (Auto-extracted from upload or manual input)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <FormField label={t.admin.photography.exifCameraMake} id="make">
                    <input
                      id="make"
                      type="text"
                      value={formMake}
                      onChange={(e) => setFormMake(e.target.value)}
                      placeholder={t.admin.photography.exifMakePlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.exifCameraModel} id="model">
                    <input
                      id="model"
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder={t.admin.photography.exifModelPlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.exifLens} id="lens">
                    <input
                      id="lens"
                      type="text"
                      value={formLens}
                      onChange={(e) => setFormLens(e.target.value)}
                      placeholder={t.admin.photography.exifLensPlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.exifFocalLength} id="focal">
                    <input
                      id="focal"
                      type="text"
                      value={formFocalLength}
                      onChange={(e) => setFormFocalLength(e.target.value)}
                      placeholder={t.admin.photography.exifFocalLengthPlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.exifAperture} id="aperture">
                    <input
                      id="aperture"
                      type="text"
                      value={formAperture}
                      onChange={(e) => setFormAperture(e.target.value)}
                      placeholder={t.admin.photography.exifAperturePlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.exifShutterSpeed} id="shutter">
                    <input
                      id="shutter"
                      type="text"
                      value={formShutterSpeed}
                      onChange={(e) => setFormShutterSpeed(e.target.value)}
                      placeholder={t.admin.photography.exifShutterSpeedPlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.exifIso} id="iso">
                    <input
                      id="iso"
                      type="text"
                      value={formIso}
                      onChange={(e) => setFormIso(e.target.value)}
                      placeholder={t.admin.photography.exifIsoPlaceholder}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                </div>
              </div>

              {/* ── Section 4: Post-Processing & Color Grading ── */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <Icon name="compare" size={13} />
                  <span>{t.admin.photography.section4Retouch}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t.admin.photography.retouchSoftware} id="software">
                    <input
                      id="software"
                      type="text"
                      value={formSoftware}
                      onChange={(e) => setFormSoftware(e.target.value)}
                      placeholder={t.admin.photography.retouchSoftwarePlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </FormField>
                  <FormField label={t.admin.photography.retouchColorGrade} id="colorGrade">
                    <input
                      id="colorGrade"
                      type="text"
                      value={formColorGrade}
                      onChange={(e) => setFormColorGrade(e.target.value)}
                      placeholder={t.admin.photography.retouchColorGradePlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </FormField>
                </div>

                <FormField label={t.admin.photography.retouchNotes} id="retouchNotes">
                  <textarea
                    id="retouchNotes"
                    rows={2}
                    value={formRetouchNotes}
                    onChange={(e) => setFormRetouchNotes(e.target.value)}
                    placeholder={t.admin.photography.retouchNotesPlaceholder}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </FormField>
              </div>

        </div>
      </AdminModal>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t.admin.photography.deleteTitle}
        message={t.admin.photography.deleteMessage.replace("{title}", deleteTarget?.title || "")}
        confirmLabel={t.admin.photography.confirmDeleteBtn}
        cancelLabel={t.admin.common.cancel}
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Media Picker Modals ── */}
      <MediaPickerModal
        isOpen={isMainPickerOpen}
        onClose={() => setIsMainPickerOpen(false)}
        onSelect={(url) => setFormImage(url)}
        title={t.admin.photography.chooseArtFromCloud}
        defaultCategory="photo"
      />

      <MediaPickerModal
        isOpen={isBeforePickerOpen}
        onClose={() => setIsBeforePickerOpen(false)}
        onSelect={(url) => setFormBeforeImage(url)}
        title={t.admin.photography.chooseRawFromCloud}
        defaultCategory="photo"
      />
    </div>
  );
}

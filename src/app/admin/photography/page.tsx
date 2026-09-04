"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import type { PhotoItem } from "@/lib/types";
import { extractImageMetadata } from "@/lib/exif-extractor";
import Icon from "@/components/ui/Icon";

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
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PhotoItem | null>(null);

  // File upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBeforeImage, setUploadingBeforeImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [exifNotice, setExifNotice] = useState<string | null>(null);

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
          isCreating ? "Artwork added successfully!" : "Artwork updated successfully!"
        );
        closeModal();
        fetchPhotos();
      } else {
        toast.error("Failed to save artwork.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/photography?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Artwork deleted from collection!");
        setDeleteTarget(null);
        fetchPhotos();
      } else {
        toast.error("Failed to delete artwork.");
      }
    } catch {
      toast.error("Error deleting artwork.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AdminHeader
        title="Photography & Media Management"
        description="Manage photography artworks, videos, categories, camera EXIF settings, and Before & After comparisons."
        icon="camera"
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            <Icon name="plus" size={14} />
            <span>Add New Artwork</span>
          </button>
        }
      />

      {/* ── Photo & Video List ── */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading artworks...
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
          <Icon name="camera" size={32} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No artworks yet</h3>
          <p className="text-xs text-slate-400 mb-4">
            Click &quot;Add New Artwork&quot; to upload photos or videos to Cloudinary and build your showcase.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors"
          >
            Add Artwork
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((photo) => {
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
                        title="Edit"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(photo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
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
      {(isCreating || editingPhoto) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isCreating ? "Add New Artwork" : "Edit Artwork"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload photos (supports JPG, PNG, iPhone HEIC auto-converted) or videos directly to Cloudinary.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

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
                <span>Photo / Image</span>
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
                <span>Video / Motion</span>
              </button>
            </div>

            {/* EXIF auto-fill notification banner */}
            {exifNotice && (
              <div className="mb-6 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5">
                <Icon name="aperture" size={16} className="text-cyan-400 flex-shrink-0" />
                <span>{exifNotice}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* ── Section 1: Upload File & Media to Cloudinary ── */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Icon name={formMediaType === "video" ? "video" : "image"} size={13} />
                  <span>
                    1. {formMediaType === "video" ? "Video & Poster Upload (Cloudinary)" : "Photo & Media Upload (Cloudinary)"}
                  </span>
                </h3>

                {/* If Video mode: Video Upload Box */}
                {formMediaType === "video" && (
                  <div className="rounded-2xl border border-dashed border-cyan-500/30 p-4 bg-cyan-500/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200">
                        Video File (MP4, WebM, MOV) <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[11px] text-cyan-400">
                        (Upload directly to Cloudinary or paste URL)
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
                          {uploadingVideo ? "Uploading video to Cloudinary..." : "Upload Video to Cloudinary"}
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
                        Or paste Video URL (Cloudinary, MP4, etc.):
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
                      {formMediaType === "video" ? "Video Poster / Thumbnail" : "Final Retouched Photo"}
                      {formMediaType === "image" && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <span className="text-[11px] text-cyan-400">
                      (Supports JPG, PNG, iPhone HEIC auto-converted to Cloudinary)
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
                        {uploadingImage ? "Uploading to Cloudinary & reading EXIF..." : "Upload Photo to Cloudinary"}
                      </span>
                    </button>

                    {formImage && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <Icon name="check" size={13} />
                        Image uploaded
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
                      Or paste direct image URL (Cloudinary / Unsplash):
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
                        RAW / Original Photo (Before Image)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        (Optional: Enables Before/After interactive slider)
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
                          {uploadingBeforeImage ? "Uploading RAW to Cloudinary..." : "Upload RAW Photo to Cloudinary"}
                        </span>
                      </button>

                      {formBeforeImage && (
                        <span className="text-xs text-purple-400 flex items-center gap-1 font-mono">
                          <Icon name="check" size={13} />
                          RAW photo uploaded
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
                        Or paste RAW image URL:
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
                  2. Basic Information
                </h3>

                <FormField label="Artwork Title" id="title" required>
                  <input
                    id="title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="Enter artwork title..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Category" id="category" required>
                    <select
                      id="category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">-- Select Category --</option>
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Other">Other (Custom)</option>
                    </select>
                  </FormField>

                  {formCategory === "Other" && (
                    <FormField label="Custom Category Name" id="customCategory" required>
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

                  <FormField label="Aspect Ratio" id="aspectRatio">
                    <select
                      id="aspectRatio"
                      value={formAspectRatio}
                      onChange={(e) =>
                        setFormAspectRatio(e.target.value as "portrait" | "landscape" | "square")
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="landscape">Landscape (Horizontal)</option>
                      <option value="portrait">Portrait (Vertical)</option>
                      <option value="square">Square (1:1)</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Date Captured / Created" id="date">
                    <input
                      id="date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>

                  <FormField label="Location" id="location">
                    <input
                      id="location"
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Shinjuku, Tokyo / Da Lat..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                </div>

                <FormField label="Description / Visual Story" id="description">
                  <textarea
                    id="description"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the context, story, or emotion behind the shot..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <FormField label="Tags (comma-separated)" id="tags">
                  <input
                    id="tags"
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Street, Night, Rain, Tokyo..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>
              </div>

              {/* ── Section 3: Camera & EXIF Settings ── */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Icon name="camera" size={13} />
                    <span>3. Camera Settings (EXIF)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    (Auto-extracted from upload or manual input)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <FormField label="Camera Make" id="make">
                    <input
                      id="make"
                      type="text"
                      value={formMake}
                      onChange={(e) => setFormMake(e.target.value)}
                      placeholder="e.g. Sony"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label="Camera Model" id="model">
                    <input
                      id="model"
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="e.g. A7 IV"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label="Lens" id="lens">
                    <input
                      id="lens"
                      type="text"
                      value={formLens}
                      onChange={(e) => setFormLens(e.target.value)}
                      placeholder="e.g. FE 35mm f/1.4 GM"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label="Focal Length" id="focal">
                    <input
                      id="focal"
                      type="text"
                      value={formFocalLength}
                      onChange={(e) => setFormFocalLength(e.target.value)}
                      placeholder="35mm"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label="Aperture" id="aperture">
                    <input
                      id="aperture"
                      type="text"
                      value={formAperture}
                      onChange={(e) => setFormAperture(e.target.value)}
                      placeholder="f/1.8"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label="Shutter Speed" id="shutter">
                    <input
                      id="shutter"
                      type="text"
                      value={formShutterSpeed}
                      onChange={(e) => setFormShutterSpeed(e.target.value)}
                      placeholder="1/250s"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                  <FormField label="ISO" id="iso">
                    <input
                      id="iso"
                      type="text"
                      value={formIso}
                      onChange={(e) => setFormIso(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </FormField>
                </div>
              </div>

              {/* ── Section 4: Post-Processing & Color Grading ── */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <Icon name="compare" size={13} />
                  <span>4. Post-Processing & Color Grading</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Editing Software" id="software">
                    <input
                      id="software"
                      type="text"
                      value={formSoftware}
                      onChange={(e) => setFormSoftware(e.target.value)}
                      placeholder="Lightroom / Photoshop / Premiere / DaVinci..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </FormField>
                  <FormField label="Color Grade / Palette" id="colorGrade">
                    <input
                      id="colorGrade"
                      type="text"
                      value={formColorGrade}
                      onChange={(e) => setFormColorGrade(e.target.value)}
                      placeholder="e.g. Teal & Orange / Film Warm..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-400"
                    />
                  </FormField>
                </div>

                <FormField label="Retouch & Editing Notes" id="retouchNotes">
                  <textarea
                    id="retouchNotes"
                    rows={2}
                    value={formRetouchNotes}
                    onChange={(e) => setFormRetouchNotes(e.target.value)}
                    placeholder="Describe retouching techniques: Dodge & Burn, White Balance, Color Grading..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </FormField>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || uploadingBeforeImage || uploadingVideo}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCreating ? "Create Artwork" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Confirm Delete Artwork"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will remove the artwork from your collection.`}
        confirmLabel="Delete Artwork"
        cancelLabel="Cancel"
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import LanguageTabSelector from "@/components/admin/LanguageTabSelector";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/TranslationContext";
import type { PhotoItem, PhotoAlbum } from "@/lib/types";
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

  // Top level view mode: "photos" vs "albums"
  const [adminView, setAdminView] = useState<"photos" | "albums">("photos");

  // Photos State
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PhotoItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");

  // Albums State
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [albumStatusFilter, setAlbumStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [deleteAlbumTarget, setDeleteAlbumTarget] = useState<PhotoAlbum | null>(null);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);

  // File upload state for photo
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBeforeImage, setUploadingBeforeImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [exifNotice, setExifNotice] = useState<string | null>(null);

  const [isMainPickerOpen, setIsMainPickerOpen] = useState(false);
  const [isBeforePickerOpen, setIsBeforePickerOpen] = useState(false);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Photo form states (Bilingual)
  const [photoActiveLang, setPhotoActiveLang] = useState<"en" | "vi">("vi");
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("image");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formTitleVi, setFormTitleVi] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDescriptionVi, setFormDescriptionVi] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formBeforeImage, setFormBeforeImage] = useState("");
  const [formAspectRatio, setFormAspectRatio] = useState<"portrait" | "landscape" | "square">("landscape");
  const [formDate, setFormDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formLocationVi, setFormLocationVi] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formAlbumId, setFormAlbumId] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPublished, setFormPublished] = useState(true);

  // Camera EXIF form states
  const [formMake, setFormMake] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formLens, setFormLens] = useState("");
  const [formFocalLength, setFormFocalLength] = useState("");
  const [formAperture, setFormAperture] = useState("");
  const [formShutterSpeed, setFormShutterSpeed] = useState("");
  const [formIso, setFormIso] = useState("");

  // Retouch form states
  const [formSoftware, setFormSoftware] = useState("");
  const [formColorGrade, setFormColorGrade] = useState("");
  const [formRetouchNotes, setFormRetouchNotes] = useState("");

  // Album form states (Bilingual & Cover Selection)
  const [albumActiveLang, setAlbumActiveLang] = useState<"en" | "vi">("vi");
  const [formAlbumTitle, setFormAlbumTitle] = useState("");
  const [formAlbumTitleVi, setFormAlbumTitleVi] = useState("");
  const [formAlbumSlug, setFormAlbumSlug] = useState("");
  const [formAlbumDesc, setFormAlbumDesc] = useState("");
  const [formAlbumDescVi, setFormAlbumDescVi] = useState("");
  const [formAlbumCoverImage, setFormAlbumCoverImage] = useState("");
  const [formAlbumCoverPhotoId, setFormAlbumCoverPhotoId] = useState("");
  const [formAlbumPhotoIds, setFormAlbumPhotoIds] = useState<string[]>([]);
  const [formAlbumFeatured, setFormAlbumFeatured] = useState(false);
  const [formAlbumPublished, setFormAlbumPublished] = useState(true);
  const [photoSearchForAlbum, setPhotoSearchForAlbum] = useState("");

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
      toast.error(t.admin.photography.toastLoadFailed || "Failed to load photography items");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    setLoadingAlbums(true);
    try {
      const res = await fetch("/api/admin/photography/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch albums:", err);
    } finally {
      setLoadingAlbums(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, []);

  // ── Photo Modal Handlers ──
  const openCreateModal = () => {
    setPhotoActiveLang("vi");
    setFormMediaType("image");
    setFormVideoUrl("");
    setFormTitle("");
    setFormTitleVi("");
    setFormCategory("");
    setFormCustomCategory("");
    setFormDescription("");
    setFormDescriptionVi("");
    setFormImage("");
    setFormBeforeImage("");
    setFormAspectRatio("landscape");
    setFormDate("");
    setFormLocation("");
    setFormLocationVi("");
    setFormTags("");
    setFormAlbumId("");
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
    setPhotoActiveLang(photo.title_vi ? "vi" : "en");
    setFormMediaType(photo.mediaType || (photo.videoUrl ? "video" : "image"));
    setFormVideoUrl(photo.videoUrl || "");
    setFormTitle(photo.title || "");
    setFormTitleVi(photo.title_vi || "");
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
    setFormDescriptionVi(photo.description_vi || "");
    setFormImage(photo.image || "");
    setFormBeforeImage(photo.beforeImage || "");
    setFormAspectRatio(photo.aspectRatio || "landscape");
    setFormDate(photo.date || "");
    setFormLocation(photo.location || "");
    setFormLocationVi(photo.location_vi || "");
    setFormTags(photo.tags ? photo.tags.join(", ") : "");
    setFormAlbumId(photo.albumId || "");
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
        setFormImage(uploadResult.url);
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

    // Default title fallback
    const title = formTitle.trim() || formTitleVi.trim();
    if (!title) {
      toast.error("Please provide a title for this artwork.");
      return;
    }

    setIsSaving(true);
    const payload = {
      title,
      title_vi: formTitleVi.trim() || undefined,
      category,
      description: formDescription.trim() || undefined,
      description_vi: formDescriptionVi.trim() || undefined,
      image: formImage.trim() || formVideoUrl.trim(),
      beforeImage: formBeforeImage.trim() || undefined,
      mediaType: formMediaType,
      videoUrl: formVideoUrl.trim() || undefined,
      aspectRatio: formAspectRatio,
      date: formDate || new Date().toISOString().split("T")[0],
      location: formLocation.trim() || undefined,
      location_vi: formLocationVi.trim() || undefined,
      tags: formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      albumId: formAlbumId || undefined,
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
        fetchAlbums(); // refresh album photo counts
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
        fetchAlbums();
      } else {
        toast.error("Failed to delete artwork.");
      }
    } catch {
      toast.error("Error deleting artwork.");
    }
  };

  // ── Album Modal Handlers ──
  const openCreateAlbumModal = () => {
    setAlbumActiveLang("vi");
    setFormAlbumTitle("");
    setFormAlbumTitleVi("");
    setFormAlbumSlug("");
    setFormAlbumDesc("");
    setFormAlbumDescVi("");
    setFormAlbumCoverImage("");
    setFormAlbumCoverPhotoId("");
    setFormAlbumPhotoIds([]);
    setFormAlbumFeatured(false);
    setFormAlbumPublished(true);
    setPhotoSearchForAlbum("");
    setIsCreatingAlbum(true);
    setEditingAlbum(null);
  };

  const openEditAlbumModal = (album: PhotoAlbum) => {
    setEditingAlbum(album);
    setAlbumActiveLang(album.title_vi ? "vi" : "en");
    setFormAlbumTitle(album.title || "");
    setFormAlbumTitleVi(album.title_vi || "");
    setFormAlbumSlug(album.slug || "");
    setFormAlbumDesc(album.description || "");
    setFormAlbumDescVi(album.description_vi || "");

    // Combined photoIds from both album.photoIds and photos that have photo.albumId === album.id
    const linkedPhotoIds = Array.from(
      new Set([
        ...(album.photoIds || []),
        ...photos.filter((p) => p.albumId === album.id).map((p) => p.id),
      ])
    );
    setFormAlbumPhotoIds(linkedPhotoIds);

    // If only 1 photo in album, it automatically is the cover!
    let coverImg = album.coverImage || "";
    let coverId = album.coverPhotoId || "";
    if (linkedPhotoIds.length === 1) {
      const singlePhoto = photos.find((p) => p.id === linkedPhotoIds[0]);
      if (singlePhoto) {
        coverImg = singlePhoto.image;
        coverId = singlePhoto.id;
      }
    } else if (!coverImg && linkedPhotoIds.length > 0) {
      const firstPhoto = photos.find((p) => p.id === linkedPhotoIds[0]);
      if (firstPhoto) {
        coverImg = firstPhoto.image;
        coverId = firstPhoto.id;
      }
    }

    setFormAlbumCoverImage(coverImg);
    setFormAlbumCoverPhotoId(coverId);
    setFormAlbumFeatured(Boolean(album.featured));
    setFormAlbumPublished(album.published !== false);
    setPhotoSearchForAlbum("");
    setIsCreatingAlbum(false);
  };

  const closeAlbumModal = () => {
    setIsCreatingAlbum(false);
    setEditingAlbum(null);
  };

  const handleSetCoverPhoto = (photo: PhotoItem) => {
    setFormAlbumCoverImage(photo.image);
    setFormAlbumCoverPhotoId(photo.id);
    toast.success(`Đã chọn "${photo.title_vi || photo.title}" làm ảnh bìa Album!`);
  };

  const handleTogglePhotoInAlbum = (photoId: string) => {
    let nextIds: string[];
    if (formAlbumPhotoIds.includes(photoId)) {
      nextIds = formAlbumPhotoIds.filter((id) => id !== photoId);
    } else {
      nextIds = [...formAlbumPhotoIds, photoId];
    }
    setFormAlbumPhotoIds(nextIds);

    // If only 1 photo in album, it automatically becomes the cover!
    if (nextIds.length === 1) {
      const singlePhoto = photos.find((p) => p.id === nextIds[0]);
      if (singlePhoto) {
        setFormAlbumCoverImage(singlePhoto.image);
        setFormAlbumCoverPhotoId(singlePhoto.id);
      }
    } else if (nextIds.length === 0) {
      setFormAlbumCoverImage("");
      setFormAlbumCoverPhotoId("");
    } else if (!nextIds.includes(formAlbumCoverPhotoId)) {
      const firstPhoto = photos.find((p) => p.id === nextIds[0]);
      if (firstPhoto) {
        setFormAlbumCoverImage(firstPhoto.image);
        setFormAlbumCoverPhotoId(firstPhoto.id);
      }
    }
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = formAlbumTitle.trim() || formAlbumTitleVi.trim();
    if (!title) {
      toast.error("Vui lòng nhập tên Album (Please enter album title).");
      return;
    }

    // Ensure if only 1 photo, it automatically is the cover image
    let coverImage = formAlbumCoverImage;
    let coverPhotoId = formAlbumCoverPhotoId;
    if (formAlbumPhotoIds.length === 1) {
      const singlePhoto = photos.find((p) => p.id === formAlbumPhotoIds[0]);
      if (singlePhoto) {
        coverImage = singlePhoto.image;
        coverPhotoId = singlePhoto.id;
      }
    } else if ((!coverImage || !formAlbumPhotoIds.includes(coverPhotoId || "")) && formAlbumPhotoIds.length > 0) {
      const firstPhoto = photos.find((p) => p.id === formAlbumPhotoIds[0]);
      if (firstPhoto) {
        coverImage = firstPhoto.image;
        coverPhotoId = firstPhoto.id;
      }
    }

    setIsSavingAlbum(true);
    const payload = {
      title,
      title_vi: formAlbumTitleVi.trim() || undefined,
      slug: formAlbumSlug.trim() || undefined,
      description: formAlbumDesc.trim() || undefined,
      description_vi: formAlbumDescVi.trim() || undefined,
      coverImage: coverImage || "",
      coverPhotoId: coverPhotoId || undefined,
      photoIds: formAlbumPhotoIds,
      featured: formAlbumFeatured,
      published: formAlbumPublished,
    };

    try {
      let res: Response;
      if (isCreatingAlbum) {
        res = await fetch("/api/admin/photography/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (editingAlbum) {
        res = await fetch("/api/admin/photography/albums", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingAlbum.id, ...payload }),
        });
      } else {
        return;
      }

      if (res.ok) {
        toast.success(
          isCreatingAlbum
            ? t.admin.photography.toastAlbumCreated
            : t.admin.photography.toastAlbumUpdated
        );
        closeAlbumModal();
        fetchAlbums();
        fetchPhotos();
      } else {
        toast.error("Failed to save album");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error");
    } finally {
      setIsSavingAlbum(false);
    }
  };

  const handleToggleAlbumPublish = async (album: PhotoAlbum) => {
    const nextStatus = album.published === false;
    try {
      const res = await fetch("/api/admin/photography/albums", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: album.id, published: nextStatus }),
      });
      if (res.ok) {
        toast.success(nextStatus ? t.admin.photography.toastPublished : t.admin.photography.toastDraft);
        fetchAlbums();
      }
    } catch {
      toast.error("Failed to update album status");
    }
  };

  const handleToggleAlbumFeatured = async (album: PhotoAlbum) => {
    const nextFeatured = !album.featured;
    try {
      const res = await fetch("/api/admin/photography/albums", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: album.id, featured: nextFeatured }),
      });
      if (res.ok) {
        toast.success(nextFeatured ? t.admin.photography.toastFeatured : t.admin.photography.toastUnfeatured);
        fetchAlbums();
      }
    } catch {
      toast.error("Failed to update featured album status");
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumTarget) return;
    try {
      const res = await fetch(`/api/admin/photography/albums?id=${deleteAlbumTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t.admin.photography.toastAlbumDeleted);
        setDeleteAlbumTarget(null);
        fetchAlbums();
        fetchPhotos();
      } else {
        toast.error("Failed to delete album.");
      }
    } catch {
      toast.error("Error deleting album.");
    }
  };

  // Filtered lists: Items marked as featured are prioritized at the beginning of array
  const filteredPhotos = photos
    .filter((photo) => {
      if (statusFilter === "published") return photo.published !== false;
      if (statusFilter === "draft") return photo.published === false;
      if (statusFilter === "featured") return Boolean(photo.featured);
      return true;
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const filteredAlbums = albums
    .filter((album) => {
      if (albumStatusFilter === "published") return album.published !== false;
      if (albumStatusFilter === "draft") return album.published === false;
      if (albumStatusFilter === "featured") return Boolean(album.featured);
      return true;
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setAdminView("photos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              adminView === "photos"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon name="camera" size={15} />
            <span>{t.admin.photography.tabArtworks || "Tác Phẩm & Ảnh"} ({photos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminView("albums")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              adminView === "albums"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon name="grid" size={15} />
            <span>{t.admin.photography.tabAlbums || "Bộ Sưu Tập (Albums)"} ({albums.length})</span>
          </button>
        </div>

        {/* Action button & status filter corresponding to view */}
        {adminView === "photos" ? (
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              <Icon name="plus" size={14} />
              <span>{t.admin.photography.addArtwork}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={albumStatusFilter}
              onChange={(e) => setAlbumStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">{t.admin.photography.filterAll} ({albums.length})</option>
              <option value="published">{t.admin.photography.filterPublished} ({albums.filter((a) => a.published !== false).length})</option>
              <option value="draft">{t.admin.photography.filterDraft} ({albums.filter((a) => a.published === false).length})</option>
              <option value="featured">{t.admin.photography.filterFeatured} ({albums.filter((a) => a.featured).length})</option>
            </select>
            <button
              onClick={openCreateAlbumModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:opacity-95 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Icon name="plus" size={14} />
              <span>{t.admin.photography.addAlbum || "Thêm Album Mới"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Admin Title Info Banner */}
      <AdminHeader
        title={adminView === "photos" ? t.admin.photography.title : (t.admin.photography.tabAlbums || "Bộ Sưu Tập Nhiếp Ảnh")}
        description={adminView === "photos" ? t.admin.photography.description : "Quản lý các bộ sưu tập và chọn ảnh bìa đại diện độc đáo từ từng album."}
        icon={adminView === "photos" ? "camera" : "grid"}
      />

      {/* ── VIEW 1: PHOTOS & ARTWORKS LIST ── */}
      {adminView === "photos" && (
        <>
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
                const assignedAlbum = albums.find((a) => a.id === photo.albumId);

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

                      <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-cyan-300 backdrop-blur-md border border-white/10">
                          {photo.category}
                        </span>
                        {assignedAlbum && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-600/90 text-white backdrop-blur-md shadow-sm border border-violet-400/30">
                            📁 {assignedAlbum.title_vi || assignedAlbum.title}
                          </span>
                        )}
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
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${photo.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                          {photo.published !== false ? t.admin.common.published : t.admin.common.draft}
                        </button>
                      </div>
                    </div>

                    {/* Card Meta */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white line-clamp-1">
                            {photo.title}
                          </h3>
                          {photo.title_vi && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">
                              VI
                            </span>
                          )}
                        </div>
                        {photo.title_vi && photo.title_vi !== photo.title && (
                          <p className="text-xs text-slate-300 line-clamp-1 mb-1 font-medium italic">
                            {photo.title_vi}
                          </p>
                        )}
                        {(photo.description_vi || photo.description) && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {photo.description_vi || photo.description}
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
        </>
      )}

      {/* ── VIEW 2: ALBUMS LIST ── */}
      {adminView === "albums" && (
        <>
          {loadingAlbums ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              {t.admin.common.loading}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
              <Icon name="grid" size={32} className="text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">
                {t.admin.photography.noAlbumsTitle || "Chưa có Album nào"}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {t.admin.photography.noAlbumsDesc || "Tạo Album để gom nhóm các tác phẩm và chọn một ảnh làm ảnh bìa nổi bật."}
              </p>
              <button
                onClick={openCreateAlbumModal}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 transition-colors"
              >
                {t.admin.photography.addAlbum || "Thêm Album Mới"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAlbums.map((album) => {
                const photoCount = album.photoIds?.length || 0;

                return (
                  <div
                    key={album.id}
                    className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-cyan-500/40 transition-all shadow-md"
                  >
                    {/* Album Cover Thumbnail */}
                    <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                      {album.coverImage ? (
                        <Image
                          src={album.coverImage}
                          alt={album.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                          <Icon name="image" size={32} />
                          <span className="text-xs">Chưa có ảnh bìa</span>
                        </div>
                      )}

                      {/* Photo Count Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/75 text-cyan-300 backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5">
                          <span>🖼️</span>
                          <span>{photoCount} {t.admin.photography.photosCount || "ảnh"}</span>
                        </span>
                      </div>

                      {/* Featured & Published Status */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAlbumFeatured(album);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-all shadow-md ${
                            album.featured
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                              : "bg-black/70 text-slate-400 border-slate-700 hover:text-amber-300"
                          }`}
                        >
                          <span>{album.featured ? (t.admin.photography.markFeatured || "⭐ Nổi bật") : (t.admin.photography.setFeatured || "☆ Đặt nổi bật")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAlbumPublish(album);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-all shadow-md ${
                            album.published !== false
                              ? "bg-black/70 text-emerald-400 border-emerald-500/30"
                              : "bg-black/70 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${album.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                          {album.published !== false ? t.admin.common.published : t.admin.common.draft}
                        </button>
                      </div>
                    </div>

                    {/* Album Meta */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white line-clamp-1">
                            {album.title}
                          </h3>
                          {album.title_vi && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                              VI
                            </span>
                          )}
                        </div>
                        {album.title_vi && album.title_vi !== album.title && (
                          <p className="text-xs text-slate-300 line-clamp-1 mb-1 italic font-medium">
                            {album.title_vi}
                          </p>
                        )}
                        <span className="text-[11px] text-cyan-400/80 font-mono block mb-2">
                          /{album.slug}
                        </span>
                        {(album.description_vi || album.description) && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {album.description_vi || album.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <Link
                          href={`/photography/album/${album.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>{t.admin.photography.viewPublic || "Xem công khai"}</span>
                          <span>↗</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditAlbumModal(album)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-all"
                            title={t.admin.common.edit}
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteAlbumTarget(album)}
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
        </>
      )}

      {/* ── PHOTO CREATE / EDIT MODAL (Bilingual Supported) ── */}
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

        {/* EXIF notice */}
        {exifNotice && (
          <div className="mb-6 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5">
            <Icon name="aperture" size={16} className="text-cyan-400 flex-shrink-0" />
            <span>{exifNotice}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Upload File & Media to Cloudinary */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Icon name={formMediaType === "video" ? "video" : "image"} size={13} />
              <span>
                {formMediaType === "video" ? t.admin.photography.section1Video : t.admin.photography.section1Media}
              </span>
            </h3>

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

            {/* Main Image Upload Box */}
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

            {/* Before Image Upload Box */}
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
              </div>
            )}
          </div>

          {/* Section 2: Bilingual Basic Information */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {t.admin.photography.section2Basic}
              </h3>
            </div>

            {/* WordPress-style Language Tab Switcher */}
            <LanguageTabSelector
              activeLang={photoActiveLang}
              onChange={setPhotoActiveLang}
              hasTranslation={{
                en: !!formTitle,
                vi: !!formTitleVi,
              }}
              label="Translate Artwork / Dịch thông tin tác phẩm:"
            />

            {/* English Fields */}
            {photoActiveLang === "en" && (
              <div className="space-y-4 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <FormField label={`${t.admin.photography.fieldTitle} (English)`} id="title-en" required>
                  <input
                    id="title-en"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Neon Rain in Shinjuku"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <FormField label={`${t.admin.photography.fieldLocation} (English)`} id="location-en">
                  <input
                    id="location-en"
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Shinjuku, Tokyo, Japan"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <FormField label={`${t.admin.photography.fieldDescription} (English)`} id="description-en">
                  <textarea
                    id="description-en"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Story, context, or visual concept behind this artwork..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>
              </div>
            )}

            {/* Vietnamese Fields */}
            {photoActiveLang === "vi" && (
              <div className="space-y-4 p-4 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/15">
                <FormField label={`${t.admin.photography.fieldTitleVi || "Tiêu Đề Tác Phẩm"} (Tiếng Việt)`} id="title-vi">
                  <input
                    id="title-vi"
                    type="text"
                    value={formTitleVi}
                    onChange={(e) => setFormTitleVi(e.target.value)}
                    placeholder="ví dụ: Mưa Neon Tại Shinjuku"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <FormField label={`${t.admin.photography.fieldLocationVi || "Địa Điểm Chụp"} (Tiếng Việt)`} id="location-vi">
                  <input
                    id="location-vi"
                    type="text"
                    value={formLocationVi}
                    onChange={(e) => setFormLocationVi(e.target.value)}
                    placeholder="ví dụ: Shinjuku, Tokyo, Nhật Bản / Đà Lạt..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>

                <FormField label={`${t.admin.photography.fieldDescriptionVi || "Câu Chuyện & Cảm Hứng"} (Tiếng Việt)`} id="description-vi">
                  <textarea
                    id="description-vi"
                    rows={2}
                    value={formDescriptionVi}
                    onChange={(e) => setFormDescriptionVi(e.target.value)}
                    placeholder="Mô tả bối cảnh, câu chuyện hoặc cảm xúc đằng sau bức ảnh..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </FormField>
              </div>
            )}

            {/* Common Fields: Album Assignment & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label={t.admin.photography.fieldAlbum || "Thuộc Album / Bộ Sưu Tập"} id="photo-album">
                <select
                  id="photo-album"
                  value={formAlbumId}
                  onChange={(e) => setFormAlbumId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">{t.admin.photography.fieldAlbumNone || "-- Không gán vào Album nào --"}</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      📁 {album.title_vi || album.title}
                    </option>
                  ))}
                </select>
              </FormField>

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
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <FormField label={t.admin.photography.fieldDate} id="date">
                <input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </FormField>
            </div>

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

          {/* Section 3: Camera & EXIF Settings */}
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

          {/* Section 4: Post-Processing & Color Grading */}
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

      {/* ── ALBUM CREATE / EDIT MODAL (With Cover Photo Picker) ── */}
      <AdminModal
        isOpen={isCreatingAlbum || !!editingAlbum}
        onClose={closeAlbumModal}
        title={isCreatingAlbum ? (t.admin.photography.modalCreateAlbumTitle || "Tạo Album Mới") : (t.admin.photography.modalEditAlbumTitle || "Chỉnh Sửa Album")}
        subtitle={t.admin.photography.modalAlbumSubtitle || "Nhóm các tác phẩm vào bộ sưu tập. Chọn một ảnh bất kỳ trong album làm ảnh bìa đại diện."}
        icon="grid"
        onSubmit={handleSaveAlbum}
        saveLabel={isCreatingAlbum ? "Tạo Album" : t.admin.common.save}
        closeLabel={t.admin.common.close}
        isSaving={isSavingAlbum}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* WordPress-style Language Tab Switcher for Album */}
          <LanguageTabSelector
            activeLang={albumActiveLang}
            onChange={setAlbumActiveLang}
            hasTranslation={{
              en: !!formAlbumTitle,
              vi: !!formAlbumTitleVi,
            }}
            label="Translate Album / Dịch thông tin Album:"
          />

          {/* English Album Fields */}
          {albumActiveLang === "en" && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-900/40 border border-white/5">
              <FormField label={`${t.admin.photography.fieldAlbumTitle || "Album Title"} (English)`} id="album-title-en" required>
                <input
                  id="album-title-en"
                  type="text"
                  value={formAlbumTitle}
                  onChange={(e) => setFormAlbumTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Nights & Urban Rain"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </FormField>

              <FormField label={`${t.admin.photography.fieldAlbumDesc || "Album Description"} (English)`} id="album-desc-en">
                <textarea
                  id="album-desc-en"
                  rows={2}
                  value={formAlbumDesc}
                  onChange={(e) => setFormAlbumDesc(e.target.value)}
                  placeholder="Atmospheric summary of this collection..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </FormField>
            </div>
          )}

          {/* Vietnamese Album Fields */}
          {albumActiveLang === "vi" && (
            <div className="space-y-4 p-4 rounded-xl bg-cyan-500/[0.03] border border-cyan-500/15">
              <FormField label={`${t.admin.photography.fieldAlbumTitleVi || "Tên Album"} (Tiếng Việt)`} id="album-title-vi">
                <input
                  id="album-title-vi"
                  type="text"
                  value={formAlbumTitleVi}
                  onChange={(e) => setFormAlbumTitleVi(e.target.value)}
                  placeholder="ví dụ: Đêm Cyberpunk & Mưa Thành Thị"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </FormField>

              <FormField label={`${t.admin.photography.fieldAlbumDescVi || "Mô Tả Bộ Sưu Tập"} (Tiếng Việt)`} id="album-desc-vi">
                <textarea
                  id="album-desc-vi"
                  rows={2}
                  value={formAlbumDescVi}
                  onChange={(e) => setFormAlbumDescVi(e.target.value)}
                  placeholder="Mô tả bối cảnh, chủ đề và cảm xúc của album..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </FormField>
            </div>
          )}

          {/* Album Slug & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t.admin.photography.fieldAlbumSlug || "Đường Dẫn URL (Slug)"} id="album-slug">
              <input
                id="album-slug"
                type="text"
                value={formAlbumSlug}
                onChange={(e) => setFormAlbumSlug(e.target.value)}
                placeholder="ví dụ: cyberpunk-nights (tự động tạo nếu để trống)"
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
              />
            </FormField>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={formAlbumPublished}
                  onChange={(e) => setFormAlbumPublished(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-white/20 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>{t.admin.photography.publishedPublicly || "Xuất bản công khai"}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={formAlbumFeatured}
                  onChange={(e) => setFormAlbumFeatured(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-white/20 text-amber-500 focus:ring-amber-500/20"
                />
                <span>{t.admin.photography.featuredAlbum || "⭐ Album nổi bật"}</span>
              </label>
            </div>
          </div>

          {/* ── PHOTO SELECTION & COVER IMAGE SELECTION (CRITICAL FEATURE) ── */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Icon name="image" size={14} />
                  <span>{t.admin.photography.chooseCoverTitle || "Ảnh Trong Album & Chọn Ảnh Bìa Đại Diện"}</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.admin.photography.chooseCoverDesc || "Chọn các ảnh thuộc album. Nhấp vào nút '⭐ Đặt làm ảnh bìa' trên bất kỳ ảnh nào để chọn làm ảnh đại diện chính."}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {formAlbumPhotoIds.length} {t.admin.photography.photosCount || "ảnh"}
              </span>
            </div>

            {/* Current Cover Image Preview Box */}
            {formAlbumCoverImage && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-black border border-amber-500/40 shrink-0">
                    <Image
                      src={formAlbumCoverImage}
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                      ⭐ {t.admin.photography.coverBadge || "Ảnh Bìa Đại Diện Của Album"}
                    </span>
                    <span className="text-xs text-white font-medium line-clamp-1">
                      {photos.find((p) => p.id === formAlbumCoverPhotoId || p.image === formAlbumCoverImage)?.title || "Ảnh bìa đã chọn"}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-amber-300/80 italic shrink-0 hidden sm:inline">
                  (Hiển thị nổi bật trên thẻ Album và trang chi tiết)
                </span>
              </div>
            )}

            {/* Photos inside the album */}
            {formAlbumPhotoIds.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Danh sách ảnh trong album (nhấp ảnh để đổi ảnh bìa):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1.5 rounded-xl bg-slate-950/50 border border-white/5">
                  {formAlbumPhotoIds.map((photoId) => {
                    const photo = photos.find((p) => p.id === photoId);
                    if (!photo) return null;
                    const isCover =
                      formAlbumCoverPhotoId === photo.id || formAlbumCoverImage === photo.image;

                    return (
                      <div
                        key={photo.id}
                        onClick={() => handleSetCoverPhoto(photo)}
                        className={`relative group rounded-xl overflow-hidden cursor-pointer border transition-all ${
                          isCover
                            ? "ring-2 ring-amber-400 border-amber-400 shadow-lg shadow-amber-500/20"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full bg-black">
                          <Image
                            src={photo.image}
                            alt={photo.title}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />

                          {/* Cover badge */}
                          {isCover && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black shadow">
                                ⭐ Ảnh bìa
                              </span>
                            </div>
                          )}

                          {/* Remove from album button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePhotoInAlbum(photo.id);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 hover:bg-red-600 text-white transition-colors z-10"
                            title="Bỏ khỏi album"
                          >
                            <Icon name="close" size={11} />
                          </button>

                          {/* Overlay button to set as cover */}
                          {!isCover && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCoverPhoto(photo);
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold shadow transition-all"
                              >
                                Đặt làm bìa
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="p-1.5 bg-slate-900/90">
                          <p className="text-[11px] text-white font-medium truncate">
                            {photo.title_vi || photo.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-slate-400">
                Chưa có ảnh nào trong album này. Hãy chọn các ảnh từ kho thư viện bên dưới.
              </div>
            )}

            {/* Picker to add more photos to the album */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-300">
                  {t.admin.photography.selectPhotosForAlbum || "Chọn thêm ảnh từ thư viện:"}
                </span>
                <input
                  type="text"
                  value={photoSearchForAlbum}
                  onChange={(e) => setPhotoSearchForAlbum(e.target.value)}
                  placeholder="Lọc ảnh theo tên, chủ đề..."
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 w-48"
                />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-2 rounded-xl bg-slate-950/70 border border-white/10">
                {photos
                  .filter((p) => {
                    if (!photoSearchForAlbum.trim()) return true;
                    const q = photoSearchForAlbum.toLowerCase();
                    return (
                      p.title.toLowerCase().includes(q) ||
                      (p.title_vi && p.title_vi.toLowerCase().includes(q)) ||
                      p.category.toLowerCase().includes(q)
                    );
                  })
                  .sort((a, b) => {
                    const aSel = formAlbumPhotoIds.includes(a.id);
                    const bSel = formAlbumPhotoIds.includes(b.id);
                    if (aSel && !bSel) return -1;
                    if (!aSel && bSel) return 1;
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return (a.order ?? 0) - (b.order ?? 0);
                  })
                  .map((photo) => {
                    const isSelected = formAlbumPhotoIds.includes(photo.id);

                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => handleTogglePhotoInAlbum(photo.id)}
                        className={`relative rounded-lg overflow-hidden border text-left transition-all aspect-square ${
                          isSelected
                            ? "ring-2 ring-cyan-400 border-cyan-400 opacity-100"
                            : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                        }`}
                      >
                        <Image
                          src={photo.image}
                          alt={photo.title}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-1 right-1">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              isSelected
                                ? "bg-cyan-500 text-black"
                                : "bg-black/60 text-white border border-white/30"
                            }`}
                          >
                            {isSelected ? "✓" : "+"}
                          </span>
                        </div>
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-[9px] text-white font-medium truncate drop-shadow">
                            {photo.title_vi || photo.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* ── Confirm Delete Photo Dialog ── */}
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

      {/* ── Confirm Delete Album Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteAlbumTarget}
        title={t.admin.photography.deleteAlbumTitle || "Xác Nhận Xóa Album"}
        message={(t.admin.photography.deleteAlbumMessage || "Bạn có chắc chắn muốn xóa album \"{title}\"? Các ảnh thuộc album này vẫn sẽ được giữ lại trong thư viện.").replace("{title}", deleteAlbumTarget?.title || "")}
        confirmLabel={t.admin.photography.confirmDeleteAlbumBtn || "Xóa Album"}
        cancelLabel={t.admin.common.cancel}
        isDangerous={true}
        onConfirm={handleDeleteAlbum}
        onCancel={() => setDeleteAlbumTarget(null)}
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

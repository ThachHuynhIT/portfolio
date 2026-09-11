"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import FormField from "@/components/admin/FormField";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaImagePicker from "@/components/admin/MediaImagePicker";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/context/TranslationContext";
import type {
  CoupleData,
  CouplePhotoMemory,
  CoupleTimelineMemory,
  CoupleBirthday,
  CoupleSpecialDate,
  CoupleBucketItem,
  CoupleLoveLetter,
  CoupleFavorite,
} from "@/lib/types";

type TabId =
  | "photos"
  | "memories"
  | "dates"
  | "bucketList"
  | "loveLetters"
  | "favorites"
  | "info";

const POPULAR_PHOTO_CATEGORIES = ["Du lịch", "Hẹn hò", "Kỷ niệm", "Đời thường", "Ăn uống", "Đặc biệt"];
const SUGGESTED_EMOJIS = ["💕", "✨", "☕", "🎂", "🌹", "🎉", "🥂", "💍", "✈️", "🏖️", "🌙", "🎁", "👩‍🍳", "📸", "🐱", "🎵", "🎬", "🍲", "💝", "🌟"];

export default function CoupleAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabId>("photos");
  const [data, setData] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // Delete dialog state
  // -------------------------------------------------------------
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    section: string;
    id?: string;
    index?: number;
    title: string;
  }>({
    isOpen: false,
    section: "",
    title: "",
  });

  // -------------------------------------------------------------
  // Modals state
  // -------------------------------------------------------------
  // Photo modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<CouplePhotoMemory | null>(null);
  const [photoForm, setPhotoForm] = useState({
    title: "",
    image: "",
    date: "",
    location: "",
    category: "Kỷ niệm",
    description: "",
    featured: false,
    published: true,
  });

  // Timeline Memory modal
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<CoupleTimelineMemory | null>(null);
  const [memoryForm, setMemoryForm] = useState({
    title: "",
    date: "",
    emoji: "✨",
    description: "",
    published: true,
  });

  // Birthday modal
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<{ item: CoupleBirthday; index: number } | null>(null);
  const [birthdayForm, setBirthdayForm] = useState({
    name: "",
    date: "",
    emoji: "🎂",
    zodiac: "",
    published: true,
  });

  // Special Date modal
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<{ item: CoupleSpecialDate; index: number } | null>(null);
  const [dateForm, setDateForm] = useState({
    name: "",
    date: "",
    emoji: "💕",
    published: true,
  });

  // Bucket list modal
  const [isBucketModalOpen, setIsBucketModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<CoupleBucketItem | null>(null);
  const [bucketForm, setBucketForm] = useState({
    text: "",
    emoji: "🌟",
    done: false,
    published: true,
  });

  // Love letter modal
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<CoupleLoveLetter | null>(null);
  const [letterForm, setLetterForm] = useState({
    from: "",
    date: "",
    content: "",
    published: true,
  });

  // Favorite modal
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<CoupleFavorite | null>(null);
  const [favoriteForm, setFavoriteForm] = useState({
    category: "",
    title: "",
    description: "",
    emoji: "💝",
    published: true,
  });

  // Couple Info form
  const [infoForm, setInfoForm] = useState({
    person1: "",
    person2: "",
    anniversary: "",
    footerQuote: "",
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // Search & Filter for Photos
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [photoStatusFilter, setPhotoStatusFilter] = useState<"all" | "published" | "draft">("all");

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch("/api/admin/couple");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");

      const coupleData: CoupleData = await res.json();
      setData(coupleData);

      setInfoForm({
        person1: coupleData.person1 || "",
        person2: coupleData.person2 || "",
        anniversary: coupleData.anniversary || "",
        footerQuote: coupleData.footerQuote || "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải dữ liệu couple");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // Generic Delete Handler
  // -------------------------------------------------------------
  const executeDelete = async () => {
    const { section, id, index } = deleteDialog;
    try {
      let url = `/api/admin/couple?section=${section}`;
      if (id) url += `&id=${id}`;
      else if (index !== undefined) url += `&index=${index}`;

      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Đã xóa thành công!");
      setDeleteDialog({ isOpen: false, section: "", title: "" });
      await fetchData(false);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa mục");
    }
  };

  const handleTogglePublish = async (
    section: string,
    item: { id?: string; index?: number; published?: boolean; name?: string }
  ) => {
    const newStatus = item.published === false;
    try {
      const payload: any = {
        section,
        published: newStatus,
      };
      if (item.id) payload.id = item.id;
      if (item.index !== undefined) payload.index = item.index;
      if (item.name) payload.name = item.name;

      const res = await fetch("/api/admin/couple", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(newStatus ? "Đã chuyển sang Published (Công khai)!" : "Đã chuyển sang Draft (Nháp)!");
      await fetchData(false);
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const renderPublishBadge = (
    section: string,
    item: { id?: string; index?: number; published?: boolean; name?: string }
  ) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleTogglePublish(section, item);
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
        item.published !== false
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
      }`}
      title="Nhấn để đổi trạng thái Published / Draft"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          item.published !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
        }`}
      />
      {item.published !== false ? "Published" : "Draft"}
    </button>
  );

  // -------------------------------------------------------------
  // 1. Photos Handlers
  // -------------------------------------------------------------
  const openCreatePhoto = () => {
    setEditingPhoto(null);
    setPhotoForm({
      title: "",
      image: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      category: "Kỷ niệm",
      description: "",
      featured: false,
      published: true,
    });
    setIsPhotoModalOpen(true);
  };

  const openEditPhoto = (photo: CouplePhotoMemory) => {
    setEditingPhoto(photo);
    setPhotoForm({
      title: photo.title,
      image: photo.image,
      date: photo.date ? photo.date.split("T")[0] : "",
      location: photo.location || "",
      category: photo.category || "Kỷ niệm",
      description: photo.description || "",
      featured: Boolean(photo.featured),
      published: photo.published !== false,
    });
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.image) {
      toast.error("Vui lòng tải lên hoặc chọn ảnh!");
      return;
    }

    try {
      const payload = {
        section: "photos",
        id: editingPhoto?.id,
        ...photoForm,
      };

      const method = editingPhoto ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save photo");

      toast.success(editingPhoto ? "Cập nhật ảnh thành công!" : "Thêm ảnh mới thành công!");
      setIsPhotoModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu ảnh");
    }
  };

  // -------------------------------------------------------------
  // 2. Timeline Memories Handlers
  // -------------------------------------------------------------
  const openCreateMemory = () => {
    setEditingMemory(null);
    setMemoryForm({
      title: "",
      date: new Date().toLocaleDateString("vi-VN"),
      emoji: "✨",
      description: "",
      published: true,
    });
    setIsMemoryModalOpen(true);
  };

  const openEditMemory = (mem: CoupleTimelineMemory) => {
    setEditingMemory(mem);
    setMemoryForm({
      title: mem.title,
      date: mem.date,
      emoji: mem.emoji || "✨",
      description: mem.description || "",
      published: mem.published !== false,
    });
    setIsMemoryModalOpen(true);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        section: "memories",
        id: editingMemory?.id,
        ...memoryForm,
      };

      const method = editingMemory ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save memory");

      toast.success(editingMemory ? "Cập nhật mốc kỷ niệm thành công!" : "Thêm mốc kỷ niệm mới thành công!");
      setIsMemoryModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu mốc kỷ niệm");
    }
  };

  // -------------------------------------------------------------
  // 3. Birthdays & Special Dates Handlers
  // -------------------------------------------------------------
  const openCreateBirthday = () => {
    setEditingBirthday(null);
    setBirthdayForm({
      name: "",
      date: "2001-01-01",
      emoji: "🎂",
      zodiac: "",
      published: true,
    });
    setIsBirthdayModalOpen(true);
  };

  const openEditBirthday = (item: CoupleBirthday, index: number) => {
    setEditingBirthday({ item, index });
    setBirthdayForm({
      name: item.name,
      date: item.date,
      emoji: item.emoji || "🎂",
      zodiac: item.zodiac || "",
      published: item.published !== false,
    });
    setIsBirthdayModalOpen(true);
  };

  const handleSaveBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        section: "birthdays",
        index: editingBirthday?.index,
        id: editingBirthday?.item.id,
        ...birthdayForm,
      };

      const method = editingBirthday ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save birthday");

      toast.success(editingBirthday ? "Cập nhật ngày sinh thành công!" : "Thêm ngày sinh thành công!");
      setIsBirthdayModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu ngày sinh");
    }
  };

  const openCreateDate = () => {
    setEditingDate(null);
    setDateForm({
      name: "",
      date: new Date().toISOString().split("T")[0],
      emoji: "🎉",
      published: true,
    });
    setIsDateModalOpen(true);
  };

  const openEditDate = (item: CoupleSpecialDate, index: number) => {
    setEditingDate({ item, index });
    setDateForm({
      name: item.name,
      date: item.date,
      emoji: item.emoji || "🎉",
      published: item.published !== false,
    });
    setIsDateModalOpen(true);
  };

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        section: "specialDates",
        index: editingDate?.index,
        id: editingDate?.item.id,
        ...dateForm,
      };

      const method = editingDate ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save date");

      toast.success(editingDate ? "Cập nhật ngày đặc biệt thành công!" : "Thêm ngày đặc biệt thành công!");
      setIsDateModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu ngày đặc biệt");
    }
  };

  // -------------------------------------------------------------
  // 4. Bucket List Handlers
  // -------------------------------------------------------------
  const openCreateBucket = () => {
    setEditingBucket(null);
    setBucketForm({
      text: "",
      emoji: "🌟",
      done: false,
      published: true,
    });
    setIsBucketModalOpen(true);
  };

  const openEditBucket = (item: CoupleBucketItem) => {
    setEditingBucket(item);
    setBucketForm({
      text: item.text,
      emoji: item.emoji || "🌟",
      done: Boolean(item.done),
      published: item.published !== false,
    });
    setIsBucketModalOpen(true);
  };

  const handleSaveBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        section: "bucketList",
        id: editingBucket?.id,
        ...bucketForm,
      };

      const method = editingBucket ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save bucket item");

      toast.success(editingBucket ? "Cập nhật dự định thành công!" : "Thêm dự định mới thành công!");
      setIsBucketModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu dự định");
    }
  };

  const toggleBucketDone = async (item: CoupleBucketItem) => {
    if (!data) return;
    const updated = data.bucketList.map((b) =>
      b.id === item.id || b.text === item.text ? { ...b, done: !b.done } : b
    );
    // Optimistic update
    setData({ ...data, bucketList: updated });

    try {
      await fetch("/api/admin/couple", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "bucketList", items: updated }),
      });
      toast.success(item.done ? "Đã chuyển thành chưa xong" : "Đã hoàn thành! 🎉");
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái");
      fetchData(false);
    }
  };

  // -------------------------------------------------------------
  // 5. Love Letters Handlers
  // -------------------------------------------------------------
  const openCreateLetter = () => {
    setEditingLetter(null);
    setLetterForm({
      from: data?.person1 || "Anh",
      date: new Date().toLocaleDateString("vi-VN"),
      content: "",
      published: true,
    });
    setIsLetterModalOpen(true);
  };

  const openEditLetter = (letter: CoupleLoveLetter) => {
    setEditingLetter(letter);
    setLetterForm({
      from: letter.from,
      date: letter.date,
      content: letter.content,
      published: letter.published !== false,
    });
    setIsLetterModalOpen(true);
  };

  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        section: "loveLetters",
        id: editingLetter?.id,
        ...letterForm,
      };

      const method = editingLetter ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save letter");

      toast.success(editingLetter ? "Cập nhật thư tình thành công!" : "Gửi thư tình mới thành công! 💕");
      setIsLetterModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu thư");
    }
  };

  // -------------------------------------------------------------
  // 6. Favorites Handlers
  // -------------------------------------------------------------
  const openCreateFavorite = () => {
    setEditingFavorite(null);
    setFavoriteForm({
      category: "",
      title: "",
      description: "",
      emoji: "💝",
      published: true,
    });
    setIsFavoriteModalOpen(true);
  };

  const openEditFavorite = (fav: CoupleFavorite) => {
    setEditingFavorite(fav);
    setFavoriteForm({
      category: fav.category,
      title: fav.title,
      description: fav.description || "",
      emoji: fav.emoji || "💝",
      published: fav.published !== false,
    });
    setIsFavoriteModalOpen(true);
  };

  const handleSaveFavorite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        section: "favorites",
        id: editingFavorite?.id,
        ...favoriteForm,
      };

      const method = editingFavorite ? "PUT" : "POST";
      const res = await fetch("/api/admin/couple", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save favorite");

      toast.success(editingFavorite ? "Cập nhật sở thích thành công!" : "Thêm sở thích mới thành công!");
      setIsFavoriteModalOpen(false);
      await fetchData(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu sở thích");
    }
  };

  // -------------------------------------------------------------
  // 7. Couple Info Handlers
  // -------------------------------------------------------------
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const payload = {
        type: "info",
        person1: infoForm.person1.trim(),
        person2: infoForm.person2.trim(),
        anniversary: infoForm.anniversary.trim(),
        footerQuote: infoForm.footerQuote.trim(),
      };

      const res = await fetch("/api/admin/couple", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save info");

      toast.success("Cập nhật thông tin cặp đôi thành công!");
      await fetchData(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật thông tin");
    } finally {
      setSavingInfo(false);
    }
  };

  // Filtered photos
  const filteredPhotos = (data?.photos || []).filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesStatus =
      photoStatusFilter === "all"
        ? true
        : photoStatusFilter === "published"
        ? p.published !== false
        : p.published === false;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <AdminHeader
        title={t.admin.couple.title}
        description={t.admin.couple.description}
        icon="heart"
        action={
          activeTab === "photos" ? (
            <button
              onClick={openCreatePhoto}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
            >
              <span>+</span>
              <span>{t.admin.couple.addPhoto}</span>
            </button>
          ) : activeTab === "memories" ? (
            <button
              onClick={openCreateMemory}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
            >
              <span>+</span>
              <span>{t.admin.couple.addMemory}</span>
            </button>
          ) : activeTab === "bucketList" ? (
            <button
              onClick={openCreateBucket}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
            >
              <span>+</span>
              <span>{t.admin.couple.addBucket}</span>
            </button>
          ) : activeTab === "loveLetters" ? (
            <button
              onClick={openCreateLetter}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
            >
              <span>+</span>
              <span>{t.admin.couple.addLetter}</span>
            </button>
          ) : activeTab === "favorites" ? (
            <button
              onClick={openCreateFavorite}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
            >
              <span>+</span>
              <span>{t.admin.couple.addFavorite}</span>
            </button>
          ) : null
        }
      />

      {/* Modern Tabs Bar */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setActiveTab("photos")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "photos"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="camera" size={13} /> {t.admin.couple.tabs.photos}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {data?.photos?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("memories")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "memories"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="bookOpen" size={13} /> {t.admin.couple.tabs.memories}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {data?.memories?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dates")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "dates"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="cake" size={13} /> {t.admin.couple.tabs.dates}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {(data?.birthdays?.length || 0) + (data?.specialDates?.length || 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("bucketList")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "bucketList"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="checkCircle" size={13} /> {t.admin.couple.tabs.bucketList}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {data?.bucketList?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("loveLetters")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "loveLetters"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="mail" size={13} /> {t.admin.couple.tabs.loveLetters}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {data?.loveLetters?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("favorites")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "favorites"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="gift" size={13} /> {t.admin.couple.tabs.favorites}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
            {data?.favorites?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("info")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "info"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Icon name="settings" size={13} className="inline mr-1" /> {t.admin.couple.tabs.info}
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500">{t.admin.common.loading}</div>
      ) : activeTab === "photos" ? (
        /* ═════════════════ 1. TAB ẢNH KỶ NIỆM ═════════════════ */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={t.admin.couple.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
              />
              <span className="absolute left-3 top-2.5 text-slate-500"><Icon name="search" size={13} /></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">{t.admin.common.filter}:</span>
              <select
                value={photoStatusFilter}
                onChange={(e) => setPhotoStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-pink-500/50"
              >
                <option value="all">{t.admin.common.all} ({data?.photos?.length || 0})</option>
                <option value="published">{t.admin.common.published} ({(data?.photos || []).filter((p) => p.published !== false).length})</option>
                <option value="draft">{t.admin.common.draft} ({(data?.photos || []).filter((p) => p.published === false).length})</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-pink-500/50"
              >
                <option value="all">{t.admin.couple.allCategories}</option>
                {POPULAR_PHOTO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-slate-900/30">
              <div className="flex justify-center mb-3"><Icon name="image" size={32} /></div>
              <p className="text-slate-400 text-sm mb-4">{t.admin.common.noData}</p>
              <button
                onClick={openCreatePhoto}
                className="px-4 py-2 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-xl text-sm font-medium hover:bg-pink-600/30 transition-all"
              >
                + {t.admin.couple.addPhoto}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-slate-900/70 border border-white/8 rounded-2xl overflow-hidden group hover:border-pink-500/30 transition-all duration-200 flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {photo.category && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/60 backdrop-blur-md text-pink-300 border border-white/10">
                        {photo.category}
                      </span>
                    )}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      {photo.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-md">
                          <Icon name="heart" size={11} filled /> {t.admin.common.featured}
                        </span>
                      )}
                      {renderPublishBadge("photos", photo)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="inline-flex items-center gap-1"><Icon name="calendar" size={11} /> {photo.date}</span>
                        {photo.location && (
                          <span className="text-pink-400 font-medium truncate max-w-[140px] inline-flex items-center gap-1">
                            <Icon name="mapPin" size={11} /> {photo.location}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-base leading-snug line-clamp-1 mb-1">
                        {photo.title}
                      </h3>
                      {photo.description && (
                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                          {photo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => openEditPhoto(photo)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                      >
                        {t.admin.common.edit}
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            section: "photos",
                            id: photo.id,
                            title: photo.title,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                      >
                        {t.admin.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "memories" ? (
        /* ═════════════════ 2. TAB HÀNH TRÌNH TIMELINE ═════════════════ */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              {t.admin.couple.description}
            </p>
            <button
              onClick={openCreateMemory}
              className="px-3.5 py-1.5 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-semibold hover:bg-pink-600/30 transition-all"
            >
              + {t.admin.couple.addMemory}
            </button>
          </div>

          {(data?.memories || []).length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-slate-900/30">
              <div className="flex justify-center mb-3"><Icon name="bookOpen" size={32} /></div>
              <p className="text-slate-400 text-sm">{t.admin.common.noData}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.memories.map((mem, index) => (
                <div
                  key={mem.id || index}
                  className="bg-slate-900/60 border border-white/8 rounded-2xl p-4 flex items-start gap-4 hover:border-pink-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                    {mem.emoji || "✨"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {mem.date}
                      </span>
                      <h3 className="font-bold text-white text-base truncate">{mem.title}</h3>
                      {renderPublishBadge("memories", mem)}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{mem.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEditMemory(mem)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300"
                    >
                      {t.admin.common.edit}
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          section: "memories",
                          id: mem.id,
                          index,
                          title: mem.title,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                    >
                      {t.admin.common.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "dates" ? (
        /* ═════════════════ 3. TAB SINH NHẬT & NGÀY ĐẶC BIỆT ═════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột Sinh Nhật */}
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/8 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Icon name="cake" size={16} /> {t.admin.couple.tabs.dates}
                </h2>
                <p className="text-xs text-slate-400">{t.admin.couple.description}</p>
              </div>
              <button
                onClick={openCreateBirthday}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium"
              >
                + {t.admin.couple.addBirthday}
              </button>
            </div>

            <div className="space-y-3">
              {(data?.birthdays || []).map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="bg-slate-950/70 border border-white/5 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{b.emoji || "🎂"}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {b.name} <span className="text-pink-400 text-xs font-normal">({b.zodiac})</span>
                      </div>
                      <div className="text-xs text-slate-500">{t.admin.common.date}: {b.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {renderPublishBadge("birthdays", { ...b, index: idx })}
                    <button
                      onClick={() => openEditBirthday(b, idx)}
                      className="px-2.5 py-1 rounded text-xs text-slate-300 hover:bg-white/10"
                    >
                      {t.admin.common.edit}
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          section: "birthdays",
                          id: b.id,
                          index: idx,
                          title: b.name,
                        })
                      }
                      className="px-2.5 py-1 rounded text-xs text-rose-300 hover:bg-rose-500/20"
                    >
                      {t.admin.common.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột Ngày Đặc Biệt */}
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/8 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Icon name="calendar" size={16} /> {t.admin.couple.tabs.dates}
                </h2>
                <p className="text-xs text-slate-400">{t.admin.couple.description}</p>
              </div>
              <button
                onClick={openCreateDate}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium"
              >
                + {t.admin.couple.addDate}
              </button>
            </div>

            <div className="space-y-3">
              {(data?.specialDates || []).map((d, idx) => (
                <div
                  key={d.id || idx}
                  className="bg-slate-950/70 border border-white/5 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{d.emoji || "🎉"}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{d.name}</div>
                      <div className="text-xs text-slate-500">{t.admin.common.date}: {d.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {renderPublishBadge("specialDates", { ...d, index: idx })}
                    <button
                      onClick={() => openEditDate(d, idx)}
                      className="px-2.5 py-1 rounded text-xs text-slate-300 hover:bg-white/10"
                    >
                      {t.admin.common.edit}
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          section: "specialDates",
                          id: d.id,
                          index: idx,
                          title: d.name,
                        })
                      }
                      className="px-2.5 py-1 rounded text-xs text-rose-300 hover:bg-rose-500/20"
                    >
                      {t.admin.common.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === "bucketList" ? (
        /* ═════════════════ 4. TAB BUCKET LIST ═════════════════ */
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">{t.admin.couple.tabs.bucketList}</p>
              <p className="text-xs text-slate-400">
                {(data?.bucketList || []).filter((b) => b.done).length} /{" "}
                {data?.bucketList?.length || 0}
              </p>
            </div>
            <button
              onClick={openCreateBucket}
              className="px-3.5 py-1.5 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-semibold hover:bg-pink-600/30"
            >
              + {t.admin.couple.addBucket}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data?.bucketList || []).map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  item.done
                    ? "bg-slate-900/40 border-pink-500/20 opacity-80"
                    : "bg-slate-900/80 border-white/8 hover:border-pink-500/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleBucketDone(item)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-colors flex-shrink-0 ${
                      item.done
                        ? "bg-pink-600 border-pink-500 text-white"
                        : "border-slate-600 hover:border-pink-400 bg-slate-950"
                    }`}
                  >
                    {item.done && <Icon name="check" size={11} />}
                  </button>
                  <span className="text-lg flex-shrink-0">{item.emoji || "🌟"}</span>
                  <span
                    className={`text-sm truncate ${
                      item.done ? "line-through text-slate-400" : "text-white font-medium"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {renderPublishBadge("bucketList", item)}
                  <button
                    onClick={() => openEditBucket(item)}
                    className="p-1 text-slate-400 hover:text-white"
                    title={t.admin.common.edit}
                  >
                    <Icon name="edit" size={13} />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        section: "bucketList",
                        id: item.id,
                        index: idx,
                        title: item.text,
                      })
                    }
                    className="p-1 text-rose-400 hover:text-rose-300"
                    title={t.admin.common.delete}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "loveLetters" ? (
        /* ═════════════════ 5. TAB LỜI YÊU THƯƠNG ═════════════════ */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              {t.admin.couple.tabs.loveLetters}
            </p>
            <button
              onClick={openCreateLetter}
              className="px-3.5 py-1.5 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-semibold hover:bg-pink-600/30"
            >
              + {t.admin.couple.addLetter}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(data?.loveLetters || []).map((letter, idx) => (
              <div
                key={letter.id || idx}
                className="bg-slate-900/70 border border-white/8 rounded-2xl p-5 flex flex-col justify-between hover:border-pink-500/30 transition-all relative group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-pink-400 font-semibold mb-3">
                    <span className="inline-flex items-center gap-1"><Icon name="mail" size={12} /> {letter.from}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-normal">{letter.date}</span>
                      {renderPublishBadge("loveLetters", letter)}
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm italic leading-relaxed whitespace-pre-wrap mb-4">
                    &ldquo;{letter.content}&rdquo;
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => openEditLetter(letter)}
                    className="px-2.5 py-1 text-xs text-slate-300 bg-white/5 rounded-lg hover:bg-white/10"
                  >
                    {t.admin.common.edit}
                  </button>
                  <button
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        section: "loveLetters",
                        id: letter.id,
                        index: idx,
                        title: `Letter from ${letter.from}`,
                      })
                    }
                    className="px-2.5 py-1 text-xs text-rose-300 bg-rose-500/10 rounded-lg hover:bg-rose-500/20"
                  >
                    {t.admin.common.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "favorites" ? (
        /* ═════════════════ 6. TAB SỞ THÍCH CHUNG ═════════════════ */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              {t.admin.couple.tabs.favorites}
            </p>
            <button
              onClick={openCreateFavorite}
              className="px-3.5 py-1.5 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-semibold hover:bg-pink-600/30"
            >
              + {t.admin.couple.addFavorite}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.favorites || []).map((fav, idx) => (
              <div
                key={fav.id || idx}
                className="bg-slate-900/60 border border-white/8 rounded-2xl p-4 flex flex-col justify-between hover:border-pink-500/30 transition-all"
              >
                <div>
                  <div className="text-3xl mb-2">{fav.emoji || "💝"}</div>
                  <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider block mb-1">
                    {fav.category}
                  </span>
                  <h3 className="font-bold text-white text-base mb-1">{fav.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{fav.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                  {renderPublishBadge("favorites", fav)}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditFavorite(fav)}
                      className="px-2.5 py-1 text-xs text-slate-300 bg-white/5 rounded hover:bg-white/10"
                    >
                      {t.admin.common.edit}
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          section: "favorites",
                          id: fav.id,
                          index: idx,
                          title: fav.title,
                        })
                      }
                      className="px-2.5 py-1 text-xs text-rose-300 bg-rose-500/10 rounded hover:bg-rose-500/20"
                    >
                      {t.admin.common.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ═════════════════ 7. TAB CÀI ĐẶT THÔNG TIN CHUNG ═════════════════ */
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6 backdrop-blur-sm max-w-2xl">
          <form onSubmit={handleSaveInfo} className="space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">{t.admin.couple.tabs.info}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t.admin.couple.person1Label} id="person1" required>
                <input
                  type="text"
                  id="person1"
                  value={infoForm.person1}
                  onChange={(e) => setInfoForm({ ...infoForm, person1: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
                  required
                />
              </FormField>

              <FormField label={t.admin.couple.person2Label} id="person2" required>
                <input
                  type="text"
                  id="person2"
                  value={infoForm.person2}
                  onChange={(e) => setInfoForm({ ...infoForm, person2: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
                  required
                />
              </FormField>
            </div>

            <FormField
              label={t.admin.couple.anniversaryLabel}
              id="anniversary"
              hint="Format: YYYY-MM-DD HH:mm:ss"
              required
            >
              <input
                type="text"
                id="anniversary"
                value={infoForm.anniversary}
                onChange={(e) => setInfoForm({ ...infoForm, anniversary: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50 font-mono"
                placeholder="2025-05-30 21:00:00"
                required
              />
            </FormField>

            <FormField label={t.admin.couple.footerQuoteLabel} id="footerQuote">
              <textarea
                id="footerQuote"
                rows={3}
                value={infoForm.footerQuote}
                onChange={(e) => setInfoForm({ ...infoForm, footerQuote: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              />
            </FormField>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingInfo}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
              >
                {savingInfo ? t.admin.couple.savingConfig : t.admin.couple.saveConfig}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════ MODAL: ẢNH KỶ NIỆM ═════════════════ */}
      <AdminModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title={editingPhoto ? t.admin.couple.photoModalEdit : t.admin.couple.photoModalCreate}
        icon="heart"
        onSubmit={handleSavePhoto}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-2xl"
      >
        <MediaImagePicker
          label={t.admin.couple.tabs.photos}
          value={photoForm.image}
          onChange={(url) => setPhotoForm({ ...photoForm, image: url })}
          category="couple"
          subType="photo"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t.admin.photography.fieldTitle} id="photoTitle" required>
            <input
              type="text"
              id="photoTitle"
              value={photoForm.title}
              onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              placeholder={t.admin.photography.fieldTitlePlaceholder}
              required
            />
          </FormField>
          <FormField label={t.admin.photography.fieldDate} id="photoDate" required>
            <input
              type="date"
              id="photoDate"
              value={photoForm.date}
              onChange={(e) => setPhotoForm({ ...photoForm, date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              required
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t.admin.photography.fieldLocation} id="photoLocation">
            <input
              type="text"
              id="photoLocation"
              value={photoForm.location}
              onChange={(e) => setPhotoForm({ ...photoForm, location: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              placeholder={t.admin.photography.fieldLocationPlaceholder}
            />
          </FormField>
          <FormField label={t.admin.photography.fieldCategory} id="photoCategory">
            <input
              type="text"
              id="photoCategory"
              value={photoForm.category}
              onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            />
          </FormField>
        </div>
        <FormField label={t.admin.photography.fieldDescription} id="photoDescription">
          <textarea
            id="photoDescription"
            rows={3}
            value={photoForm.description}
            onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            placeholder={t.admin.photography.fieldDescriptionPlaceholder}
          />
        </FormField>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={photoForm.published}
              onChange={(e) => setPhotoForm({ ...photoForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={photoForm.featured}
              onChange={(e) => setPhotoForm({ ...photoForm, featured: e.target.checked })}
              className="rounded border-white/20 text-pink-600 focus:ring-pink-500 bg-slate-950 w-4 h-4"
            />
            <span className="inline-flex items-center gap-1"><Icon name="heart" size={13} /> {t.admin.photography.fieldFeatured}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ MODAL: TIMELINE MEMORY ═════════════════ */}
      <AdminModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        title={editingMemory ? t.admin.couple.memoryModalEdit : t.admin.couple.memoryModalCreate}
        icon="heart"
        onSubmit={handleSaveMemory}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-lg"
      >
        <FormField label={t.admin.photography.fieldTitle} id="memTitle" required>
          <input
            type="text"
            id="memTitle"
            value={memoryForm.title}
            onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t.admin.photography.fieldDate} id="memDate" required>
            <input
              type="text"
              id="memDate"
              value={memoryForm.date}
              onChange={(e) => setMemoryForm({ ...memoryForm, date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              required
            />
          </FormField>
          <FormField label="Emoji" id="memEmoji">
            <div className="space-y-1">
              <input
                type="text"
                id="memEmoji"
                value={memoryForm.emoji}
                onChange={(e) => setMemoryForm({ ...memoryForm, emoji: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              />
              <div className="flex gap-1 overflow-x-auto py-1">
                {SUGGESTED_EMOJIS.slice(0, 7).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setMemoryForm({ ...memoryForm, emoji: em })}
                    className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-xs"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </FormField>
        </div>
        <FormField label={t.admin.photography.fieldDescription} id="memDesc" required>
          <textarea
            id="memDesc"
            rows={3}
            value={memoryForm.description}
            onChange={(e) => setMemoryForm({ ...memoryForm, description: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={memoryForm.published}
              onChange={(e) => setMemoryForm({ ...memoryForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ MODAL: BIRTHDAY ═════════════════ */}
      <AdminModal
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        title={editingBirthday ? t.admin.couple.birthdayModalEdit : t.admin.couple.birthdayModalCreate}
        icon="heart"
        onSubmit={handleSaveBirthday}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-md"
      >
        <FormField label={t.admin.couple.person1Label} id="bdayName" required>
          <input
            type="text"
            id="bdayName"
            value={birthdayForm.name}
            onChange={(e) => setBirthdayForm({ ...birthdayForm, name: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <FormField label={t.admin.photography.fieldDate} id="bdayDate" required>
          <input
            type="date"
            id="bdayDate"
            value={birthdayForm.date}
            onChange={(e) => setBirthdayForm({ ...birthdayForm, date: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Zodiac" id="bdayZodiac">
            <input
              type="text"
              id="bdayZodiac"
              value={birthdayForm.zodiac}
              onChange={(e) => setBirthdayForm({ ...birthdayForm, zodiac: e.target.value })}
              placeholder="e.g. ♑ Capricorn"
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            />
          </FormField>
          <FormField label="Emoji" id="bdayEmoji">
            <input
              type="text"
              id="bdayEmoji"
              value={birthdayForm.emoji}
              onChange={(e) => setBirthdayForm({ ...birthdayForm, emoji: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            />
          </FormField>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={birthdayForm.published}
              onChange={(e) => setBirthdayForm({ ...birthdayForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ MODAL: SPECIAL DATE ═════════════════ */}
      <AdminModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title={editingDate ? t.admin.couple.dateModalEdit : t.admin.couple.dateModalCreate}
        icon="heart"
        onSubmit={handleSaveDate}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-md"
      >
        <FormField label={t.admin.photography.fieldTitle} id="dateName" required>
          <input
            type="text"
            id="dateName"
            value={dateForm.name}
            onChange={(e) => setDateForm({ ...dateForm, name: e.target.value })}
            placeholder={t.admin.photography.fieldTitlePlaceholder}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t.admin.photography.fieldDate} id="dateVal" required>
            <input
              type="date"
              id="dateVal"
              value={dateForm.date}
              onChange={(e) => setDateForm({ ...dateForm, date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              required
            />
          </FormField>
          <FormField label="Emoji" id="dateEmoji">
            <input
              type="text"
              id="dateEmoji"
              value={dateForm.emoji}
              onChange={(e) => setDateForm({ ...dateForm, emoji: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            />
          </FormField>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={dateForm.published}
              onChange={(e) => setDateForm({ ...dateForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ MODAL: BUCKET LIST ═════════════════ */}
      <AdminModal
        isOpen={isBucketModalOpen}
        onClose={() => setIsBucketModalOpen(false)}
        title={editingBucket ? t.admin.couple.bucketModalEdit : t.admin.couple.bucketModalCreate}
        icon="heart"
        onSubmit={handleSaveBucket}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-md"
      >
        <FormField label={t.admin.photography.fieldTitle} id="bucketText" required>
          <input
            type="text"
            id="bucketText"
            value={bucketForm.text}
            onChange={(e) => setBucketForm({ ...bucketForm, text: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <FormField label="Emoji" id="bucketEmoji">
          <div className="space-y-1">
            <input
              type="text"
              id="bucketEmoji"
              value={bucketForm.emoji}
              onChange={(e) => setBucketForm({ ...bucketForm, emoji: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            />
            <div className="flex gap-1 overflow-x-auto py-1">
              {SUGGESTED_EMOJIS.slice(0, 10).map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setBucketForm({ ...bucketForm, emoji: em })}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-xs"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </FormField>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={bucketForm.published}
              onChange={(e) => setBucketForm({ ...bucketForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={bucketForm.done}
              onChange={(e) => setBucketForm({ ...bucketForm, done: e.target.checked })}
              className="rounded border-white/20 text-pink-600 focus:ring-pink-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.common.completed}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ MODAL: LOVE LETTER ═════════════════ */}
      <AdminModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        title={editingLetter ? t.admin.couple.letterModalEdit : t.admin.couple.letterModalCreate}
        icon="heart"
        onSubmit={handleSaveLetter}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t.admin.couple.person1Label} id="letterFrom" required>
            <input
              type="text"
              id="letterFrom"
              value={letterForm.from}
              onChange={(e) => setLetterForm({ ...letterForm, from: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              required
            />
          </FormField>
          <FormField label={t.admin.photography.fieldDate} id="letterDate" required>
            <input
              type="text"
              id="letterDate"
              value={letterForm.date}
              onChange={(e) => setLetterForm({ ...letterForm, date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              required
            />
          </FormField>
        </div>
        <FormField label={t.admin.photography.fieldDescription} id="letterContent" required>
          <textarea
            id="letterContent"
            rows={4}
            value={letterForm.content}
            onChange={(e) => setLetterForm({ ...letterForm, content: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={letterForm.published}
              onChange={(e) => setLetterForm({ ...letterForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ MODAL: FAVORITE ═════════════════ */}
      <AdminModal
        isOpen={isFavoriteModalOpen}
        onClose={() => setIsFavoriteModalOpen(false)}
        title={editingFavorite ? t.admin.couple.favoriteModalEdit : t.admin.couple.favoriteModalCreate}
        icon="heart"
        onSubmit={handleSaveFavorite}
        saveLabel={t.admin.common.save}
        closeLabel={t.admin.common.close}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t.admin.photography.fieldCategory} id="favCategory" required>
            <input
              type="text"
              id="favCategory"
              value={favoriteForm.category}
              onChange={(e) => setFavoriteForm({ ...favoriteForm, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
              required
            />
          </FormField>
          <FormField label="Emoji" id="favEmoji">
            <input
              type="text"
              id="favEmoji"
              value={favoriteForm.emoji}
              onChange={(e) => setFavoriteForm({ ...favoriteForm, emoji: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            />
          </FormField>
        </div>
        <FormField label={t.admin.photography.fieldTitle} id="favTitle" required>
          <input
            type="text"
            id="favTitle"
            value={favoriteForm.title}
            onChange={(e) => setFavoriteForm({ ...favoriteForm, title: e.target.value })}
            placeholder={t.admin.photography.fieldTitlePlaceholder}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
            required
          />
        </FormField>
        <FormField label={t.admin.photography.fieldDescription} id="favDesc">
          <textarea
            id="favDesc"
            rows={2}
            value={favoriteForm.description}
            onChange={(e) => setFavoriteForm({ ...favoriteForm, description: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
          />
        </FormField>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
            <input
              type="checkbox"
              checked={favoriteForm.published}
              onChange={(e) => setFavoriteForm({ ...favoriteForm, published: e.target.checked })}
              className="rounded border-white/20 text-emerald-600 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
            />
            <span>{t.admin.photography.fieldPublished}</span>
          </label>
        </div>
      </AdminModal>

      {/* ═════════════════ CONFIRM DELETE DIALOG ═════════════════ */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={t.admin.couple.confirmDeleteTitle}
        message={t.admin.couple.confirmDeleteMessage.replace("{title}", deleteDialog.title)}
        confirmLabel={t.admin.common.delete}
        cancelLabel={t.admin.common.cancel}
        isDangerous
        onConfirm={executeDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, section: "", title: "" })}
      />
    </div>
  );
}

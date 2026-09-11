"use client";

import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./couple.module.css";
import type { CoupleData, CouplePhotoMemory } from "@/lib/types";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Icon from "@/components/ui/Icon";

// ============================================================
// 📝 DỮ LIỆU MẶC ĐỊNH (Fallback khi chưa tải xong API)
// ============================================================
const DEFAULT_COUPLE_DATA: CoupleData = {
  person1: "Cục Đá",
  person2: "Bé Mèo",
  anniversary: "2025-05-30 21:00:00",
  footerQuote: "\"Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.\"",
  birthdays: [
    { name: "Anh", date: "2001-01-18", emoji: "🎂", zodiac: "♑ Ma Kết" },
    { name: "Em", date: "2002-07-28", emoji: "🎀", zodiac: "♌ Sư Tử" },
  ],
  specialDates: [
    { name: "Ngày yêu nhau", date: "2025-05-30", emoji: "💕" },
    { name: "Kỷ niệm 1 năm", date: "2026-05-30", emoji: "🎉" },
    { name: "Kỷ niệm 2 năm", date: "2027-05-30", emoji: "🥂" },
  ],
  memories: [
    {
      id: "mem-1",
      date: "15/11/2023",
      title: "Lần đầu gặp nhau",
      description: "Khoảnh khắc định mệnh khi hai ta vô tình gặp nhau giữa dòng đời...",
      emoji: "✨",
    },
    {
      id: "mem-2",
      date: "30/05/2025",
      title: "Chính thức yêu nhau 💕",
      description: "Ngày bắt đầu câu chuyện tình yêu ngọt ngào của chúng ta.",
      emoji: "💗",
    },
  ],
  photos: [
    {
      id: "photo-1",
      title: "Hoàng hôn rực rỡ bên bờ biển",
      description: "Nắm tay nhau ngắm mặt trời lặn, nghe tiếng sóng vỗ và thấy bình yên lạ thường.",
      image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80",
      date: "2024-06-15",
      location: "Bãi biển Mỹ Khê, Đà Nẵng",
      category: "Du lịch",
      featured: true,
      order: 1,
    },
    {
      id: "photo-2",
      title: "Buổi hẹn hò đầu tiên",
      description: "Một ly latte ấm, một nụ cười ngượng ngùng và những câu chuyện không hồi kết.",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80",
      date: "2023-12-20",
      location: "The Coffee House quen thuộc",
      category: "Hẹn hò",
      featured: true,
      order: 2,
    },
    {
      id: "photo-3",
      title: "Chuyến đi săn mây Đà Lạt",
      description: "Sáng sớm lạnh tê tái nhưng có ai đó nắm tay thật chặt sưởi ấm.",
      image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
      date: "2024-09-02",
      location: "Đồi chè Cầu Đất, Đà Lạt",
      category: "Du lịch",
      featured: false,
      order: 3,
    },
    {
      id: "photo-4",
      title: "Cùng nhau nấu ăn cuối tuần",
      description: "Căn bếp nhỏ ngập tràn tiếng cười và mùi thức ăn thơm phức tự tay hai đứa nấu.",
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
      date: "2024-11-12",
      location: "Căn bếp nhỏ yêu thương",
      category: "Đời thường",
      featured: false,
      order: 4,
    },
  ],
  bucketList: [
    { text: "Đi du lịch Đà Lạt cùng nhau", emoji: "🏔️", done: true },
    { text: "Xem hoàng hôn trên biển", emoji: "🌅", done: true },
    { text: "Nấu ăn cùng nhau", emoji: "👩‍🍳", done: true },
    { text: "Chụp ảnh couple", emoji: "📸", done: true },
    { text: "Đi camping dưới trời sao", emoji: "⛺", done: false },
    { text: "Đi du lịch nước ngoài", emoji: "✈️", done: false },
    { text: "Cùng nuôi thú cưng", emoji: "🐱", done: false },
    { text: "Cùng xem pháo hoa đêm giao thừa", emoji: "🎆", done: true },
    { text: "Đạp xe quanh hồ", emoji: "🚲", done: false },
    { text: "Học nhảy cùng nhau", emoji: "💃", done: false },
  ],
  loveLetters: [
    {
      from: "Anh",
      content:
        "Em là điều tuyệt vời nhất đến với cuộc đời anh. Mỗi ngày bên em đều là một ngày hạnh phúc.",
      date: "14/02/2024",
    },
    {
      from: "Em",
      content:
        "Cảm ơn anh vì đã luôn bên em, luôn khiến em cười và luôn là bờ vai vững chắc cho em.",
      date: "01/01/2025",
    },
    {
      from: "Anh",
      content:
        "Nếu được chọn lại, anh vẫn sẽ chọn em, mãi mãi và luôn luôn. Em là nhà của anh.",
      date: "22/09/2024",
    },
  ],
  favorites: [
    {
      category: "Bài hát của chúng ta",
      title: "Perfect - Ed Sheeran",
      description: "Bài hát cho mọi khoảnh khắc",
      emoji: "🎵",
    },
    {
      category: "Món ăn yêu thích",
      title: "Lẩu Thái",
      description: "Cay cay, nóng nóng như tình yêu",
      emoji: "🍲",
    },
    {
      category: "Phim yêu thích",
      title: "Your Name (Kimi no Na wa)",
      description: "Vì em là định mệnh của anh",
      emoji: "🎬",
    },
    {
      category: "Nơi hẹn hò",
      title: "Quán cafe bên hồ",
      description: "Nơi bắt đầu câu chuyện tình yêu",
      emoji: "☕",
    },
    {
      category: "Hoạt động yêu thích",
      title: "Đi dạo buổi tối",
      description: "Ngắm sao và kể chuyện",
      emoji: "🌙",
    },
    {
      category: "Quà tặng đáng nhớ",
      title: "Chiếc vòng tay đôi",
      description: "Biểu tượng tình yêu",
      emoji: "💝",
    },
  ],
};

// ============================================================
// 🌍 COUPLE CONTEXT
// ============================================================
const CoupleContext = createContext<{
  data: CoupleData;
  loading: boolean;
}>({
  data: DEFAULT_COUPLE_DATA,
  loading: false,
});

const useCouple = () => useContext(CoupleContext);

// ============================================================
// 🧭 SECTIONS
// ============================================================
type SectionId =
  | "photos"
  | "birthdays"
  | "specialDates"
  | "memories"
  | "bucketList"
  | "loveLetters"
  | "favorites";

const SECTIONS: { id: SectionId; icon: string; title: string; subtitle: string }[] = [
  { id: "photos", icon: "camera", title: "Hình ảnh kỷ niệm", subtitle: "Khoảnh khắc yêu thương & kỷ niệm" },
  { id: "birthdays", icon: "cake", title: "Sinh nhật", subtitle: "Đếm ngược đến ngày đặc biệt" },
  { id: "specialDates", icon: "calendar", title: "Ngày đặc biệt", subtitle: "Những cột mốc quan trọng" },
  { id: "memories", icon: "bookOpen", title: "Hành trình tình yêu", subtitle: "Những khoảnh khắc đáng nhớ" },
  { id: "bucketList", icon: "checkCircle", title: "Bucket List", subtitle: "Những điều muốn cùng làm" },
  { id: "loveLetters", icon: "mail", title: "Những lời yêu thương", subtitle: "Gửi gắm tình cảm" },
  { id: "favorites", icon: "gift", title: "Những thứ của chúng ta", subtitle: "Our favorite things" },
];

// ============================================================
// 🔧 HELPERS
// ============================================================
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCountdown(targetDateStr: string) {
  const now = new Date();
  const today = startOfDay(now);
  const [, month, day] = targetDateStr.split("-").map(Number);

  let targetDate = new Date(now.getFullYear(), month - 1, day);
  if (targetDate < today) {
    targetDate = new Date(now.getFullYear() + 1, month - 1, day);
  }

  const diff = targetDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isPast: diff < 0 };
}

function getSpecialDateCountdown(dateStr: string) {
  const now = new Date();
  const today = startOfDay(now);
  const target = parseLocalDate(dateStr);

  const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days > 0) return `Còn ${days} ngày`;
  if (days === 0) return "Hôm nay! 🎉";
  return "Đã qua rồi 💫";
}

// ============================================================
// 💕 FLOATING HEARTS
// ============================================================
interface FloatingHeart {
  id: number;
  emoji: string;
  left: string;
  delay: string;
  duration: string;
  size: string;
}

function FloatingHearts() {
  // Randomized per-heart styling must only be computed on the client — doing
  // it in useMemo (which also runs during SSR) produces different random
  // values on the server vs. the client's first render, causing a hydration
  // mismatch. Starting empty and filling in after mount keeps SSR output
  // stable; the hearts are purely decorative so a one-frame delayed
  // appearance is imperceptible.
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    const heartEmojis = ["💕", "💗", "💖", "💝", "❤️", "💘", "💓", "🩷", "🩵"];
    setHearts(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        emoji: heartEmojis[i % heartEmojis.length],
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${9 + Math.random() * 12}s`,
        size: `${0.85 + Math.random() * 1.1}rem`,
      }))
    );
  }, []);

  return (
    <div className={styles.heartsBackground}>
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className={styles.floatingHeart}
          style={{
            left: heart.left,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            fontSize: heart.size,
          }}
        >
          {heart.emoji}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// 🏠 HERO SECTION
// ============================================================
function HeroSection() {
  const { t, locale } = useTranslation();
  const { data } = useCouple();
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const start = new Date(data.anniversary);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setElapsed({ days, hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [data.anniversary]);

  const years = Math.floor(elapsed.days / 365);
  const months = Math.floor((elapsed.days % 365) / 30);
  const remainingDays = elapsed.days % 30;

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroGlow} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.coupleNames}>
          <span className={styles.name}>{data.person1}</span>
          <motion.span
            className={styles.heartIcon}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon name="heart" size={28} filled />
          </motion.span>
          <span className={styles.name}>{data.person2}</span>
        </div>
      </motion.div>

      <motion.p
        className={styles.heroSubtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {years > 0 ? `${years} ${locale === "vi" ? "năm" : "years"} ` : ""}
        {months > 0 ? `${months} ${locale === "vi" ? "tháng" : "months"} ` : ""}
        {remainingDays} {locale === "vi" ? "ngày bên nhau 💕" : "days in love 💕"}
      </motion.p>

      <motion.div
        className={styles.heroDate}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Icon name="calendar" size={14} className="inline mr-1.5 -mt-0.5" /> {locale === "vi" ? "Bắt đầu từ" : "Started on"}{" "}
        {new Date(data.anniversary).toLocaleDateString(
          locale === "vi" ? "vi-VN" : "en-US",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )}
      </motion.div>

      <motion.div
        className={styles.statsGrid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.days}</div>
          <div className={styles.statLabel}>{t("couple.days")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.hours}</div>
          <div className={styles.statLabel}>{t("couple.hours")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.minutes}</div>
          <div className={styles.statLabel}>{t("couple.minutes")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.seconds}</div>
          <div className={styles.statLabel}>{t("couple.seconds")}</div>
        </div>
      </motion.div>
    </section>
  );
}

// ============================================================
// 📸 PHOTOS & MEMORIES SECTION (MỚI)
// ============================================================
function PhotosSection() {
  const { data } = useCouple();
  const photos = data.photos || [];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return ["all", ...Array.from(set)];
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "all") return photos;
    return photos.filter((p) => p.category === selectedCategory);
  }, [photos, selectedCategory]);

  const activePhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  // Key navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  return (
    <section className={styles.section}>
      <SectionHeader
        icon="camera"
        title="Hình ảnh kỷ niệm"
        subtitle="Những khoảnh khắc ngọt ngào đã cùng nhau trải qua"
      />

      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className={styles.photoFilterBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.photoFilterBtn} ${
                selectedCategory === cat ? styles.photoFilterBtnActive : ""
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "Tất cả khoảnh khắc" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className={styles.emptyGallery}>
          <p className="flex justify-center mb-2"><Icon name="camera" size={22} /></p>
          <p>Chưa có hình ảnh nào trong mục này.</p>
        </div>
      ) : (
        <div className={styles.photosGrid}>
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={photo.id || index}
              className={styles.photoCard}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              onClick={() => setLightboxIndex(index)}
            >
              <div className={styles.photoMediaWrapper}>
                <Image
                  src={photo.image}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  className={styles.photoImage}
                />
                {photo.category && (
                  <span className={styles.photoOverlayBadge}>{photo.category}</span>
                )}
                {photo.featured && (
                  <span className={styles.photoFeaturedBadge}>
                    <Icon name="heart" size={11} filled className="inline mr-1" />
                    Yêu thích
                  </span>
                )}
              </div>

              <div className={styles.photoContent}>
                <div className={styles.photoMeta}>
                  <span>
                    {new Date(photo.date).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {photo.location && (
                    <span className={styles.photoLocation}>
                      <Icon name="mapPin" size={11} className="inline mr-1" />
                      {photo.location}
                    </span>
                  )}
                </div>
                <h3 className={styles.photoTitle}>{photo.title}</h3>
                {photo.description && (
                  <p className={styles.photoDescription}>{photo.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className={styles.lightboxOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              className={styles.lightboxContainer}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                className={styles.lightboxCloseBtn}
                onClick={() => setLightboxIndex(null)}
                aria-label="Đóng"
              >
                <Icon name="close" size={16} />
              </button>

              {/* Prev / Next Arrows */}
              {filteredPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.lightboxNavBtn} ${styles.lightboxPrev}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
                      );
                    }}
                    aria-label="Ảnh trước"
                  >
                    <Icon name="chevronLeft" size={20} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.lightboxNavBtn} ${styles.lightboxNext}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) =>
                        prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
                      );
                    }}
                    aria-label="Ảnh tiếp"
                  >
                    <Icon name="chevronRight" size={20} />
                  </button>
                </>
              )}

              {/* Image Container */}
              <div className={styles.lightboxMedia}>
                <Image
                  src={activePhoto.image}
                  alt={activePhoto.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                  className={styles.lightboxImage}
                />
              </div>

              {/* Story & Details */}
              <div className={styles.lightboxDetails}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {activePhoto.category && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {activePhoto.category}
                      </span>
                    )}
                    {activePhoto.featured && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <Icon name="heart" size={11} filled /> Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
                    {activePhoto.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 mb-4 pb-3 border-b border-white/10">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="calendar" size={12} />
                      {new Date(activePhoto.date).toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {activePhoto.location && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="mapPin" size={12} /> {activePhoto.location}
                      </span>
                    )}
                  </div>
                  {activePhoto.description ? (
                    <p className="text-white/80 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {activePhoto.description}
                    </p>
                  ) : (
                    <p className="text-white/40 italic text-sm">Khoảnh khắc đáng nhớ của chúng mình.</p>
                  )}
                </div>

                <div className="pt-4 text-xs text-white/40 border-t border-white/5 flex justify-between items-center">
                  <span>
                    {lightboxIndex !== null ? lightboxIndex + 1 : 1} / {filteredPhotos.length}
                  </span>
                  <span>Nhấn ESC hoặc bấm ngoài để đóng</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ============================================================
// 🎂 BIRTHDAY SECTION
// ============================================================
function BirthdaySection() {
  const { data } = useCouple();
  return (
    <section className={styles.section}>
      <SectionHeader icon="cake" title="Sinh nhật" subtitle="Đếm ngược đến ngày đặc biệt" />
      <div className={styles.birthdayGrid}>
        {data.birthdays.map((person, i) => {
          const countdown = getCountdown(person.date);
          return (
            <motion.div
              key={person.name}
              className={styles.birthdayCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
            >
              <div className={styles.birthdayEmoji}>{person.emoji}</div>
              <div className={styles.birthdayName}>
                {person.name} {person.zodiac}
              </div>
              <div className={styles.birthdayDate}>
                {new Date(person.date).toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className={styles.birthdayCountdown}>
                <div className={styles.countdownItem}>
                  <div className={styles.countdownNumber}>{countdown.days}</div>
                  <div className={styles.countdownLabel}>Ngày</div>
                </div>
                <div className={styles.countdownItem}>
                  <div className={styles.countdownNumber}>{countdown.hours}</div>
                  <div className={styles.countdownLabel}>Giờ</div>
                </div>
                <div className={styles.countdownItem}>
                  <div className={styles.countdownNumber}>{countdown.minutes}</div>
                  <div className={styles.countdownLabel}>Phút</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// 📅 SPECIAL DATES SECTION
// ============================================================
function SpecialDatesSection() {
  const { data } = useCouple();
  return (
    <section className={styles.section}>
      <SectionHeader icon="calendar" title="Ngày đặc biệt" subtitle="Những cột mốc quan trọng" />
      <div className={styles.specialDatesGrid}>
        {data.specialDates.map((item, i) => (
          <motion.div
            key={item.name}
            className={styles.specialDateCard}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className={styles.specialDateEmoji}>{item.emoji}</div>
            <div className={styles.specialDateInfo}>
              <div className={styles.specialDateName}>{item.name}</div>
              <div className={styles.specialDateDate}>
                {new Date(item.date).toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className={styles.specialDateCountdown}>
                {getSpecialDateCountdown(item.date)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// 📖 MEMORY TIMELINE
// ============================================================
function MemoryTimeline() {
  const { data } = useCouple();
  return (
    <section className={styles.section}>
      <SectionHeader icon="bookOpen" title="Hành trình tình yêu" subtitle="Những khoảnh khắc đáng nhớ" />
      <div className={styles.timeline}>
        {data.memories.map((memory, i) => (
          <motion.div
            key={memory.id || i}
            className={styles.timelineItem}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
          >
            <div className={styles.timelineDot}>{memory.emoji || "💖"}</div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineDate}>{memory.date}</div>
              <div className={styles.timelineTitle}>{memory.title}</div>
              <div className={styles.timelineDesc}>{memory.description}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// ✅ BUCKET LIST
// ============================================================
function BucketListSection() {
  const { data } = useCouple();
  const [items, setItems] = useState(data.bucketList);

  useEffect(() => {
    setItems(data.bucketList);
  }, [data.bucketList]);

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
  };

  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <section className={styles.section}>
      <SectionHeader
        icon="checkCircle"
        title="Bucket List"
        subtitle={`${doneCount}/${items.length} đã hoàn thành`}
      />
      <div className={styles.bucketList}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            className={styles.bucketItem}
            onClick={() => toggleItem(i)}
            role="checkbox"
            aria-checked={item.done}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleItem(i);
              }
            }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className={`${styles.bucketCheckbox} ${item.done ? styles.bucketCheckboxDone : ""}`}
            >
              {item.done && <Icon name="check" size={12} />}
            </div>
            <span className={`${styles.bucketText} ${item.done ? styles.bucketTextDone : ""}`}>
              {item.text}
            </span>
            <span className={styles.bucketEmoji}>{item.emoji}</span>
          </motion.div>
        ))}
      </div>

      <div className={styles.loveProgress}>
        <div className={styles.progressTitle}>Tiến độ hoàn thành 💪</div>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progressFill}
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
        <div className={styles.progressText}>{progress}% - Còn nhiều thứ để khám phá! 🚀</div>
      </div>
    </section>
  );
}

// ============================================================
// 💌 LOVE LETTERS
// ============================================================
function LoveLettersSection() {
  const { data } = useCouple();
  return (
    <section className={styles.section}>
      <SectionHeader icon="mail" title="Những lời yêu thương" subtitle="Gửi gắm tình cảm" />
      <div className={styles.lettersGrid}>
        {data.loveLetters.map((letter, i) => (
          <motion.div
            key={i}
            className={styles.letterCard}
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
          >
            <div className={styles.letterFrom}>Từ {letter.from} 💕</div>
            <div className={styles.letterContent}>&ldquo;{letter.content}&rdquo;</div>
            <div className={styles.letterDate}>{letter.date}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// 🎵 FAVORITES / OUR THINGS
// ============================================================
function FavoritesSection() {
  const { data } = useCouple();
  return (
    <section className={styles.section}>
      <SectionHeader icon="gift" title="Những thứ của chúng ta" subtitle="Our favorite things" />
      <div className={styles.favoritesGrid}>
        {data.favorites.map((fav, i) => (
          <motion.div
            key={i}
            className={styles.favoriteCard}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
          >
            <div className={styles.favoriteEmoji}>{fav.emoji}</div>
            <div className={styles.favoriteCategory}>{fav.category}</div>
            <div className={styles.favoriteTitle}>{fav.title}</div>
            <div className={styles.favoriteDesc}>{fav.description}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// 🔧 SHARED COMPONENTS
// ============================================================
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIcon}><Icon name={icon} size={24} /></div>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================================
// 🧩 SECTION MENU GRID (trang chủ)
// ============================================================
function SectionMenuGrid({ onSelect }: { onSelect: (id: SectionId) => void }) {
  return (
    <div className={styles.sectionMenuGrid}>
      {SECTIONS.map((section, i) => (
        <motion.button
          key={section.id}
          type="button"
          className={styles.menuCard}
          onClick={() => onSelect(section.id)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className={styles.menuCardIcon}><Icon name={section.icon} size={28} /></div>
          <div className={styles.menuCardTitle}>{section.title}</div>
          <div className={styles.menuCardSubtitle}>{section.subtitle}</div>
        </motion.button>
      ))}
    </div>
  );
}

// ============================================================
// 🧭 BOTTOM NAV (nổi, cố định)
// ============================================================
function BottomNav({
  active,
  onNavigate,
}: {
  active: SectionId | "home";
  onNavigate: (id: SectionId | "home") => void;
}) {
  const items: { id: SectionId | "home"; icon: string; label: string }[] = [
    { id: "home", icon: "home", label: "Trang chủ" },
    ...SECTIONS.map((s) => ({ id: s.id, icon: s.icon, label: s.title })),
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Điều hướng nhanh">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
          >
            {isActive && (
              <motion.span
                layoutId="navIndicator"
                className={styles.navIndicator}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={styles.navIcon}><Icon name={item.icon} size={18} /></span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================
// 🏗️ MAIN PAGE
// ============================================================
const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  photos: PhotosSection,
  birthdays: BirthdaySection,
  specialDates: SpecialDatesSection,
  memories: MemoryTimeline,
  bucketList: BucketListSection,
  loveLetters: LoveLettersSection,
  favorites: FavoritesSection,
};

export default function CouplePage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SectionId | "home">("home");
  const [coupleData, setCoupleData] = useState<CoupleData>(DEFAULT_COUPLE_DATA);
  const [loading, setLoading] = useState(true);

  // Fetch live couple data
  useEffect(() => {
    fetch("/api/couple")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch");
      })
      .then((data: CoupleData) => {
        if (data && data.person1) {
          setCoupleData(data);
        }
      })
      .catch((err) => console.log("Using default couple data", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  const ActiveComponent =
    activeSection === "home" ? null : SECTION_COMPONENTS[activeSection];

  return (
    <CoupleContext.Provider value={{ data: coupleData, loading }}>
      <div className={styles.couplePage}>
        <FloatingHearts />

        {/* Floating Top Controls: Back to Portfolio & Language Switcher */}
        <div className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white text-xs backdrop-blur-xl shadow-lg transition-all active:scale-95"
          >
            <Icon name="arrowLeft" size={12} />
            <span>{t("couple.returnHome")}</span>
          </Link>
          <div className="pointer-events-auto">
            <LanguageSwitcher variant="pill" size="sm" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeSection === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <HeroSection />

              <div className={styles.sectionContainer}>
                <SectionMenuGrid onSelect={setActiveSection} />
              </div>

              <footer className={styles.coupleFooter}>
                <motion.p
                  className={styles.footerQuote}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  {coupleData.footerQuote}
                </motion.p>
                <div className={styles.footerHeart}><Icon name="heart" size={20} filled /></div>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key={activeSection}
              className={styles.sectionView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.sectionContainer}>
                {ActiveComponent && <ActiveComponent />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav active={activeSection} onNavigate={setActiveSection} />
      </div>
    </CoupleContext.Provider>
  );
}

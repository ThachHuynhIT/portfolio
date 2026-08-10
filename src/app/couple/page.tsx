"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./couple.module.css";

// ============================================================
// 📝 CẤU HÌNH - Thay đổi thông tin ở đây
// ============================================================
const COUPLE_CONFIG = {
  // Tên cặp đôi
  person1: "Cục Đá",
  person2: "Bé Mèo",

  // Ngày yêu nhau (YYYY-MM-DD)
  anniversary: "2025-05-30 21:00:00",

  // Ngày sinh
  birthdays: [
    { name: "Anh", date: "2001-01-18", emoji: "🎂", zodiac: "♑ Ma Kết" },
    { name: "Em", date: "2002-07-28", emoji: "🎀", zodiac: "♌ Sư Tử" },
  ],

  // Các ngày đặc biệt
  specialDates: [
    // { name: "Ngày gặp nhau lần đầu", date: "2023-11-15", emoji: "✨" },
    // { name: "Ngày hẹn hò đầu tiên", date: "2023-12-20", emoji: "🌹" },
    { name: "Ngày yêu nhau", date: "2025-05-30", emoji: "💕" },
    // { name: "Valentine", date: "2026-02-14", emoji: "❤️" },
    { name: "Kỷ niệm 1 năm", date: "2026-05-30", emoji: "🎉" },
    { name: "Kỷ niệm 2 năm", date: "2027-05-30", emoji: "🥂" },
  ],

  // Timeline kỷ niệm
  memories: [
    {
      date: "15/11/2023",
      title: "Lần đầu gặp nhau",
      description: "Khoảnh khắc định mệnh khi hai ta vô tình gặp nhau...",
      emoji: "✨",
    },
    // {
    //   date: "20/12/2023",
    //   title: "Buổi hẹn hò đầu tiên",
    //   description: "Cùng nhau đi dạo, uống cà phê và nói chuyện không ngừng.",
    //   emoji: "☕",
    // },
    // {
    //   date: "30/05/2025",
    //   title: "Chính thức yêu nhau 💕",
    //   description:
    //     "Ngày đầu tiên của năm mới, cũng là ngày bắt đầu câu chuyện tình yêu của chúng ta.",
    //   emoji: "💗",
    // },
    // {
    //   date: "14/02/2026",
    //   title: "Valentine đầu tiên",
    //   description:
    //     "Valentine đầu tiên bên nhau, tràn ngập hoa hồng và chocolate.",
    //   emoji: "🌹",
    // },
    // {
    //   date: "15/05/2024",
    //   title: "Sinh nhật Anh",
    //   description: "Em tổ chức sinh nhật surprise cho anh, hạnh phúc vô cùng!",
    //   emoji: "🎂",
    // },
    // {
    //   date: "22/09/2024",
    //   title: "Sinh nhật Em",
    //   description: "Anh chuẩn bị bất ngờ cho ngày sinh nhật của em.",
    //   emoji: "🎀",
    // },
    // {
    //   date: "01/01/2025",
    //   title: "Kỷ niệm 1 năm yêu nhau",
    //   description:
    //     "365 ngày bên nhau - mỗi ngày đều là một ngày đáng nhớ!",
    //   emoji: "🎉",
    // },
  ],

  // Bucket list
  bucketList: [
    { text: "Đi du lịch Đà Lạt cùng nhau", emoji: "🏔️", done: true },
    { text: "Xem hoàng hôn trên biển", emoji: "🌅", done: true },
    { text: "Nấu ăn cùng nhau", emoji: "👩‍🍳", done: true },
    { text: "Chụp ảnh couple", emoji: "📸", done: true },
    { text: "Đi camping dưới trời sao", emoji: "⛺", done: false },
    { text: "Đi du lịch nước ngoài", emoji: "✈️", done: false },
    { text: "Cùng nuôi thú cưng", emoji: "🐱", done: false },
    { text: "Cùng xem pháo hoa đêm giao thừa", emoji: "🎆", done: false },
    { text: "Đạp xe quanh hồ", emoji: "🚲", done: false },
    { text: "Học nhảy cùng nhau", emoji: "💃", done: false },
  ],

  // Love Letters
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

  // Favorites / Our Things
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

  // Quote cuối trang
  footerQuote:
    "\"Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.\"",
};

// ============================================================
// 🧭 SECTIONS - dùng chung cho lưới menu trang chủ và bottom nav
// ============================================================
type SectionId =
  | "birthdays"
  | "specialDates"
  | "memories"
  | "bucketList"
  | "loveLetters"
  | "favorites";

const SECTIONS: { id: SectionId; icon: string; title: string; subtitle: string }[] = [
  { id: "birthdays", icon: "🎂", title: "Sinh nhật", subtitle: "Đếm ngược đến ngày đặc biệt" },
  { id: "specialDates", icon: "📅", title: "Ngày đặc biệt", subtitle: "Những cột mốc quan trọng" },
  { id: "memories", icon: "📖", title: "Hành trình tình yêu", subtitle: "Những khoảnh khắc đáng nhớ" },
  { id: "bucketList", icon: "✅", title: "Bucket List", subtitle: "Những điều muốn cùng làm" },
  { id: "loveLetters", icon: "💌", title: "Những lời yêu thương", subtitle: "Gửi gắm tình cảm" },
  { id: "favorites", icon: "💝", title: "Những thứ của chúng ta", subtitle: "Our favorite things" },
];

// ============================================================
// 🔧 HELPERS
// ============================================================

// Parses a "YYYY-MM-DD" string as a local-timezone date (avoids the
// UTC-midnight parsing that plain `new Date(dateStr)` performs).
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
  // Compare by calendar day, not by exact timestamp — otherwise the
  // countdown rolls over to next year the moment midnight passes on
  // the target's own day, even though it hasn't happened yet today.
  if (targetDate < today) {
    targetDate = new Date(now.getFullYear() + 1, month - 1, day);
  }

  const diff = targetDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isPast: diff < 0 };
}

// Special dates are one-time historical milestones (each already has its
// own explicit year), not recurring yearly events — so a past one should
// simply read as "already happened", not get rolled forward into a fake
// upcoming occurrence that can collide with a genuinely future entry.
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
function FloatingHearts() {
  const hearts = useMemo(() => {
    const heartEmojis = ["💕", "💗", "💖", "💝", "❤️", "💘", "💓", "🩷", "🩵"];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: heartEmojis[i % heartEmojis.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${0.8 + Math.random() * 1.2}rem`,
    }));
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
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const start = new Date(COUPLE_CONFIG.anniversary);
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
  }, []);

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
          <span className={styles.name}>{COUPLE_CONFIG.person1}</span>
          <motion.span
            className={styles.heartIcon}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ❤️
          </motion.span>
          <span className={styles.name}>{COUPLE_CONFIG.person2}</span>
        </div>
      </motion.div>

      <motion.p
        className={styles.heroSubtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {years > 0 ? `${years} năm ` : ""}
        {months > 0 ? `${months} tháng ` : ""}
        {remainingDays} ngày bên nhau 💕
      </motion.p>

      <motion.div
        className={styles.heroDate}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        📅 Bắt đầu từ {new Date(COUPLE_CONFIG.anniversary).toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </motion.div>

      <motion.div
        className={styles.statsGrid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.days}</div>
          <div className={styles.statLabel}>Ngày</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.hours}</div>
          <div className={styles.statLabel}>Giờ</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.minutes}</div>
          <div className={styles.statLabel}>Phút</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{elapsed.seconds}</div>
          <div className={styles.statLabel}>Giây</div>
        </div>
      </motion.div>
    </section>
  );
}

// ============================================================
// 🎂 BIRTHDAY SECTION
// ============================================================
function BirthdaySection() {
  return (
    <section className={styles.section}>
      <SectionHeader icon="🎂" title="Sinh nhật" subtitle="Đếm ngược đến ngày đặc biệt" />
      <div className={styles.birthdayGrid}>
        {COUPLE_CONFIG.birthdays.map((person, i) => {
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
  return (
    <section className={styles.section}>
      <SectionHeader icon="📅" title="Ngày đặc biệt" subtitle="Những cột mốc quan trọng" />
      <div className={styles.specialDatesGrid}>
        {COUPLE_CONFIG.specialDates.map((item, i) => (
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
  return (
    <section className={styles.section}>
      <SectionHeader icon="📖" title="Hành trình tình yêu" subtitle="Những khoảnh khắc đáng nhớ" />
      <div className={styles.timeline}>
        {COUPLE_CONFIG.memories.map((memory, i) => (
          <motion.div
            key={i}
            className={styles.timelineItem}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
          >
            <div className={styles.timelineDot}>{memory.emoji}</div>
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
  const [items, setItems] = useState(COUPLE_CONFIG.bucketList);

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
  };

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <section className={styles.section}>
      <SectionHeader
        icon="✅"
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
              {item.done && "✓"}
            </div>
            <span className={`${styles.bucketText} ${item.done ? styles.bucketTextDone : ""}`}>
              {item.text}
            </span>
            <span className={styles.bucketEmoji}>{item.emoji}</span>
          </motion.div>
        ))}
      </div>

      <div className={styles.loveProgress}>
        <div className={styles.progressTitle}>
          Tiến độ hoàn thành 💪
        </div>
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
  return (
    <section className={styles.section}>
      <SectionHeader icon="💌" title="Những lời yêu thương" subtitle="Gửi gắm tình cảm" />
      <div className={styles.lettersGrid}>
        {COUPLE_CONFIG.loveLetters.map((letter, i) => (
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
  return (
    <section className={styles.section}>
      <SectionHeader icon="💝" title="Những thứ của chúng ta" subtitle="Our favorite things" />
      <div className={styles.favoritesGrid}>
        {COUPLE_CONFIG.favorites.map((fav, i) => (
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
      <div className={styles.sectionIcon}>{icon}</div>
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
          transition={{ delay: i * 0.08, duration: 0.5 }}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className={styles.menuCardIcon}>{section.icon}</div>
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
    { id: "home", icon: "🏠", label: "Trang chủ" },
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
            <span className={styles.navIcon}>{item.icon}</span>
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
  birthdays: BirthdaySection,
  specialDates: SpecialDatesSection,
  memories: MemoryTimeline,
  bucketList: BucketListSection,
  loveLetters: LoveLettersSection,
  favorites: FavoritesSection,
};

export default function CouplePage() {
  const [activeSection, setActiveSection] = useState<SectionId | "home">("home");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  const ActiveComponent =
    activeSection === "home" ? null : SECTION_COMPONENTS[activeSection];

  return (
    <div className={styles.couplePage}>
      <FloatingHearts />

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
                {COUPLE_CONFIG.footerQuote}
              </motion.p>
              <div className={styles.footerHeart}>❤️</div>
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
            <button
              type="button"
              className={styles.backButton}
              onClick={() => setActiveSection("home")}
            >
              ← Trang chủ
            </button>
            <div className={styles.sectionContainer}>
              {ActiveComponent && <ActiveComponent />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active={activeSection} onNavigate={setActiveSection} />
    </div>
  );
}

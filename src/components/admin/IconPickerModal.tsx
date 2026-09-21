"use client";

import { useState } from "react";
import AdminModal from "@/components/admin/AdminModal";
import Icon, { TECH_BRAND_ICON_NAMES, SOCIAL_BRAND_ICON_NAMES } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { gap } from "@/lib/design-tokens";

/**
 * A general-purpose curated emoji set for content that's purely decorative
 * (e.g. the couple page's memories/dates/bucket-list/favorites). Intentionally
 * broader than any single section's needs so one shared list works everywhere.
 */
const DEFAULT_EMOJI_OPTIONS = [
  "✨", "🎉", "🥂", "💍", "✈️", "🏖️", "🌙", "🎁", "🐱", "🎵",
  "🎬", "🍲", "🌟", "🔥", "☕", "🌹", "💐", "🎂", "🎈", "🎊",
  "🏔️", "🌅", "🚲", "💃", "⛺", "🎆", "👩‍🍳", "📸", "💌", "💝",
  "💕", "💗", "💖", "💘", "💓", "🩷", "🩵", "❤️", "🤍", "⭐",
];

export type IconPickerCategory = "tech" | "social" | "emoji";

export interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Currently selected value, highlighted in the grid if present. */
  value?: string;
  onSelect: (value: string) => void;
  /** Which category tabs to show, in order. The first is shown initially. */
  categories: IconPickerCategory[];
  title?: string;
}

const CATEGORY_LABELS: Record<IconPickerCategory, string> = {
  tech: "Logo công nghệ",
  social: "Logo mạng xã hội",
  emoji: "Emoji",
};

export default function IconPickerModal({
  isOpen,
  onClose,
  value,
  onSelect,
  categories,
  title = "Chọn icon",
}: IconPickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<IconPickerCategory>(categories[0]);

  if (!isOpen) return null;

  const handlePick = (picked: string) => {
    onSelect(picked);
    onClose();
  };

  const brandNames: readonly string[] =
    activeCategory === "tech"
      ? TECH_BRAND_ICON_NAMES
      : activeCategory === "social"
        ? SOCIAL_BRAND_ICON_NAMES
        : [];

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title} hideFooter maxWidth="max-w-lg">
      {categories.length > 1 && (
        <div className="flex gap-1.5 mb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {activeCategory === "emoji" ? (
        <div className={cn("grid grid-cols-8", gap.tight, "max-h-72 overflow-y-auto p-1")}>
          {DEFAULT_EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handlePick(emoji)}
              className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110 hover:bg-white/10 ${
                value === emoji ? "bg-violet-600/30 ring-2 ring-violet-500" : "bg-white/5"
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-5", gap.tight, "max-h-72 overflow-y-auto p-1")}>
          {brandNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handlePick(name)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 p-2 transition-all hover:scale-105 hover:bg-white/10 ${
                value === name ? "bg-violet-600/30 ring-2 ring-violet-500" : "bg-white/5"
              }`}
              title={name}
            >
              <Icon name={name} size={24} />
              <span className="text-[9px] text-slate-400 capitalize truncate w-full text-center">
                {name}
              </span>
            </button>
          ))}
        </div>
      )}
    </AdminModal>
  );
}

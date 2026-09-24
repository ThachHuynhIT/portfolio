/**
 * Mèo Nổ card catalogue for the UI: names, looks, rules text (in our own words)
 * and which pack a card comes from. Types mirror be_game src/meono/cards.ts.
 */
export type CardType =
  | "exploding"
  | "defuse"
  | "attack"
  | "skip"
  | "favor"
  | "shuffle"
  | "future"
  | "nope"
  | "taco"
  | "melon"
  | "potato"
  | "beard"
  | "rainbow"
  | "imploding"
  | "reverse"
  | "bottom"
  | "feral"
  | "alter"
  | "targeted"
  | "superskip"
  | "swap"
  | "catomic";

export type Expansion = "imploding" | "chaos";

export interface MCard {
  id: number;
  type: CardType;
  faceUp?: boolean;
}

export const CAT_TYPES: CardType[] = ["taco", "melon", "potato", "beard", "rainbow"];
export const WILD_CAT: CardType = "feral";
export const ACTION_TYPES: CardType[] = [
  "attack",
  "skip",
  "favor",
  "shuffle",
  "future",
  "reverse",
  "bottom",
  "alter",
  "targeted",
  "superskip",
  "swap",
  "catomic",
];
/** Cards that need a target player when played alone. */
export const TARGETED_TYPES: CardType[] = ["favor", "targeted"];

export type Pack = "base" | Expansion;

export interface CardInfo {
  name: string;
  emoji: string;
  /** Tailwind gradient classes for the card face. */
  color: string;
  pack: Pack;
  count: number;
  /** When / how you play it. */
  how: string;
  /** What it does. */
  effect: string;
}

export const PACKS: Record<Pack, { name: string; emoji: string; blurb: string }> = {
  base: { name: "Bộ cơ bản", emoji: "🐱", blurb: "56 lá, 2–5 người." },
  imploding: {
    name: "Gói Mèo Tự Huỷ",
    emoji: "🌀",
    blurb: "Thêm Mèo Tự Huỷ không thể gỡ, đảo chiều, rút từ đáy, mèo hoang… Chơi tới 6 người.",
  },
  chaos: { name: "Gói Hỗn Loạn", emoji: "☢️", blurb: "Siêu bỏ lượt, đổi đầu đuôi chồng bài và Bom Mèo Nguyên Tử." },
};

export const CARDS: Record<CardType, CardInfo> = {
  exploding: {
    name: "Mèo Nổ",
    emoji: "💣",
    color: "from-zinc-900 to-rose-900",
    pack: "base",
    count: 4,
    how: "Không đánh được — chỉ xuất hiện khi bạn rút phải.",
    effect: "Rút phải là nổ tung và bị loại, trừ khi bạn đánh ngay một lá Gỡ bom.",
  },
  defuse: {
    name: "Gỡ bom",
    emoji: "🧯",
    color: "from-lime-400 to-emerald-600",
    pack: "base",
    count: 6,
    how: "Tự động dùng khi bạn rút phải Mèo Nổ.",
    effect: "Cứu bạn khỏi Mèo Nổ. Sau đó bạn bí mật nhét quả bom vào bất kỳ vị trí nào trong chồng bài.",
  },
  attack: {
    name: "Tấn công",
    emoji: "⚔️",
    color: "from-orange-400 to-red-600",
    pack: "base",
    count: 4,
    how: "Đánh trong lượt của bạn.",
    effect:
      "Kết thúc lượt mà không rút bài. Người kế tiếp phải chơi 2 lượt. Nếu người bị tấn công đánh Tấn công tiếp, số lượt dồn lại (còn lại + 2) cho người sau.",
  },
  skip: {
    name: "Bỏ lượt",
    emoji: "⏭️",
    color: "from-sky-400 to-blue-600",
    pack: "base",
    count: 4,
    how: "Đánh trong lượt của bạn.",
    effect: "Kết thúc một lượt mà không phải rút bài. Nếu đang bị tấn công, chỉ bỏ được 1 trong số các lượt.",
  },
  favor: {
    name: "Xin xỏ",
    emoji: "🙏",
    color: "from-zinc-600 to-zinc-800",
    pack: "base",
    count: 4,
    how: "Đánh trong lượt của bạn, chọn một người.",
    effect: "Người đó phải tự chọn 1 lá trên tay và đưa cho bạn.",
  },
  shuffle: {
    name: "Xáo bài",
    emoji: "🔀",
    color: "from-amber-600 to-yellow-800",
    pack: "base",
    count: 4,
    how: "Đánh trong lượt của bạn.",
    effect: "Xáo ngẫu nhiên chồng bài rút — hữu ích khi biết Mèo Nổ đang nằm trên đầu.",
  },
  future: {
    name: "Xem tương lai",
    emoji: "🔮",
    color: "from-fuchsia-500 to-pink-700",
    pack: "base",
    count: 5,
    how: "Đánh trong lượt của bạn.",
    effect: "Bí mật xem 3 lá trên cùng của chồng bài (không đổi thứ tự).",
  },
  nope: {
    name: "Không!",
    emoji: "🚫",
    color: "from-red-600 to-rose-800",
    pack: "base",
    count: 5,
    how: "Đánh bất cứ lúc nào có người vừa đánh lá hành động — kể cả không phải lượt bạn.",
    effect:
      "Huỷ lá hành động đó (trừ Mèo Nổ và Gỡ bom). Có thể “Không!” lại một lá “Không!” để khôi phục hành động. Mỗi lá hành động có vài giây để mọi người phản ứng.",
  },
  taco: {
    name: "Mèo Taco",
    emoji: "🌮",
    color: "from-yellow-300 to-orange-400",
    pack: "base",
    count: 4,
    how: "Không có tác dụng khi đứng một mình — đánh theo đôi hoặc bộ ba.",
    effect: "Đôi: rút ngẫu nhiên 1 lá của người khác. Bộ ba: gọi tên 1 lá, nếu người đó có thì phải đưa cho bạn.",
  },
  melon: {
    name: "Mèo Dưa Hấu",
    emoji: "🍉",
    color: "from-green-400 to-rose-400",
    pack: "base",
    count: 4,
    how: "Đánh theo đôi hoặc bộ ba (giống mọi lá mèo).",
    effect: "Đôi: rút ngẫu nhiên 1 lá. Bộ ba: gọi tên 1 lá để lấy.",
  },
  potato: {
    name: "Mèo Khoai Tây",
    emoji: "🥔",
    color: "from-amber-300 to-amber-600",
    pack: "base",
    count: 4,
    how: "Đánh theo đôi hoặc bộ ba.",
    effect: "Đôi: rút ngẫu nhiên 1 lá. Bộ ba: gọi tên 1 lá để lấy.",
  },
  beard: {
    name: "Mèo Râu",
    emoji: "🧔",
    color: "from-stone-300 to-stone-500",
    pack: "base",
    count: 4,
    how: "Đánh theo đôi hoặc bộ ba.",
    effect: "Đôi: rút ngẫu nhiên 1 lá. Bộ ba: gọi tên 1 lá để lấy.",
  },
  rainbow: {
    name: "Mèo Cầu Vồng",
    emoji: "🌈",
    color: "from-violet-400 via-sky-400 to-emerald-400",
    pack: "base",
    count: 4,
    how: "Đánh theo đôi hoặc bộ ba.",
    effect: "Đôi: rút ngẫu nhiên 1 lá. Bộ ba: gọi tên 1 lá để lấy.",
  },
  imploding: {
    name: "Mèo Tự Huỷ",
    emoji: "🌀",
    color: "from-indigo-900 to-violet-700",
    pack: "imploding",
    count: 1,
    how: "Không đánh được — chỉ xuất hiện khi rút phải.",
    effect:
      "Lần rút đầu: lật ngửa lá và nhét lại vào chồng bài (ai cũng thấy vị trí của nó). Lần rút thứ hai: bị loại ngay, Gỡ bom không cứu được.",
  },
  reverse: {
    name: "Đảo chiều",
    emoji: "🔁",
    color: "from-teal-400 to-cyan-700",
    pack: "imploding",
    count: 4,
    how: "Đánh trong lượt của bạn.",
    effect: "Đổi chiều vòng chơi và kết thúc lượt mà không rút bài (chơi 2 người thì giống Bỏ lượt).",
  },
  bottom: {
    name: "Rút từ đáy",
    emoji: "⤵️",
    color: "from-slate-400 to-slate-700",
    pack: "imploding",
    count: 4,
    how: "Đánh trong lượt của bạn.",
    effect: "Kết thúc lượt bằng cách rút lá dưới cùng thay vì lá trên cùng.",
  },
  feral: {
    name: "Mèo Hoang",
    emoji: "🐾",
    color: "from-neutral-700 to-neutral-900",
    pack: "imploding",
    count: 4,
    how: "Ghép cùng bất kỳ lá mèo nào để thành đôi hoặc bộ ba.",
    effect: "Lá mèo “joker” — thay thế cho mọi loại mèo khi ghép bộ.",
  },
  alter: {
    name: "Sửa tương lai",
    emoji: "🪄",
    color: "from-purple-500 to-indigo-700",
    pack: "imploding",
    count: 4,
    how: "Đánh trong lượt của bạn.",
    effect: "Xem 3 lá trên cùng rồi tự sắp xếp lại thứ tự của chúng theo ý bạn.",
  },
  targeted: {
    name: "Tấn công chỉ định",
    emoji: "🎯",
    color: "from-red-500 to-orange-700",
    pack: "imploding",
    count: 3,
    how: "Đánh trong lượt của bạn, chọn một người.",
    effect: "Giống Tấn công, nhưng bạn chọn ai phải chơi 2 lượt. Vòng chơi tiếp tục từ người đó.",
  },
  superskip: {
    name: "Siêu bỏ lượt",
    emoji: "⏩",
    color: "from-blue-500 to-indigo-800",
    pack: "chaos",
    count: 2,
    how: "Đánh trong lượt của bạn.",
    effect: "Kết thúc TẤT CẢ các lượt bạn đang phải chơi (kể cả khi bị tấn công nhiều lượt).",
  },
  swap: {
    name: "Đổi đầu đuôi",
    emoji: "🔃",
    color: "from-emerald-500 to-teal-800",
    pack: "chaos",
    count: 3,
    how: "Đánh trong lượt của bạn.",
    effect: "Đổi chỗ lá trên cùng và lá dưới cùng của chồng bài.",
  },
  catomic: {
    name: "Bom Mèo Nguyên Tử",
    emoji: "☢️",
    color: "from-yellow-400 to-lime-700",
    pack: "chaos",
    count: 1,
    how: "Đánh trong lượt của bạn.",
    effect: "Gom mọi Mèo Nổ trong chồng bài đặt lên trên cùng, xáo phần còn lại, rồi kết thúc lượt của bạn. Người kế tiếp coi chừng!",
  },
};

export const cardName = (t: CardType) => CARDS[t]?.name ?? t;

/** Types the triple / five-card combos can ask for. */
export const NAMEABLE_TYPES = Object.keys(CARDS).filter((t) => t !== "exploding" && t !== "imploding") as CardType[];

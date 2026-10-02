# 🎨 Design Tokens (Màu & Kích Thước Dùng Chung)

Tài liệu này mô tả **nguồn chân lý duy nhất** cho toàn bộ màu sắc và kích thước
được dùng lặp lại ở nhiều component.

Trước đây các giá trị như `border-white/10`, `bg-white/5`, `rounded-xl`,
`from-purple-500 to-cyan-500` được viết tay lại trong ~97 file component. Muốn
đổi giao diện phải sửa từng file. Giờ chỉ cần sửa **một** token.

---

## Mục Lục

1. [Các File Liên Quan](#1-các-file-liên-quan)
2. [Bắt Đầu Nhanh](#2-bắt-đầu-nhanh)
3. [Bảng Màu (Colors)](#3-bảng-màu-colors)
4. [Kích Thước (Sizes)](#4-kích-thước-sizes)
5. [Presets — Công Thức Dựng Sẵn](#5-presets--công-thức-dựng-sẵn)
6. [Bảng Quy Đổi Khi Refactor](#6-bảng-quy-đổi-khi-refactor)
7. [Thêm Token Mới](#7-thêm-token-mới)
8. [Lưu Ý Quan Trọng](#8-lưu-ý-quan-trọng)

---

## 1. Các File Liên Quan

| File | Chứa gì | Dùng khi nào |
| --- | --- | --- |
| `src/app/globals.css` | CSS custom properties (`--purple-500`, `--glass-bg`, `--code-*`) | Mọi thứ style bằng CSS thuần: `.glass`, `.gradient-text`, scrollbar, selection, code block blog |
| `src/lib/design-tokens.ts` | Token đơn lẻ — mỗi token là **một** màu hoặc **một** kích thước | Khi tự ghép `className` trong component |
| `src/lib/ui-presets.ts` | Công thức hoàn chỉnh (card, input, badge) ghép từ token | Khi cần một element đã style sẵn toàn bộ |
| `src/lib/animations.ts` | Framer Motion variants | Hiệu ứng scroll / xuất hiện |

> ⚠️ Các giá trị hex trong `palette` (`design-tokens.ts`) là **bản sao** của biến
> CSS trong `globals.css`. TypeScript không import được biến CSS, nên khi đổi màu
> thương hiệu phải **sửa cả hai nơi**.

---

## 2. Bắt Đầu Nhanh

```tsx
import { cn } from "@/lib/utils";
import { surface, border, text, radius, motion } from "@/lib/design-tokens";
import { presets } from "@/lib/ui-presets";

// Cách 1 — ghép từ token
<div className={cn(radius.card, surface.card, border.subtle, motion.base)}>

// Cách 2 — lấy nguyên công thức
<input className={presets.input} />
<span className={presets.badge.success}>Đã xuất bản</span>

// Ghi đè thoải mái — cn() dùng tailwind-merge nên class thêm vào luôn thắng
<input className={cn(presets.input, "rounded-full font-mono")} />
```

Mỗi token **đã kèm sẵn biến thể `light:`**, nên không cần tự viết class light mode.
Token có hậu tố `Dark` thì **không** kèm `light:` — dành cho các route dark-only
trong `EXCLUDED_ROUTE_PREFIXES` (`/admin`, `/contra`, `/couple`, `/music`) và
cho `PhotoLightboxModal`.

---

## 3. Bảng Màu (Colors)

### 3.1. Brand — gradient tím → xanh cyan đặc trưng

Khai báo một lần trong `globals.css` qua `--purple-400/500/600` và
`--cyan-400/500/600`. Mọi thứ phía sau (gradient, glow, focus ring, scrollbar,
màu bôi đen text) đều đọc từ hai màu này.

| Token | Class | Ghi chú |
| --- | --- | --- |
| `brand.gradient` | `bg-gradient-to-r from-purple-500 to-cyan-500` | Gradient chủ đạo (trước đây lặp 39 lần) |
| `brand.gradientHover` | `hover:from-purple-600 hover:to-cyan-600` | Đi kèm gradient trên |
| `brand.gradientDiagonal` | `bg-gradient-to-br …` | Cho bề mặt lớn |
| `brand.gradientWash` | `… from-purple-500/20 to-cyan-500/20` | Nền phủ nhạt |
| `brand.gradientText` | gradient + `bg-clip-text text-transparent` | Tương đương utility `.gradient-text` |
| `brand.glow` / `glowHover` | `shadow-lg shadow-purple-500/25` | Quầng sáng cho nút CTA chính |

### 3.2. Bề mặt (`surface.*`) — nền, từ nhạt nhất đến đậm nhất

| Token | Dark | Light |
| --- | --- | --- |
| `faint` | `bg-white/[0.02]` | `bg-neutral-900/[0.02]` |
| `card` | `bg-white/5` (lặp 120 lần) | `bg-neutral-900/[0.04]` |
| `raised` | `bg-white/10` (lặp 98 lần) | `bg-neutral-900/[0.06]` |
| `strong` | `bg-white/20` | `bg-neutral-900/10` |
| `chrome` | `bg-black/60` | `bg-white/80` |
| `scrim` | `bg-black/80` | `bg-neutral-900/40` |

Bước hover: `faintHover`, `cardHover`, `raisedHover`.
Dark-only: `cardDark`, `raisedDark`, `inputDark` (`bg-slate-950`), `panelDark`.

### 3.3. Viền (`border.*`)

| Token | Dark | Light |
| --- | --- | --- |
| `faint` | `border-white/5` | `border-neutral-900/5` |
| `subtle` | `border-white/10` (lặp 267 lần — mặc định) | `border-neutral-900/10` |
| `strong` | `border-white/20` | `border-neutral-900/15` |

Bước hover: `subtleHover`, `strongHover`. Viền một cạnh: `dividerTop`, `dividerBottom`.

### 3.4. Chữ (`text.*`) — theo mức độ nhấn

| Token | Dark | Light | Dùng cho |
| --- | --- | --- | --- |
| `primary` | `text-white` | `text-neutral-900` | Tiêu đề, nội dung chính |
| `secondary` | `text-white/80` | `text-neutral-800` | Nội dung phụ |
| `muted` | `text-white/60` | `text-neutral-600` | Caption, metadata |
| `subtle` | `text-white/40` | `text-neutral-500` | Thời gian, placeholder |

### 3.5. Trạng thái (`status.*`)

`success` (emerald) · `warning` (amber) · `danger` (red) · `info` (cyan).
Mỗi trạng thái có `.fg`, `.bg`, `.border` và `.solid`:

```tsx
<p className={status.danger.fg}>Tải lên thất bại</p>
<span className={cn(status.success.bg, status.success.border)} />
```

---

## 4. Kích Thước (Sizes)

### 4.1. Bo góc (`radius.*`) — đặt tên theo **vai trò**, không theo giá trị

| Token | Class | Dùng cho |
| --- | --- | --- |
| `chip` | `rounded-lg` | Tag, chip nhỏ |
| `control` | `rounded-xl` (lặp 334 lần) | Button, input, row |
| `card` | `rounded-2xl` (lặp 105 lần) | Card, panel |
| `panel` | `rounded-3xl` | Modal, khối hero |
| `pill` | `rounded-full` (lặp 252 lần) | Pill, avatar, nút icon |

Đặt tên theo vai trò chính là mấu chốt: muốn **mọi card** bo tròn hơn thì sửa
`radius.card` một lần, button không bị ảnh hưởng.

### 4.2. Bố cục (`layout.*`)

| Token | Class |
| --- | --- |
| `container` | `container mx-auto px-4 sm:px-6 max-w-7xl` |
| `containerProse` | `container mx-auto px-4 sm:px-6 max-w-3xl` |
| `section` | `relative pt-8 pb-60 overflow-hidden` |
| `sectionPadding` / `Tight` / `Page` | `pt-8 pb-60` · `pt-8 pb-56` · `py-20` |

Padding dưới lớn là **cố ý** — xem phần section padding scheme trong
`docs/ARCHITECTURE.md`.

### 4.3. Khoảng cách (`gap.*`)

`tight` `gap-2` (lặp 218 lần) · `base` `gap-3` · `loose` `gap-4` · `grid` `gap-6`

### 4.4. Icon (`iconSize.*`)

`xs` `w-4 h-4` · `sm` `w-5 h-5` · `md` `w-6 h-6` · `button` `w-9 h-9` ·
`lg` `w-12 h-12` · `avatar` `w-24 h-24`

### 4.5. Chuyển động (`motion.*`)

`fast` `duration-200` · `base` `duration-300` (mặc định, lặp 33 lần) ·
`slow` `duration-500` · `colors` (chỉ đổi màu) · `press` `active:scale-95`

### 4.6. Độ nổi (`elevation.*`)

`blur` `backdrop-blur-md` (lặp 54 lần) · `blurStrong` `backdrop-blur-xl` ·
`card` · `cardHover` · `modal`

### 4.7. Z-index (`zIndex.*`) — một thang duy nhất

`base` `z-10` → `sticky` `z-30` → `nav` `z-40` → `modal` `z-50` →
`overlay` `z-[60]`

Dùng thang này thay vì tự chế `z-[9999]`, các lớp sẽ không "đá" nhau.

### 4.8. Focus (`focus.*`) và tiêu đề (`heading.*`)

`focus.ring` là vòng focus bàn phím cho button/link, `focus.input` cho ô nhập
liệu, `focus.disabled` cho trạng thái vô hiệu hoá.
`heading.hero` / `section` / `card` / `eyebrow` là thang typography.

---

## 5. Presets — Công Thức Dựng Sẵn

`src/lib/ui-presets.ts` gói sẵn các pattern từng bị lặp nguyên văn:

- **Bề mặt** — `card`, `cardInteractive`, `panel`, `chrome`
- **Form** — `input`, `inputCompact`, `inputDark`, `label`, `errorText`
- **Button** — `buttonPrimary`, `buttonSecondary`, `buttonIcon`
- **Badge** — `chip`, `chipInteractive`, `badge.{success,warning,danger,info}`
- **Bố cục** — `section`, `container`, `sectionTitle`, `sectionSubtitle`, `divider`

Riêng `presets.inputDark` thay thế chuỗi class ô nhập liệu của admin CMS từng
xuất hiện **25 lần** nguyên văn.

> 💡 Với card và button, ưu tiên dùng component `<GlassCard />` và `<Button />`
> (`src/components/ui`) — chúng đã dựng trên chính các preset này. Chỉ dùng
> preset thô khi cần thẻ `<a>`, form control, hoặc markup tuỳ biến.

---

## 6. Bảng Quy Đổi Khi Refactor

Không cần refactor toàn bộ một lần — sửa dần mỗi khi đụng vào file.

| Đang viết | Thay bằng |
| --- | --- |
| `border border-white/10 light:border-neutral-900/10` | `border.subtle` |
| `bg-white/5 light:bg-neutral-900/[0.04]` | `surface.card` |
| `text-white light:text-neutral-900` | `text.primary` |
| `text-white/60 light:text-neutral-600` | `text.muted` |
| `bg-gradient-to-r from-purple-500 to-cyan-500` | `brand.gradient` |
| `transition-all duration-300` | `motion.base` |
| `rounded-2xl` trên card | `radius.card` |
| `container mx-auto px-4 sm:px-6 max-w-7xl` | `layout.container` |
| `w-full px-4 py-2.5 bg-slate-950 border …` (admin) | `presets.inputDark` |
| Cả chuỗi `className` của glass card | `presets.card` hoặc `<GlassCard />` |

---

## 7. Thêm Token Mới

1. Giá trị đó có xuất hiện ở **từ 3 component trở lên** không? Nếu không, cứ để inline.
2. Đặt tên theo **vai trò** (`radius.card`), không theo giá trị (`radius.rounded2xl`)
   — mục đích của token là để giá trị có thể thay đổi.
3. Kèm biến thể `light:`, trừ khi token dành riêng cho route dark-only.
4. Bổ sung vào bảng trong tài liệu này để người sau còn tìm thấy.

---

## 8. Lưu Ý Quan Trọng

- **Tailwind có quét các file này.** Tailwind v4 quét toàn bộ `src/**`, nên class
  viết dưới dạng **chuỗi literal hoàn chỉnh** bên trong file token vẫn được biên
  dịch bình thường. Tuyệt đối **không** ghép class từ mảnh
  (`` `bg-${color}-500` ``) — Tailwind không "nhìn thấy" và style sẽ biến mất âm thầm.
- **Luôn ghép bằng `cn()`.** Hàm này chạy `tailwind-merge`, nên class bạn thêm vào
  sẽ ghi đè preset thay vì xung đột với nó.
- **Route dark-only.** Bên trong `/admin`, `/contra`, `/couple`, `/music` và
  `PhotoLightboxModal`, hãy dùng token `*Dark` — thêm `light:` ở đó là bug
  (xem CLAUDE.md §5).

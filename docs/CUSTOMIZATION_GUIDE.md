# 🎨 Hướng Dẫn Tùy Biến (Customization Guide)

Tài liệu này hướng dẫn từng bước cách tùy chỉnh toàn bộ thông tin cá nhân, dự án, bài viết, giao diện và các phân hệ trong dự án Portfolio.

---

## Mục Lục

1. [Thay Đổi Thông Tin Cá Nhân & Cấu Hình Trang](#1-thay-đổi-thông-tin-cá-nhân--cấu-hình-trang)
2. [Quản Lý Kỹ Năng (Skills)](#2-quản-lý-kỹ-năng-skills)
3. [Thêm / Sửa Dự Án (Projects)](#3-thêm--sửa-dự-án-projects)
4. [Viết Bài Blog Mới (MDX)](#4-viết-bài-blog-mới-mdx)
5. [Tùy Chỉnh Màu Sắc & Theme (Tailwind CSS v4)](#5-tùy-chỉnh-màu-sắc--theme-tailwind-css-v4)
6. [Tùy Biến Trang Kỷ Niệm Tình Yêu (Couple Page)](#6-tùy-biến-trang-kỷ-niệm-tình-yêu-couple-page)
7. [Tùy Biến Game Contra](#7-tùy-biến-game-contra)
8. [Thêm Hỗ Trợ Light Mode Cho Component Mới](#8-thêm-hỗ-trợ-light-mode-cho-component-mới)

---

## 1. Thay Đổi Thông Tin Cá Nhân & Cấu Hình Trang

Toàn bộ nội dung site nằm trong **PostgreSQL** và được chỉnh qua **Admin CMS** (`/admin`, đăng nhập bằng `ADMIN_PASSWORD`) — không sửa trong code. `src/lib/constants.ts` chỉ còn `EXCLUDED_ROUTE_PREFIXES`.

### 1.1. Cấu hình site — `/admin/site-config`
- Tab **General/Author**: tên, tiêu đề, mô tả, URL site, ảnh OG (`ogImage`), thông tin tác giả (tên, chức danh, bio EN/VI, avatar, email, vị trí) và link CV (`resumeUrl` — nút xem CV ở Hero chỉ hiện khi có giá trị).
- Tab **Hero / About / Skills / Projects / Contact**: ghi đè chữ của từng section trang chủ (EN/VI) và 4 số liệu của About. Để trống thì dùng chữ mặc định trong `src/locales/{en,vi}.ts`.

### 1.2. Liên kết mạng xã hội & menu — `/admin/social-links`, `/admin/nav-links`
Thêm/sửa/xoá, sắp xếp thứ tự, nhãn tiếng Việt (`label_vi`) cho menu.

### 1.3. Ảnh, video, file — `/admin/media`
Upload lên Cloudinary (HEIC tự chuyển sang JPEG); các form khác chọn file qua `MediaPickerModal`.

---

## 2. Quản Lý Kỹ Năng (Skills)

Vào `/admin/skills`: mỗi kỹ năng có tên, icon (emoji hoặc URL ảnh), `category` (`frontend` / `backend` / `tools` / `design`) và trạng thái publish. Trang chủ hiển thị kỹ năng dạng chip theo category (trường `level` vẫn có trong dữ liệu nhưng không còn vẽ thanh phần trăm).

---

## 3. Thêm / Sửa Dự Án (Projects)

Vào `/admin/projects`: tiêu đề, mô tả ngắn/dài (EN + `_vi`), ảnh, tags, `liveUrl`, `githubUrl`, `featured` (tối đa 6 dự án featured hiện ở trang chủ) và `published`. Trang `/projects` hiện toàn bộ dự án đã publish (ISR 60 giây).

---

## 4. Viết Bài Blog Mới (MDX)

Vào `/admin/blog` → **New**: điền `slug`, tiêu đề, tóm tắt, ngày, category, tags, thời gian đọc và nội dung MDX (có preview). Bản tiếng Việt (`title_vi`, `excerpt_vi`, `content_vi`) là tùy chọn — nếu không có, trang VI hiển thị bản EN kèm badge cảnh báo. Bài được lưu vào bảng `CmsBlogPost` và hiện ở `/blog/<slug>`.

> Thư mục `content/blog/*.mdx` (và `content/data/*.json`) chỉ là dữ liệu cũ để nạp vào DB một lần bằng `npx tsx scripts/migrate-json-to-db.ts`; sửa các file này không còn tác dụng lên site.

---

## 5. Tùy Chỉnh Màu Sắc & Theme (Tailwind CSS v4)

Dự án sử dụng Tailwind CSS v4 với cấu hình inline trong **`src/app/globals.css`**.

Để thay đổi bảng màu chủ đạo (mặc định là Tím & Lục lam / Cyan):

```css
:root {
  --background: #050505; /* Màu nền chính (Dark) */
  --foreground: #fafafa; /* Màu chữ chính (Dark) */
  --purple-500: #8b5cf6; /* Màu nhấn 1 (Accent 1) */
  --cyan-500: #06b6d4;   /* Màu nhấn 2 (Accent 2) */
}
```

Các utility class gradient sẽ tự động thừa hưởng màu sắc mới của bạn:
- `.gradient-text`: Text gradient giữa `--purple-500` và `--cyan-500`.
- `.glow-purple` & `.glow-cyan`: Đổ bóng phát sáng neon.

### 5.1. Site Có 2 Theme: Dark (gốc) & Light (thêm sau)

Site mặc định là **Dark** — đây vẫn là "giao diện gốc" không đổi. Chế độ **Light** được cộng thêm qua nút bấm mặt trăng/mặt trời (`ThemeToggle`) trên thanh Navigation, dùng cơ chế **biến thể Tailwind tuỳ biến** thay vì `dark:` chuẩn:

```css
/* src/app/globals.css */
@custom-variant light (&:where([data-theme="light"], [data-theme="light"] *));
```

Nghĩa là bất kỳ class nào có tiền tố `light:` (ví dụ `light:text-neutral-900`) **chỉ** được áp dụng khi `<html>` (do `ThemeProvider` set) có `data-theme="light"`. Muốn đổi màu nền/chữ riêng cho Light mode, sửa khối sau trong `globals.css`:

```css
[data-theme="light"] {
  --background: #faf9fc;
  --foreground: #0a0a0f;
  /* ... --glass-bg, --glow-purple-color, --scrollbar-*, --selection-* ... */
}
```

- Muốn **tắt hẳn** tính năng chuyển theme: xoá `<ThemeToggle />` khỏi `Navigation.tsx` — site sẽ luôn hiển thị theo `data-theme` mặc định (dark) do `ThemeProvider` gán.
- Muốn thêm route mới luôn giữ Dark bất kể lựa chọn người dùng (giống `/admin`, `/contra`, `/couple`, `/music` và các route game): thêm prefix route đó vào mảng `EXCLUDED_ROUTE_PREFIXES` trong `src/lib/constants.ts`.

---

## 6. Tùy Biến Trang Kỷ Niệm Tình Yêu (Couple Page)

Vào `/admin/couple` để sửa tên hai người, mốc `anniversary`, câu trích cuối trang, sinh nhật, ngày đặc biệt, dòng thời gian kỷ niệm, ảnh, bucket list, thư tình và "favorites" (mỗi mục có trạng thái publish). Trang `/couple` đọc dữ liệu qua `/api/couple`; `DEFAULT_COUPLE_DATA` ở đầu `src/app/couple/page.tsx` chỉ là dữ liệu tạm hiển thị trước khi tải xong / khi API lỗi.

---

## 7. Tùy Biến Game Contra

Bạn có thể điều chỉnh thông số game trong **`src/components/game/ContraGame.tsx`**:

- **Máu & Mạng người chơi**: object `player` trong `initGame` (`hp: 3`, `maxHp: 3`, `lives: 3`).
- **Sức mạnh vũ khí**: bảng `WEAPON_DATA` — nhịp bắn (`rate`, số frame giữa 2 phát), tốc độ đạn (`speed`), sát thương (`damage`), độ tỏa (`spread`), số viên mỗi phát (`count`).
- **Thiết kế Level**: hàm `createLevels()` trả về 5 màn, mỗi màn có danh sách platform, kẻ địch, power-up và vị trí boss (`bossAt`).
- **Vật lý chung**: hằng số `GRAVITY`, `PLAYER_SPEED`, `JUMP_FORCE` ở đầu file.

---

## 8. Thêm Hỗ Trợ Light Mode Cho Component Mới

Khi tạo component mới (hoặc chỉnh sửa component cũ) và muốn nó hiển thị đúng ở cả 2 theme, làm theo quy tắc **cộng thêm, không thay thế**: giữ nguyên toàn bộ class dark gốc, chỉ **thêm** class `light:` đi kèm.

| Class dark gốc | Thêm class light: tương ứng |
|---|---|
| `text-white` | `light:text-neutral-900` |
| `text-white/90`, `/80` | `light:text-neutral-800` |
| `text-white/70`, `/60` | `light:text-neutral-600` |
| `text-white/50`, `/40` | `light:text-neutral-500` |
| `bg-white/5`, `/[0.04]` (bề mặt kính mờ, card) | `light:bg-neutral-900/[0.04]` |
| `bg-white/10`, `/[0.06]`, `/[0.08]` | `light:bg-neutral-900/[0.06]` |
| `border-white/10`, `/[0.08]` | `light:border-neutral-900/10` |
| `border-white/20` | `light:border-neutral-900/15` |
| `shadow-black/...` | `light:shadow-neutral-400/...` (~ giảm một nửa opacity) |
| `hover:bg-white/...`, `hover:text-white` | thêm `light:hover:*` tương ứng |

**Lưu ý quan trọng**: `bg-black/N` (hoặc gradient tối) dùng làm **lớp phủ trực tiếp lên ảnh/thumbnail** (badge, caption khi hover, nút play video) phải **giữ nguyên ở cả 2 theme** — không thêm `light:` — vì đây là lớp đảm bảo độ tương phản chữ trên ảnh, không phải màu nền của trang. Chỉ thêm `light:` cho `bg-black/N` khi nó là nền/chrome của trang hoặc modal (VD: lớp phủ backdrop của modal, nền section) — trường hợp này dùng `light:bg-white/70` đến `/90`.

Xem ví dụ thực tế đã áp dụng đầy đủ quy tắc này ở `src/components/ui/GlassCard.tsx`, `src/components/ui/Navigation.tsx`, và toàn bộ `src/components/photography/*.tsx`. Chi tiết cơ chế kỹ thuật ở [mục 5.1](#51-site-có-2-theme-dark-gốc--light-thêm-sau) và `docs/ARCHITECTURE.md` (mục 3.6).

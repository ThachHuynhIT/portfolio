# 🚀 Đặc Tả Tính Năng (Features Specification)

Tài liệu này cung cấp mô tả chi tiết về tất cả các tính năng, trang, component, hạ tầng dữ liệu và trải nghiệm người dùng trong hệ thống — cập nhật theo trạng thái code hiện tại (bao gồm Admin Dashboard/CMS, Prisma + PostgreSQL, Cloudinary media, module Photography và hệ thống đa ngôn ngữ).

---

## Danh Mục Tính Năng

1. [🌟 Trang Chủ Portfolio (`/`)](#1-trang-chủ-portfolio)
2. [📝 MDX Blog Platform (`/blog`)](#2-mdx-blog-platform)
3. [🕹️ 2D Contra Arcade Game (`/contra`)](#3-2d-contra-arcade-game)
4. [🛠️ JSON Parameter Validator (`/tools/json-validator`)](#4-json-parameter-validator)
5. [💖 Trang Kỷ Niệm Tình Yêu (`/couple`)](#5-trang-kỷ-niệm-tình-yêu)
6. [🖼️ Trang Projects (`/projects`)](#6-trang-projects)
7. [🎵 Trang Music (`/music`)](#7-trang-music)
8. [📸 Module Photography (`/photography`)](#8-module-photography)
9. [🔐 Admin Dashboard / CMS (`/admin`)](#9-admin-dashboard--cms)
10. [✉️ Form Liên Hệ (Contact Form)](#10-form-liên-hệ)
11. [🌐 Hệ Thống Đa Ngôn Ngữ (i18n Anh/Việt)](#11-hệ-thống-đa-ngôn-ngữ)
12. [🗄️ Lớp Dữ Liệu & Hạ Tầng (Prisma, PostgreSQL, Cloudinary)](#12-lớp-dữ-liệu--hạ-tầng)
13. [🎨 UI Component Primitives & Subsystem Lõi](#13-ui-component-primitives--subsystem-lõi)
14. [🌗 Chế Độ Sáng / Tối (Light/Dark Theme Toggle)](#14-chế-độ-sáng--tối-lightdark-theme-toggle)
15. [⚠️ Điểm Cần Lưu Ý / Rủi Ro Kỹ Thuật](#15-điểm-cần-lưu-ý--rủi-ro-kỹ-thuật)

---

## 1. Trang Chủ Portfolio

**Route**: `/` (`src/app/page.tsx`)

Trang chủ là một One-Page Application cuộn mượt mà, ghép các section theo thứ tự: **Hero → About → Skills → Projects → Photo Preview → Blog Preview → Contact**. Hero/About render ngay (above-the-fold); các phần còn lại được `next/dynamic` import kèm skeleton loading (`SectionSkeleton`) để tối ưu perceived-performance.

### 1.1. Hero Section (`src/components/sections/HeroSection.tsx`)
- **3D Interactive Visual**: `SceneContainer` + `Hero3DScene` (khối icosahedron biến dạng + lõi octahedron dạng khung dây, xoay theo thời gian và phản ứng theo vị trí chuột) — được `dynamic(..., { ssr:false })` và chỉ mount sau khi `isMounted=true` để tránh hydration mismatch với WebGL.
- **Hiệu năng**: vị trí chuột được lưu bằng `useRef` (không phải React state) và đọc trong `useFrame` — tránh re-render toàn cây React ở 60 FPS.
- **Dynamic Text Highlight**: tên hiển thị với gradient tím → lục lam (`.gradient-text`).
- **Call-to-Action**: `View My Work` cuộn mượt tới `#projects`; `Download CV` tải `/resume.pdf` từ `public/` (cần đảm bảo file tồn tại).
- **Song ngữ**: phần bio đổi sang `siteConfig.author.bio_vi` khi locale là `vi`.
- **Padding responsive**: `py-20 lg:py-0` — thêm khoảng thở trên/dưới cho nội dung ở màn hình ≤1024px (badge/heading/mô tả xuống nhiều dòng hơn), giữ nguyên căn giữa toàn màn hình (`min-h-screen`) từ `lg` trở lên. Khoảng cách trước About **không** nằm trong padding của Hero — xem [mục 13.2](#132-ui-building-blocks-srccomponentsui) và `docs/ARCHITECTURE.md` §3.7.

### 1.2. About Section (`src/components/sections/AboutSection.tsx`)
- Bio, triết lý làm việc, highlight cards (Fast Delivery, Modern Design, Continuous Learning).
- **Animated Stats**: 4 số liệu (năm kinh nghiệm/dự án/khách hàng/công nghệ — hiện đang là giá trị cố định "5+/50+/30+/20+" trong code, chưa lấy động từ dữ liệu thật).

### 1.3. Skills Section (`src/components/sections/SkillsSection.tsx`)
- Bộ lọc theo category (`all/frontend/backend/tools/design`), dữ liệu lấy từ `content/data/skills.json` qua `constants.ts` (chỉ lấy `published !== false`).
- Hiển thị dạng **chip/badge** theo category (không phải progress bar dù `Skill.level` (1–100) vẫn tồn tại trong type/data).
- Icon có thể là emoji hoặc URL ảnh (`skill.icon` bắt đầu bằng `http`/`/`).
- Nền phụ họa 3D: `FloatingTechStack` — các icon skill trôi nổi thành vòng tròn, luôn xoay mặt về camera (billboard qua `lookAt`).

### 1.4. Projects Section (`src/components/sections/ProjectsSection.tsx`)
- Hiển thị tối đa 6 project có `featured && published` (nếu không đủ, lấy thêm từ danh sách chung) từ `content/data/projects.json`.
- **Interactive 3D Tilt Cards (`TiltCard.tsx`)**: nghiêng theo chuột bằng Framer Motion `useMotionValue`/`useSpring` (không re-render React khi mousemove), có hiệu ứng "shine" bám theo góc nghiêng.
- Click vào card mở **Modal chi tiết** (`ProjectModal`) có focus-trap, đóng bằng `Escape`, khôi phục focus khi đóng, khóa scroll body.
- Nút "View Live"/"Source Code" mở `liveUrl`/`githubUrl` ở tab mới; "View All" dẫn tới `/projects`.
- Trường `title_vi`/`description_vi`/`longDescription_vi` được dùng khi locale là `vi`.

### 1.5. Photo Preview & Blog Preview Section
- **Photo Preview**: slider tự động chuyển ảnh mỗi 5s (dừng khi hover), có thumbnail strip + dot indicator, lấy ảnh nổi bật từ `content/data/photography.json`, dẫn tới `/photography`.
- **Blog Preview**: nhận `posts` (3 bài mới nhất) từ server (`getAllPosts().slice(0,3)`), hiển thị dạng lưới 3 cột, dẫn tới `/blog`.

### 1.6. Contact Section
Xem chi tiết ở [mục 10](#10-form-liên-hệ). Có nền hạt 3D (`ParticleField`, màu tím, 500 hạt) cùng cơ chế `ssr:false` + `isMounted` như Hero.

---

## 2. MDX Blog Platform

**Routes**: `/blog` (danh sách) và `/blog/[slug]` (chi tiết bài viết).

### 2.1. Quản Lý Nội Dung Bằng MDX
- Bài viết lưu tại `content/blog/*.mdx`, đọc trực tiếp qua Node `fs` trong `src/lib/blog.ts` (không qua DB).
- Frontmatter (`gray-matter`), toàn bộ ép kiểu `String`/mảng, mặc định rỗng nếu thiếu:
  ```yaml
  ---
  title: "Tên bài viết"
  title_vi: "Bản dịch tiêu đề"
  excerpt: "Tóm tắt ngắn gọn"
  excerpt_vi: "Tóm tắt tiếng Việt"
  content_vi: "Toàn bộ nội dung MDX bản tiếng Việt (tùy chọn)"
  date: "2024-11-20"
  category: "Tutorial"
  tags: ["react", "three.js", "3d"]
  readTime: "8 min read"
  ---
  ```
- `getAllPosts()` sắp xếp theo `date` giảm dần, bỏ qua (log lỗi, không crash) file frontmatter sai định dạng.
- Có sẵn `getAllTags()`/`getPostsByTag()` trong `blog.ts` nhưng **hiện chưa có UI nào sử dụng** (chỉ có filter theo category, chưa có filter theo tag).

### 2.2. Cơ Chế Song Ngữ Đặc Biệt
- Ở trang chi tiết, cả **2 cây MDX được render sẵn phía server**: bản tiếng Anh (`contentEn`, luôn có) và bản tiếng Việt (`contentVi`, chỉ khi `content_vi` tồn tại trong frontmatter) — nghĩa là bản dịch tiếng Việt là **một tài liệu MDX hoàn toàn riêng biệt**, không phải dịch từng chuỗi.
- `BlogPostView` chọn hiển thị theo locale hiện tại; nếu locale là `vi` nhưng bài viết chưa có `content_vi`, hiển thị badge cảnh báo "(Đang hiển thị bản gốc EN)" và fallback về bản tiếng Anh.

### 2.3. Tính Năng Khác
- **Category Filter tức thì** (`BlogList.tsx`) — lọc client-side, không phân trang (toàn bộ bài viết render 1 lần).
- **SSG**: `generateStaticParams()` build tĩnh từng bài viết tại build time; `generateMetadata()` sinh SEO/OpenGraph.
- Render qua `next-mdx-remote/rsc` (`<MDXRemote>` dạng React Server Component).
- **rehype-highlight** (tô màu code) + **rehype-slug** (gán id heading cho deep-link) qua `rehypePlugins`.
- Custom `mdxComponents` override style Tailwind cho `h1–h3, p, a, ul, ol, li, blockquote, code, pre, strong, hr`.

---

## 3. 🕹️ 2D Contra Arcade Game

**Route**: `/contra` (`src/app/contra/page.tsx` & `src/components/game/ContraGame.tsx`, ~1800 dòng)

Game arcade 2D thuần **HTML5 Canvas** (không dùng game engine/thư viện), canvas cố định 800×480px, vòng lặp mô phỏng dùng **fixed-timestep** (`FIXED_DT = 1000/60`, có clamp delta lớn để tránh "spiral of death" khi tab bị chuyển nền).

### 3.1. Cơ Chế Điều Khiển
- **Di chuyển**: `A`/`D` hoặc mũi tên Trái/Phải.
- **Ngồi/Trườn (Prone)**: `S` hoặc mũi tên Xuống.
- **Nhảy**: `K` hoặc `Space` (hỗ trợ nhảy xuyên nền tảng loại `bridge`).
- **Bắn**: `J` hoặc `Z` (giữ phím để bắn liên thanh).
- **Tạm dừng**: `P` hoặc `Escape`.
- Chỉ những phím nằm trong tập `GAME_KEYS` mới bị `preventDefault()` — không chặn các phím tắt trình duyệt khác.

### 3.2. Hệ Thống Vũ Khí (Power-Ups)
Các loại vũ khí `default, M (Machine Gun), S (Spread Gun), R (Rapid Fire), L (Laser Gun), F (Fireball)` với thông số riêng về tốc độ bắn/tốc độ đạn/sát thương/độ tỏa/số viên; power-up `B` (Barrier Shield) cho bất tử tạm thời. Power-up xuất hiện dưới dạng vật phẩm nhặt được trên bản đồ.

### 3.3. Màn Chơi & Môi Trường
- **5 màn chơi**: Jungle, Enemy Base, Waterfall, Snow Field, Alien Hive — mỗi màn có vị trí `bossAt` kích hoạt trận đấu trùm (camera khóa cứng tại vị trí đó).
- **Loại nền tảng**: `solid` (rắn), `bridge` (xuyên thấu được), `destructible` (phá hủy được), `moving` (di chuyển), `spike` (gai gây sát thương).
- Trạng thái nhân vật: bơi lội (swimming), nằm trườn (prone), bất tử tạm thời (i-frames), chết/hồi sinh có đếm giờ.
- **Rendering**: tách nhiều hàm `draw*` riêng cho từng nền theo `bgType` (jungle/base/waterfall/snow/alien), nền tảng, power-up, đạn, hạt hiệu ứng, nhân vật, kẻ địch, HUD, menu chính, intro màn, pause, game-over, victory — vẽ thủ công bằng Canvas 2D API, không dùng sprite-sheet framework.

---

## 4. 🛠️ JSON Parameter Validator

**Route**: `/tools/json-validator` (`src/components/tools/JsonValidator.tsx`) — công cụ nội bộ, **hoàn toàn client-side, không có backend**, dùng để đối chiếu 2 bảng export dạng JSON (có vẻ xuất từ Postgres/pg_dump), không phải tính năng dành cho người dùng cuối thông thường.

### 4.1. Quy Trình Hoạt Động
1. Người dùng kéo/thả nhiều file `.json` (hỗ trợ chọn cả thư mục qua `webkitdirectory`).
2. Hệ thống nhóm các file theo **hậu tố tên file** (phần sau dấu `_` cuối cùng, bỏ `.json`), rồi ghép cặp theo tên chứa `tb_def_exception_parameter` với `tb_def_parameter` (loại trừ file cũng khớp "exception"). Chỉ nhóm có đủ cả 2 file mới được kiểm tra.
3. Chấp nhận JSON dạng `{ "public.tb_def_exception_parameter": [...] }` (kiểu pg_dump) hoặc mảng thuần.
4. So khớp từng `tb_def_parameter__id` trong file exception xem có tồn tại trong file parameter không.

### 4.2. Kết Quả & Báo Cáo
- Mỗi cặp: danh sách `missingIds` (đã loại trùng), `totalChecked`, `totalAvailable`.
- Thẻ tổng hợp: tổng số cặp / số cặp hợp lệ / số cặp lỗi.
- Nút **"Load Sample Data"**: tự động fetch file mẫu `public/content/json/tb_def_exception_parameter_seed_buf.json` và `tb_def_parameter_seed_buf.json` — cần đảm bảo 2 file này tồn tại để demo hoạt động.

---

## 5. 💖 Trang Kỷ Niệm Tình Yêu

**Route**: `/couple` (`src/app/couple/page.tsx`, ~1086 dòng) — layout/metadata riêng ("💕 Our Love Story"), CSS module riêng (`couple.module.css`), **ẩn Navigation/Footer chung** của site (tự có back-link + language switcher nổi riêng).

### 5.1. Nguồn Dữ Liệu
- Fetch từ `/api/couple` (đọc `content/data/couple.json` qua `data-manager.ts`, lọc bỏ item có `published === false`).
- Có **2 bản `DEFAULT_COUPLE_DATA` độc lập** làm fallback: một bản (tiếng Việt, có ảnh) hardcode trực tiếp trong `page.tsx`, một bản khác (tiếng Anh, không ảnh) trong route API `/api/couple` — xem lưu ý ở [mục 14](#14-điểm-cần-lưu-ý--rủi-ro-kỹ-thuật).

### 5.2. Các Section (điều hướng bằng menu, không cuộn liên tục)
- **Photos**: filter theo category + lightbox toàn màn hình (điều hướng bằng phím mũi tên/Escape).
- **Birthdays**: đếm ngược tới sinh nhật kế tiếp của mỗi người (ngày/giờ/phút).
- **Special Dates**: đếm ngược dạng "Còn N ngày" / "Hôm nay! 🎉" / "Đã qua rồi".
- **Memory Timeline**: dòng thời gian các cột mốc kỷ niệm.
- **Bucket List**: toggle hoàn thành **chỉ là state cục bộ** — không lưu lại, reload trang sẽ mất trạng thái đã tick.
- **Love Letters**: thẻ chứa các bức thư tình.
- **Favorites**: những điều hai người cùng thích.
- **Hero**: đồng hồ thời gian thực từ mốc `anniversary` (ngày/giờ/phút/giây, cập nhật mỗi giây) + số năm/tháng/ngày bên nhau.
- 18 icon trái tim trôi nổi nền (`FloatingHearts`), vị trí/thời gian ngẫu nhiên hoá 1 lần (`useMemo`, không đổi lại khi re-render).
- Phần lớn chuỗi giao diện của trang này **hardcode tiếng Việt trực tiếp**, không đi qua hệ thống `t()` như phần còn lại của site (ngoại trừ nút Back/Language switcher).

---

## 6. 🖼️ Trang Projects

**Route**: `/projects` (`src/app/projects/page.tsx`) — trang gallery đầy đủ (khác với 6 project nổi bật ở trang chủ), đọc trực tiếp `content/data/projects.json` qua `readJsonFile`, `revalidate = 60` (ISR — dữ liệu mới cập nhật từ Admin sẽ hiển thị sau tối đa 60 giây mà không cần rebuild).

---

## 7. 🎵 Trang Music

**Route**: `/music` (`src/app/music/page.tsx`) — **Music Lounge**, ẩn Navigation/Footer chung (có chrome riêng: `MusicSidebar`, `MusicRoomBar`,...).

- **Duy nhất trong số các tính năng nội dung, Music lấy dữ liệu thật từ PostgreSQL qua Prisma** (`db.track.findMany({ where: { published: true } })`), `revalidate = 60`. Toàn bộ tính năng khác (blog, projects, skills, photography, couple...) vẫn dùng file JSON — xem [mục 12](#12-lớp-dữ-liệu--hạ-tầng) và [mục 14](#14-điểm-cần-lưu-ý--rủi-ro-kỹ-thuật).
- `GlobalMusicPlayer` được mount ở root layout — phát nhạc **xuyên suốt mọi trang**, không chỉ riêng `/music`.
- **Phòng nghe chung (Listen-together Rooms)**: `/api/music/rooms`, `/api/music/rooms/[code]` — trạng thái phòng lưu **in-memory** (`Map` trên `globalThis`), không phải DB thật → **mất hết khi server restart/redeploy**, không đồng bộ được giữa nhiều instance khi scale ngang.

---

## 8. 📸 Module Photography

**Routes**: `/photography` (gallery tổng, `dynamic = "force-dynamic"` — luôn đọc dữ liệu mới, không cache tĩnh) và `/photography/album/[slug]` (chi tiết album). **Không có route riêng cho từng ảnh** — xem ảnh đơn được xử lý hoàn toàn qua lightbox (client-side), không đổi URL.

### 8.1. Chế Độ Xem (chuyển bằng nút bấm, không tự theo kích thước màn hình)
| Layout | Mô tả |
|---|---|
| **Masonry** | Chia thủ công 3 cột theo `index % 3` (không dùng thư viện masonry), mỗi ảnh giữ đúng tỉ lệ khung hình (`aspectRatio`), hover hiện overlay thông tin. |
| **Grid** | Lưới đều, mọi ảnh crop `aspect-[4/3]`, thông tin (ngày/địa điểm/tiêu đề/EXIF) hiển thị cố định bên dưới ảnh (không cần hover). |
| **Compare** | Chỉ hiển thị ảnh có `beforeImage` — slider so sánh trước/sau kéo được (`BeforeAfterSlider`) kèm ghi chú chỉnh sửa. |
| **Story** | Bố cục kể chuyện 1 cột, ảnh full-width kèm mô tả/EXIF/thông tin hậu kỳ chi tiết. |

### 8.2. Album & Điều Hướng
- Album hiển thị: tiêu đề, mô tả, ảnh bìa (blur hero banner), số lượng ảnh, ngày tạo, badge "Featured".
- **Tự động chọn ảnh bìa**: nếu album chỉ có đúng 1 ảnh, ảnh đó tự động thành cover (ghi đè `coverImage` đã đặt thủ công) — logic này lặp lại độc lập ở cả trang public lẫn 2 API admin (photos/albums).
- Cuối trang album có gợi ý "Other Curated Albums" (tối đa 3 album khác).
- Lightbox hỗ trợ phím tắt: `Esc` đóng, `←/→` chuyển ảnh, `I` bật/tắt panel thông tin, `B` bật/tắt before/after, click ảnh để zoom 1.25x.

### 8.3. Dữ Liệu & EXIF
- Nguồn dữ liệu là **file JSON** (`content/data/photography.json`, `photography-albums.json`), **không phải** bảng Prisma (schema hiện chưa có model Photo/Album).
- Media nhị phân (ảnh/video) lưu trên **Cloudinary**, chỉ metadata lưu ở JSON — xem [mục 12](#12-lớp-dữ-liệu--hạ-tầng).
- EXIF (máy ảnh, lens, tiêu cự, khẩu độ, tốc độ chụp, ISO) được trích xuất tự động khi upload ở Admin (thư viện `exifr`, client-side) và hiển thị ở Grid/Masonry/Story/Compare/Lightbox nếu có dữ liệu.
- Ảnh dùng `ImageWithSkeleton` (wrapper `next/image`): shimmer khi tải, fade-in khi load xong, fallback lỗi, `loading="lazy"` (trừ ảnh `priority`).
- Không có nút Download/Share riêng — chỉ có link "Open Full-Resolution" mở ảnh/video gốc ở tab mới.

---

## 9. 🔐 Admin Dashboard / CMS

**Routes gốc**: `/admin/**` (client components, có layout riêng với sidebar/topbar, `ToastProvider` cho thông báo).

### 9.1. Danh Sách Trang Quản Trị
| Route | Quản lý |
|---|---|
| `/admin` | Dashboard tổng hợp: số liệu skills/projects/photography/music/blog/social, quick links |
| `/admin/login` | Đăng nhập bằng mật khẩu |
| `/admin/skills` | CRUD kỹ năng |
| `/admin/projects` | CRUD dự án |
| `/admin/photography` | CRUD ảnh + album, metadata EXIF |
| `/admin/music`, `/new`, `/[id]/edit` | CRUD bài hát (Prisma) |
| `/admin/blog`, `/new`, `/[slug]/edit` | CRUD bài viết MDX (song ngữ, có preview) |
| `/admin/couple` | Quản lý nội dung trang Couple (ảnh, timeline, sinh nhật, bucket list, thư tình,...) |
| `/admin/media` | Thư viện Cloudinary: xem/tìm/upload/xóa, đồng bộ "Sync from Cloudinary" |
| `/admin/site-config` | Cấu hình site (tên, mô tả, thông tin tác giả) |
| `/admin/social-links` | CRUD liên kết mạng xã hội |
| `/admin/nav-links` | CRUD + sắp xếp menu điều hướng |

### 9.2. Xác Thực
- Cơ chế đơn giản: mật khẩu đơn (không phải hệ thống nhiều user, dù model `AdminUser` đã được định nghĩa trong Prisma schema nhưng **không được dùng**).
- `src/lib/admin-auth.ts`: so khớp `process.env.ADMIN_PASSWORD`; tạo session bằng token SHA-256, lưu 2 cookie (`admin_session` httpOnly + `admin_session_hash` để tự xác minh mà không cần lưu session server-side), hết hạn sau 24h.
- `src/middleware.ts` (Edge middleware) chặn mọi `/admin/*` (trừ `/admin/login`) nếu chưa đăng nhập; đăng nhập rồi vào `/admin/login` sẽ redirect về `/admin`.
- Mỗi route `/api/admin/**` tự gọi `verifySession()` riêng (phòng thủ 2 lớp) — **ngoại trừ** các route nhạc, xem [mục 14](#14-điểm-cần-lưu-ý--rủi-ro-kỹ-thuật).

### 9.3. Pattern CRUD Chung
Với các tính năng lưu JSON (skills, projects, photography, nav-links, social-links, site-config, couple): trang admin → gọi API `/api/admin/<feature>` → `verifySession()` → `readJsonFile()`/`writeJsonFile()` (`src/lib/data-manager.ts`, ghi an toàn qua file tạm + rename) → JSON trong `content/data/`. Không có thư viện validate (zod/yup) ở tầng admin — kiểm tra thủ công kiểu `if (!field) return 400`.

Blog là ngoại lệ: đọc/ghi trực tiếp file `.mdx` (không qua JSON registry). Music là ngoại lệ khác: ghi thẳng vào Postgres qua Prisma (xem mục 7 & 12).

### 9.4. Media Library (`/admin/media`)
- Upload file bất kỳ (ảnh/video/audio) → `uploadAndRegisterMedia()` (`src/lib/media-service.ts`) → Cloudinary + đăng ký metadata vào `content/data/media-registry.json`.
- `MediaPickerModal` được tái sử dụng ở nhiều form khác (chọn ảnh bìa track, ảnh cover blog, icon skill...).
- Nút "Sync from Cloudinary": quét tài khoản Cloudinary thật, bổ sung các asset còn thiếu trong registry local.

---

## 10. Form Liên Hệ

**Component**: `ContactSection.tsx`

- Validate bằng `react-hook-form` + `zodResolver` (schema dựng lại theo locale hiện tại để thông báo lỗi song ngữ):
  - Tên: tối thiểu 2 ký tự.
  - Email: đúng định dạng email.
  - Tiêu đề: tối thiểu 5 ký tự.
  - Nội dung: tối thiểu 20 ký tự.
- **Quan trọng — không có backend gửi mail thật**: khi submit hợp lệ, dữ liệu chỉ được lưu vào state cục bộ rồi hiển thị link `mailto:` (điền sẵn subject/body) để người dùng **tự mở ứng dụng mail và bấm gửi**. Không có API route, không có dịch vụ email (SendGrid/Resend...), tin nhắn **không được lưu lại ở đâu cả** nếu người dùng không tự gửi mail.
- Có đầy đủ `aria-invalid`/`aria-describedby` cho accessibility.

---

## 11. Hệ Thống Đa Ngôn Ngữ

Không dùng `next-intl` hay locale-prefixed routing — là hệ thống tự viết, gồm **2 tầng song song**:

### 11.1. Tầng 1 — UI Chrome tĩnh (`t()`)
- `src/locales/en.ts` / `vi.ts`: 2 dictionary TypeScript song song (~1064 dòng mỗi file), gộp lại ở `src/locales/index.ts`.
- `LanguageContext` (bọc toàn app ở root layout) quản lý `locale` hiện tại:
  - Lần đầu: đọc `localStorage["portfolio_locale"]`, nếu chưa có thì tự nhận diện qua `navigator.language` (bắt đầu bằng "vi" → `vi`, còn lại → `en`).
  - `setLocale()` lưu vào cả `localStorage` và cookie (`portfolio_locale`, 1 năm), cập nhật `document.documentElement.lang`.
  - `t()` là hàm được bọc `Proxy` — vừa gọi được như hàm (`t("nav.home")`) vừa truy cập được như thuộc tính lồng nhau (`t.nav.home`), hỗ trợ nội suy `{param}`. Đây là dictionary **tĩnh, bundle sẵn**, không tải từ CMS lúc runtime.
- `LanguageSwitcher` có 3 biến thể UI: `pill`, `toggle`, `dropdown`.

### 11.2. Tầng 2 — Nội dung song ngữ (`_vi`)
- Các model nội dung (project, blog, skill's category, photography, site-config, couple, nav-links) đều có thêm field `_vi` (VD: `title_vi`, `description_vi`, `bio_vi`, `content_vi`), **có thể chỉnh sửa qua Admin**.
- Logic chọn field theo locale được lặp lại thủ công (`locale === "vi" && field_vi ? field_vi : field`) ở từng component, chưa có helper dùng chung.

### 11.3. Lưu Ý
- HTML server-render luôn có `<html lang="en">` cố định; `document.documentElement.lang` chỉ được cập nhật ở phía client sau khi mount — có thể lệch nhẹ về SEO/accessibility ở lần tải đầu tiên (chưa có phát hiện locale từ cookie ở phía server).

---

## 12. Lớp Dữ Liệu & Hạ Tầng

### 12.1. Prisma + PostgreSQL (`src/lib/db.ts`, `prisma/schema.prisma`)
- Dùng driver adapter (`pg.Pool` + `@prisma/adapter-pg`, Prisma v7 không dùng binary engine mặc định nữa), client sinh ra ở `src/generated/prisma` (custom output path), singleton qua `globalThis` để sống sót qua HMR ở dev.
- **Các model đã định nghĩa trong schema**: `AdminUser`, `BlogPost`, `ContactMessage`, `ExperienceEntry`, `Project`, `SiteSettings`, `Skill`, `Testimonial`, `Track`, `Playlist`, `PlaylistTrack`.
- **Chỉ nhóm `Track` / `Playlist` / `PlaylistTrack` (tính năng Music) đang thực sự được đọc/ghi qua Postgres.** Các model còn lại (`BlogPost`, `Project`, `SiteSettings`, `Skill`, `Testimonial`, `ExperienceEntry`, `ContactMessage`, `AdminUser`) đã có sẵn trong schema nhưng **chưa được code nào sử dụng** — nội dung tương ứng vẫn đang chạy trên file JSON (`content/data/*.json`) hoặc MDX. Đây là dấu hiệu một cuộc migrate từ CMS file-based sang Postgres **đang dang dở**, Music là phần duy nhất đã hoàn tất.

### 12.2. Cloudinary & Media Service
- `src/lib/cloudinary.ts`: cấu hình SDK Cloudinary v2, hàm `uploadImage()`, `deleteImage()`, `getOptimisedUrl()` (tự tối ưu định dạng/chất lượng: `fetch_format:"auto", quality:"auto"`).
- `src/lib/media-service.ts` (lớp điều phối cấp cao, dùng chung cho mọi endpoint upload):
  - Chuẩn hoá tên file (bỏ dấu tiếng Việt, slugify), tự chuyển đổi HEIC/HEIF → JPEG trước khi upload (`heic-convert`).
  - Phân loại thư mục Cloudinary theo `category` (`music|photo|project|blog|site|couple|general`) + `subType`.
  - **Audio được upload dưới resource type `video` của Cloudinary** (theo quy ước của Cloudinary, không có resource type `audio` riêng).
  - Chỉ metadata (không phải file nhị phân) được lưu local tại `content/data/media-registry.json` — đây là nguồn cho trang `/admin/media` và các `MediaPickerModal`.
  - Có job đồng bộ `syncAssetsFromCloudinary()` để quét lại tài khoản Cloudinary thật và bổ sung asset còn thiếu trong registry.

### 12.3. Kho Dữ Liệu JSON (`src/lib/data-manager.ts`)
- `readJsonFile()`/`writeJsonFile()` đọc/ghi trực tiếp `content/data/*.json` bằng Node `fs`, ghi an toàn qua file tạm + rename.
- Là nguồn dữ liệu chính cho: skills, projects, photography (+ albums), nav-links, social-links, site-config, couple, media-registry.

---

## 13. UI Component Primitives & Subsystem Lõi

### 13.1. 3D Pipeline (`src/components/3d/`)
- **`SceneContainer.tsx`** — wrapper bắt buộc cho mọi scene React Three Fiber:
  - Tự phát hiện `prefers-reduced-motion`; nếu bật, chỉ render 1 gradient tĩnh CSS, **không mount Canvas** — tối ưu accessibility/hiệu năng.
  - Bọc children trong `SceneErrorBoundary` (class component) — nếu WebGL crash, tự động chuyển sang gradient tĩnh thay vì crash cả trang.
  - Cấu hình sẵn `<Canvas>` (camera, `dpr`, `gl` options), `Suspense` + `Preload all` (drei).
  - **Không được tạo `<Canvas>` độc lập ở nơi khác** — luôn truyền scene vào làm children của `SceneContainer`.
- Các scene có sẵn: `Hero3DScene` (trang chủ), `FloatingTechStack` (skill icons trôi nổi), `ParticleField` (nền hạt tái sử dụng được, cấu hình `count/color/size/spread`), `StarryBackground3D` (nền vũ trụ toàn site qua `GlobalBackground.tsx`).

### 13.2. UI Building Blocks (`src/components/ui/`)
| Component | Mô tả |
|---|---|
| `Button` | Biến thể `primary/secondary/ghost/outline`, 3 size, gradient tím→lục lam cho `primary`. |
| `GlassCard` | Thẻ kính mờ (`backdrop-blur-xl`, viền bán trong suốt), có prop `hover` để sáng viền khi hover. |
| `TiltCard` | Nghiêng 3D theo chuột bằng spring physics, có "shine" highlight, hỗ trợ bàn phím (Enter/Space) cho a11y. |
| `AnimatedSection` | Wrapper kích hoạt animation Framer Motion khi cuộn vào viewport (`useInView`, mặc định chỉ chạy 1 lần). |
| `Navigation` | Header cố định, scroll-spy mục active, chuyển sang mobile menu (hamburger) dưới breakpoint `lg` (1024px — đã hạ từ `xl`/1280px kèm thu gọn gap/padding pill để vừa khít khoảng ~976px nội dung khả dụng), tự ẩn ở `/admin`, `/music`, `/couple`, `/contra`. Xem `docs/ARCHITECTURE.md` §3.7 cho cơ chế đệm section khi cuộn tới mục và fix race condition với Framer Motion. |
| `Footer` | 4 cột (brand/quick links/contact/copyright), cùng logic ẩn route như Navigation. |
| `Icon` | Bộ icon SVG tự vẽ dùng chung, thay cho thư viện icon ngoài. |
| `ImageWithSkeleton` | Wrapper `next/image` có shimmer/fade-in/error fallback/lazy-load. |
| `Skeleton` | Khối placeholder shimmer nền tảng cho loading state. |
| `LanguageSwitcher` / `FlagIcon` | UI đổi ngôn ngữ (xem mục 11). |

### 13.3. Animation Variants (`src/lib/animations.ts`)
`fadeInUp`, `fadeInLeft`, `fadeInRight`, `scaleUp`, `staggerContainer` (điều phối stagger cho con), `blurFadeIn` (mờ dần kèm blur), `floatAnimation` (bay lên-xuống lặp vô hạn, dùng cho trang trí). `AnimatedSection` nhận bất kỳ variants nào trong số này qua prop `variants`.

### 13.4. Data & Types
- `src/lib/constants.ts` — nguồn duy nhất cho `siteConfig`, `navLinks`, `socialLinks`, `skills`, `projects`, `photography`, `albums` (đều đọc từ `content/data/*.json`). **Sửa nội dung ở đây (qua Admin hoặc sửa JSON), không sửa hardcode trong component.**
- `src/lib/types.ts` — định nghĩa domain types tương ứng (`Project`, `BlogPost`, `Skill`, `PhotoItem`, `PhotoAlbum`, `MediaAsset`, các type `Couple*`, v.v).

### 13.5. Styling (Tailwind v4, `src/app/globals.css`)
- Cấu hình qua `@import "tailwindcss"` + `@theme inline` (không có `tailwind.config.js`).
- Design tokens: `--background:#050505`, `--foreground:#fafafa`, `--purple-500:#8b5cf6`, `--cyan-500:#06b6d4`.
- Utility class tái sử dụng: `.gradient-text` (chữ gradient tím→lục lam), `.glass` (glassmorphism), `.glow-purple`/`.glow-cyan` (hào quang neon), `.animate-float` (bồng bềnh), `.animate-pulse-glow` (nhấp nháy hào quang), `.animate-gradient` (gradient động), cùng `.line-clamp-2`, `.animate-shimmer`, `.content-auto`, `.gpu-layer` hỗ trợ hiệu năng.

---

## 14. 🌗 Chế Độ Sáng / Tối (Light/Dark Theme Toggle)

Toàn site hỗ trợ chuyển đổi giữa **Dark** (giao diện gốc, mặc định) và **Light** — nút bấm hình mặt trăng/mặt trời (`ThemeToggle.tsx`) đặt trong `Navigation` (cả bản desktop lẫn mobile menu).

### 14.1. Cơ Chế Kỹ Thuật
- **Không dùng biến thể `dark:` của Tailwind** — vì giao diện gốc vốn đã là dark, dự án định nghĩa biến thể cộng thêm `light:` (`@custom-variant light` trong `globals.css`): mọi class có tiền tố `light:` chỉ áp dụng khi phần tử (hoặc tổ tiên) có `data-theme="light"`. Class không tiền tố giữ nguyên là giao diện dark gốc.
- `ThemeContext.tsx` (`ThemeProvider`, hook `useTheme()`) quản lý state `theme`, ghi `data-theme` lên `<html>`, lưu lựa chọn vào `localStorage["portfolio_theme"]`; nếu chưa từng chọn, tự nhận diện qua `prefers-color-scheme` của hệ điều hành (và tiếp tục lắng nghe thay đổi live nếu người dùng chưa từng chọn thủ công).
- **Chống nháy sai theme (FOUC)**: một inline `<script>` chặn render (`THEME_INIT_SCRIPT` trong `src/app/layout.tsx`) tự set `data-theme` lên `<html>` **trước khi hydrate**, dùng đúng logic với `ThemeContext.tsx` — 2 nơi này phải luôn đồng bộ nếu sửa logic detect theme.
- Design tokens (`--background`, `--foreground`, `--glass-bg`, `--glow-*-color`, `--scrollbar-*`, `--selection-*`) được định nghĩa lại trong khối `[data-theme="light"]` ở `globals.css`; các utility dùng `bg-background`/`text-foreground` tự động đổi màu theo theme mà không cần tiền tố `light:`.

### 14.2. Phạm Vi Áp Dụng
- Đã phủ `light:` cho: Navigation/Footer, các section trang chủ (Hero/About/Skills/Projects/Contact/Photo & Blog Preview), Blog (`BlogList`, `BlogPostView`), Music Player/Sidebar/Room, và toàn bộ module Photography (`PhotographyGallery`, `GridLayout`, `MasonryLayout`, `StoryLayout`, `CompareLayout`, `BeforeAfterSlider`, `AlbumDetailView`) cùng trang Projects (`ProjectsGallery`).
- **Route luôn giữ Dark, không đổi theo lựa chọn người dùng** (`EXCLUDED_ROUTE_PREFIXES` trong `constants.ts`): `/admin`, `/contra`, `/couple`.
- **Ngoại lệ theo component (bất kể route)**: modal xem ảnh toàn màn hình `PhotoLightboxModal.tsx` cố tình **luôn ở chế độ Dark** ("theater mode" để xem ảnh) — quyết định sản phẩm có chủ đích, không phải thiếu sót.
- Các overlay gradient tối phủ lên trực tiếp ảnh/thumbnail (badge danh mục, caption khi hover, nút play video...) **giữ nguyên không đổi theo theme** ở cả 2 chế độ — vì đây là lớp phủ đảm bảo độ tương phản chữ trên ảnh, không phải "chrome" của trang.

---

## 15. ⚠️ Điểm Cần Lưu Ý / Rủi Ro Kỹ Thuật

Các điểm phát hiện được khi khảo sát toàn bộ source — nên đọc trước khi mở rộng/chỉnh sửa tính năng liên quan.

| Mức độ | Vấn đề | Chi tiết |
|---|---|---|
| 🔴 Cao | API nhạc thiếu xác thực | `/api/music/tracks`, `/api/music/tracks/[id]`, `/api/music/upload` **không gọi `verifySession()`** — chỉ được che chắn gián tiếp qua middleware redirect của `/admin` UI. Gọi trực tiếp các endpoint này (VD bằng `curl`/Postman) có thể tạo/sửa/xoá track hoặc upload file **mà không cần đăng nhập admin**. |
| 🔴 Cao | Mật khẩu admin fallback hardcode | `verifyPassword()` fallback về chuỗi `"admin123"` khi thiếu biến môi trường `ADMIN_PASSWORD` — nếu quên set env khi deploy, admin dashboard sẽ có mật khẩu công khai/đoán được. |
| 🟠 Trung bình | Kiến trúc lưu trữ kép (JSON vs Postgres) | Chỉ Music dùng Postgres/Prisma thật; Blog/Project/Skill/SiteSettings/Testimonial/ExperienceEntry/ContactMessage/AdminUser đã có model Prisma **nhưng chưa được dùng** — toàn bộ vẫn chạy trên `content/data/*.json` hoặc MDX. Cần biết rõ trước khi sửa các model này để tránh nhầm tưởng đã "sống" trên DB. |
| 🟠 Trung bình | Form liên hệ không gửi mail thật | Không có API/email service — chỉ tạo link `mailto:` cho người dùng tự gửi. Tin nhắn không được lưu lại nếu người dùng không tự thao tác gửi mail (dù model `ContactMessage` đã có sẵn trong Prisma schema nhưng chưa được nối vào form này). |
| 🟠 Trung bình | Dữ liệu mặc định trùng lặp ở trang Couple | 2 bản `DEFAULT_COUPLE_DATA` độc lập (1 trong `page.tsx`, 1 trong route `/api/couple`) — sửa 1 nơi rất dễ quên sửa nơi còn lại, dẫn tới dữ liệu fallback không nhất quán. |
| 🟡 Thấp | Không có schema validation ở tầng admin | Ngoại trừ `ContactSection` (dùng zod), toàn bộ route `/api/admin/**` validate thủ công kiểu `if (!field) return 400` — dễ bỏ sót edge case khi thêm field mới. |
| 🟡 Thấp | Bucket List không persist | Trạng thái tick "đã hoàn thành" ở trang Couple chỉ là state cục bộ trong component, mất khi tải lại trang. |
| 🟡 Thấp | `<html lang="en">` cố định phía server | Locale thực tế chỉ đổi ở client sau khi mount — có thể ảnh hưởng nhẹ tới SEO/accessibility ở lần request đầu (chưa đọc cookie locale ở server). |
| 🟡 Thấp | Trùng lặp logic resolve nhãn đa ngôn ngữ | `Navigation.tsx` và `Footer.tsx` cùng có logic chọn `label`/`label_vi`/`t()` cho nav-links nhưng **không chia sẻ chung một hàm** — sửa logic phải sửa ở cả 2 nơi. |
| 🟡 Thấp | Theme sáng phải thêm `light:` thủ công từng component | Vì dự án dùng biến thể cộng thêm (`light:`) thay vì `dark:` chuẩn của Tailwind, **component mới/route mới không tự động hỗ trợ Light mode** — phải chủ động thêm class `light:` khi build UI mới, dễ bị bỏ sót nếu không biết quy ước (xem [mục 14](#14-chế-độ-sáng--tối-lightdark-theme-toggle) và `CLAUDE.md`). |
| 🟡 Thấp | Phòng nghe chung nhạc không bền | `/api/music/rooms*` lưu state trong biến `globalThis` (in-memory) — mất khi restart/redeploy server, không hoạt động đúng khi chạy nhiều instance (không phù hợp môi trường serverless đa instance). |
| ℹ️ Ghi chú | Tag filter blog chưa có UI | `getAllTags()`/`getPostsByTag()` đã viết sẵn trong `src/lib/blog.ts` nhưng chưa có nơi nào gọi tới — hiện tại blog chỉ lọc được theo category. |
| 🟡 Thấp | `window.scrollTo` có thể bị Framer Motion ghi đè | Bất kỳ animation layout nào dùng chiều cao `auto` (VD: đóng mobile menu trong `Navigation.tsx`) khiến Framer Motion tạm gọi `window.scrollTo(0,0)` để đo rồi phục hồi. Nếu code gọi `window.scrollTo({behavior:"smooth"})` thủ công trong cùng tick, lệnh đo của Framer sẽ huỷ animation cuộn đó (trang bật về đầu). Cách xử lý hiện tại trong `handleNavClick`: dời lệnh `scrollTo` vào `requestAnimationFrame` lồng đôi — cần áp dụng lại pattern này nếu thêm animation layout mới có kèm scroll thủ công ở nơi khác. |

# 🚀 Modern 3D Developer Portfolio & Multi-Experience Platform

Một nền tảng Portfolio cá nhân cao cấp kết hợp đồ họa không gian 3D tương tác, nền tảng Blog MDX hiệu năng cao, Thư viện Nhiếp ảnh nghệ thuật & Album, Trình phát nhạc toàn cục, Game Arcade 2D Contra hoài niệm, 5 game bài/cờ chơi online nhiều người (`/games`), Hệ thống Quản trị CMS và hỗ trợ Đa ngôn ngữ (Song ngữ EN / VI).

Được xây dựng với **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **React Three Fiber (Three.js)**, **Framer Motion** và kiến trúc tối ưu hiệu năng với **Lazy & Skeleton Loading**.

---

## ✨ Điểm Nổi Bật (Key Features)

### 1. 🌟 Interactive 3D Portfolio (`/`)
- **Hero hố đen 3D**: Nền Hero là hố đen raymarching (WebGL tự quản lý, `src/components/3d/blackhole/`), camera chạy theo cuộn trang mà không kích hoạt chu kỳ re-render của React.
- **Glassmorphic Design System**: Giao diện tối màu hiện đại với hiệu ứng kính mờ (Backdrop Blur), viền neon phát sáng và độ tương phản cao.
- **Clean Tech Stack Showcase**: Phần Kỹ năng (Skills) được thiết kế dạng thẻ chip công nghệ tinh giản, hiện đại, phân loại theo nhóm (Frontend, Backend, DevOps, Design) và loại bỏ hoàn toàn các thanh phần trăm (%) chủ quan.
- **3D Tilt Project Cards**: Thẻ dự án tương tác nghiêng 3D chân thực, gắn nhãn công nghệ và hỗ trợ liên kết nhanh tới Live Demo và GitHub Repository.
- **Lazy Loading & Dynamic Splitting**: Các section dưới nếp gấp trang được tải động (`next/dynamic`) với khung Skeleton sóng ánh sáng giúp tải trang siêu tốc.
- **Contact Form**: Xác thực bằng `react-hook-form` + `zod`, gửi tới `/api/contact` (giới hạn tần suất, lưu tin nhắn vào Postgres, báo qua email bằng Resend).

### 2. 📸 Thư Viện Nhiếp Ảnh Nghệ Thuật & Album (`/photography` & `/photography/album/[slug]`)
- **Bộ Sưu Tập Album (Curated Collections)**: Gom nhóm tác phẩm theo từng album chuyên đề, tự động chọn hoặc gán ảnh bìa đại diện, hỗ trợ song ngữ tiêu đề và mô tả.
- **4 Chế Độ Bố Cục Xem Đa Dạng**:
  - **Xếp tầng (Masonry)**: Bố cục so le linh hoạt theo chiều cao ảnh tự nhiên.
  - **Lưới (Grid)**: Bố cục tỉ lệ đều đặn, chuẩn mực.
  - **So sánh (Compare)**: Thanh trượt Before/After kéo tương tác so sánh ảnh gốc và ảnh sau hậu kỳ (retouch).
  - **Câu chuyện (Story)**: Trải nghiệm phóng sự ảnh phong cách tạp chí nghệ thuật.
- **Lightbox Modal Chi Tiết**: Xem ảnh/video độ phân giải cao, hiển thị đầy đủ thông số máy ảnh EXIF (Khẩu độ, Tốc độ, ISO, Tiêu cự, Ống kính).
- **Sắp Xếp Ưu Tiên Nổi Bật (Featured First)**: Các tác phẩm và album được đánh dấu `featured` sẽ luôn tự động được đưa lên đầu danh sách.

### 3. 🎵 Trình Phát Nhạc & Phòng Nghe Nhạc (`/music`)
- **Phòng Nghe Nhạc Độc Lập**: Giao diện đĩa than Vinyl quay chân thực, bộ trực quan hóa sóng âm thanh (Audio Visualizer) và danh sách bài hát tuyển chọn.
- **Global Floating Music Player**: Trình phát nhạc mini nổi cố định ở góc dưới màn hình, duy trì phát nhạc liền mạch khi người dùng điều hướng qua các trang khác.

### 4. 🌐 Hỗ Trợ Đa Ngôn Ngữ Toàn Diện (Multilingual EN / VI)
- Tích hợp bộ chuyển đổi ngôn ngữ linh hoạt giữa **Tiếng Việt 🇻🇳** và **English 🇬🇧** với bộ icon cờ quốc gia sắc nét.
- Áp dụng xuyên suốt từ Trang chủ, Dự án, Kỹ năng, Blog, Nhiếp ảnh & Album, Kỷ niệm cặp đôi đến toàn bộ Hệ thống Quản trị Admin.

### 5. 🛡️ Hệ Thống Quản Trị Nội Dung Đầy Đủ (Admin CMS Panel) (`/admin`)
- Giao diện quản trị hiện đại, bảo mật đăng nhập:
  - **Quản lý Dự án (Projects)**: Thêm/sửa/xóa thông tin dự án, link demo, github, gắn cờ nổi bật.
  - **Quản lý Bài viết Blog (MDX Blog)**: Soạn thảo, xuất bản và chỉnh sửa nội dung bài viết.
  - **Quản lý Nhiếp ảnh & Album (Photography & Albums)**: Upload ảnh, gom album, chọn ảnh bìa, gán metadata EXIF và trạng thái song ngữ.
  - **Quản lý Kỹ năng (Skills)**: Quản lý icon, danh mục công nghệ và trạng thái xuất bản.
  - **Quản lý Âm nhạc (Music)**: Thêm/sửa danh sách bài hát, link audio, nghệ sĩ.
  - **Quản lý Media**: Thư viện Cloudinary (metadata lưu trong Postgres), đồng bộ lại từ Cloudinary.
  - **Trang Couple**: Ảnh, dòng thời gian, sinh nhật, bucket list, thư tình.
  - **Site Config & Navigation**: Tùy chỉnh thông tin cá nhân, nội dung các section trang chủ, menu điều hướng và mạng xã hội.
- Toàn bộ nội dung được lưu trong **PostgreSQL (Prisma)**; `/admin` được bảo vệ bằng cookie phiên ký HMAC (`AUTH_SECRET`).

### 6. ⚡ Tối Ưu Hóa Hiệu Năng, Lazy & Skeleton Loading
- **Skeleton Shimmer UI**: Bộ khung xương tải trang với hiệu ứng sóng ánh sáng GPU-accelerated cho hình ảnh, thẻ dự án, bài viết và toàn bộ section.
- **`ImageWithSkeleton`**: Tải ảnh mượt mà với hiệu ứng chuyển đổi độ mờ `opacity: 0 -> 1` (`500ms ease-out`), loại bỏ giật nháy (layout shift) và tích hợp lazy loading tự động.
- **Instant Route Transitions (`loading.tsx`)**: Trang tải tức thì theo chuẩn Next.js App Router cho `/photography`, `/projects`, `/blog`.

### 7. 📝 Server-Compiled MDX Blog (`/blog` & `/blog/[slug]`)
- **Server-Side MDX Parsing**: Nạp và biên dịch file `.mdx` bằng `gray-matter` và `next-mdx-remote/rsc`.
- **Syntax Highlighting & Deep Linking**: Tự động tô màu mã nguồn với `rehype-highlight` và tạo heading ID với `rehype-slug`.
- **Lọc Danh Mục Tức Thì**: Phân loại theo chủ đề công nghệ (React, Three.js, Animation,...).

### 8. 🕹️ 2D Contra Arcade Canvas Game (`/contra`)
- **HTML5 Canvas 60 FPS Game Engine**: Động cơ game 2D thuần túy chạy trên Canvas không giật lag.
- **6 Loại Vũ Khí + Khiên**: Đạn thường, Spread Gun (S - 5 tia), Machine Gun (M), Rapid Fire (R), Laser (L), Fireball (F) và khiên bất tử tạm thời Barrier (B).
- **5 Màn & Kẻ Địch**: Jungle, Enemy Base, Waterfall, Snow Field, Alien Hive; lính, xạ thủ, tháp pháo, lính khiên, lính nhảy và Boss cuối mỗi màn.

### 9. 💖 Trang Kỷ Niệm Tình Yêu (Couple Celebration) (`/couple`)
- **Đồng Hồ Tình Yêu Realtime**: Đếm thời gian yêu nhau chính xác đến từng giây.
- **Dòng Thời Gian Kỷ Niệm & Bucket List**: Lưu giữ những khoảnh khắc đáng nhớ và danh sách mục tiêu cùng thực hiện.
- **Hiệu Ứng Lãng Mạn**: Mưa trái tim động bay lượn và những bức thư tình bí mật dạng thẻ lật.

### 10. 🛠️ JSON Parameter Validator (`/tools/json-validator`)
- **Batch Processing & Suffix Matching**: Tự động ghép cặp các file `tb_def_exception_parameter_*.json` và `tb_def_parameter_*.json`.
- **Kiểm Tra Tính Toàn Vẹn Dữ Liệu**: Tìm kiếm và liệt kê các `tb_def_parameter__id` bị thiếu và xuất báo cáo JSON chi tiết.

### 11. 🎮 Game Online Nhiều Người (`/games`)
Trang `/games` liệt kê các game; mỗi game có sảnh (tạo/vào bàn bằng mã, danh sách bàn, bảng xếp hạng) và bàn chơi `/<game>/[room]`, chơi realtime qua WebSocket, có khán giả, chat và emoji:

| Game | Route | Số người |
|---|---|---|
| Tiến Lên Miền Nam | `/tien-len` | 2–4 |
| Mèo Nổ (6 gói mở rộng, 16 combo dựng sẵn hoặc tự chọn) | `/meo-no` | 2–7 |
| Cờ Tỷ Phú (địa danh Việt Nam) | `/co-ty-phu` | 2–6 |
| Đá Quý (kiểu Splendor) | `/splendor` | 2–4 |
| Đấu Súng (kiểu Bang!, 7 bản mở rộng) | `/bang` | 3–8 |

- Backend (phòng, WebSocket, Redis) nằm ở repo riêng **be_game**; client kết nối qua `NEXT_PUBLIC_TIENLEN_SERVER_URL` (mặc định `http://localhost:4000`).
- Khung chung `src/components/games/` (`GamesShell`: thanh tab game, chọn tên người chơi một lần cho mọi game, bảng "tất cả các bàn"). Contra cũng được liệt kê ở `/games` nhưng chơi offline.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Lớp (Layer) | Công nghệ | Mục đích |
|---|---|---|
| **Core Framework** | [Next.js 14 (App Router)](https://nextjs.org/) | Framework React chuẩn sản xuất, hỗ trợ SSR, SSG, RSC và Route Handlers |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict Type Checking đảm bảo độ tin cậy của mã nguồn |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Styling hiện đại với `@theme inline`, biến CSS và animation tùy chỉnh |
| **3D Graphics** | [Three.js](https://threejs.org/) / [React Three Fiber](https://r3f.docs.pmnd.rs/) / [Drei](https://github.com/pmndrs/drei) | Kết xuất khung cảnh không gian 3D WebGL và trường sao động |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Điều phối chuyển động, scroll triggers, modal và hiệu ứng chuyển tab |
| **Performance** | Next.js Dynamic Imports, Skeleton Loading, Image Optimization | Tối ưu hóa tải trang, loại bỏ layout shift và tăng tốc độ phản hồi |
| **Audio Engine** | Web Audio API / HTML5 Audio | Phát nhạc nền toàn cục và phân tích sóng âm (visualizer) |
| **MDX Engine** | [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote), [gray-matter](https://github.com/jonschlinkert/gray-matter) | Đọc và render bài viết kỹ thuật từ Markdown mở rộng |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) | Quản lý trạng thái form và kiểm tra tính hợp lệ dữ liệu |
| **Database** | PostgreSQL + [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) | Lưu toàn bộ nội dung CMS, blog, nhạc, tin nhắn liên hệ |
| **Media Hosting** | Cloudinary | Lưu trữ và phân phối hình ảnh/video/audio |
| **Email** | [Resend](https://resend.com/) | Thông báo khi có tin nhắn liên hệ mới |
| **Game Online** | be_game (Vercel WebSocket + Redis, repo riêng) | Phòng chơi realtime cho các game ở `/games` |

---

## 📁 Cấu Trúc Mã Nguồn (Source Tree)

```
portfolio/
├── content/
│   ├── blog/                  # Bài blog .mdx cũ (nguồn cho script migrate)
│   └── data/                  # JSON cũ (nguồn cho script migrate — dữ liệu thật nằm trong Postgres)
├── docs/                      # Tài liệu kỹ thuật chi tiết (+ bộ prompt vẽ bài *_ART_PROMPTS.md)
├── prisma/schema.prisma       # Schema Postgres (client sinh ra ở src/generated/prisma)
├── public/                    # Static assets (fonts, ảnh bài game public/games/...)
├── scripts/                   # migrate-json-to-db.ts, card-art.mjs (npm run art:meono / art:bang)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Hệ thống CMS Admin (Projects, Photography, Music, Skills,...)
│   │   ├── api/               # Backend API Route Handlers
│   │   ├── blog/              # Trang Blog & Chi tiết bài viết (MDX)
│   │   ├── contra/            # Trang Game 2D Arcade Contra
│   │   ├── games/             # Trang tổng các game
│   │   ├── tien-len/, meo-no/, co-ty-phu/, splendor/, bang/   # Sảnh + bàn chơi [room] của từng game online
│   │   ├── couple/            # Trang Kỷ niệm cặp đôi
│   │   ├── music/             # Trang Phòng nghe nhạc
│   │   ├── photography/       # Trang Thư viện ảnh & Chi tiết Album
│   │   ├── projects/          # Trang Danh sách dự án
│   │   ├── tools/             # Công cụ Developer (JSON validator)
│   │   ├── globals.css        # Cấu hình Tailwind v4 & Shimmer Animations
│   │   ├── layout.tsx         # Root Layout (Nav, Footer, MusicPlayer, Providers)
│   │   └── page.tsx           # Trang chủ Portfolio (Dynamic Sections)
│   ├── components/
│   │   ├── 3d/                # Three.js / React Three Fiber Scenes
│   │   ├── admin/             # UI Components quản trị CMS
│   │   ├── blog/              # Blog UI Components
│   │   ├── game/              # Canvas 2D Game Engine (Contra)
│   │   ├── games/             # Khung chung game online (GamesShell, GameLobby, gameClient, chat,...)
│   │   ├── tienlen/, meono/, typhu/, splendor/, bang/   # Bàn chơi của từng game
│   │   ├── layout/            # Layout components (GlobalBackground)
│   │   ├── music/             # Music Player & Audio Visualizer
│   │   ├── photography/       # Layouts (Masonry, Grid, Compare, Story) & Album Views
│   │   ├── projects/          # Projects UI Components
│   │   ├── sections/          # Portfolio Sections (Hero, About, Skills, Projects,...)
│   │   └── ui/                # Reusable UI Primitives (Button, Skeleton, ImageWithSkeleton,...)
│   ├── context/               # React Contexts (Language, Music, Theme, Toast)
│   ├── locales/               # Từ điển đa ngôn ngữ (vi.ts, en.ts)
│   ├── middleware.ts          # Bảo vệ /admin
│   └── lib/                   # db.ts (Prisma), content/* (truy cập dữ liệu), bản sao luật/giao thức game (tienlen/, meono/,...), utils
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Bắt Đầu Nhanh (Getting Started)

### 1. Cài Đặt Dependencies

```bash
npm install
```

### 2. Thiết Lập Biến Môi Trường (Environment Variables)

Sao chép `.env.example` thành `.env.local` (Next.js) và `.env` (Prisma CLI / script) rồi điền giá trị thật. Danh sách đầy đủ kèm chú thích nằm trong [`.env.example`](.env.example):

| Biến | Dùng cho |
|---|---|
| `DATABASE_URL` | Postgres (Neon…) — bắt buộc, mọi trang đọc dữ liệu từ DB |
| `AUTH_SECRET`, `ADMIN_PASSWORD` | Ký cookie phiên & mật khẩu đăng nhập `/admin` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload/quản lý media |
| `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL` | Email báo tin nhắn liên hệ mới |
| `NEXT_PUBLIC_TIENLEN_SERVER_URL` | URL backend be_game cho mọi game online (mặc định `http://localhost:4000`) |

`npm install` tự chạy `prisma generate` (postinstall). Nếu DB còn trống, có thể nạp dữ liệu mẫu từ `content/` bằng `npx tsx scripts/migrate-json-to-db.ts`.

### 3. Chạy Môi Trường Phát Triển (Development Mode)

```bash
npm run dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

### 4. Kiểm Tra Linter & Type Check

```bash
npm run lint            # eslint .
npx tsc --noEmit -p .   # type check
```

### 5. Build Bản Production

```bash
npm run build
npm run start
```

---

## 📖 Tài Liệu Tham Khảo (Documentation)

Để tìm hiểu sâu hơn về từng khía cạnh của dự án, vui lòng tham khảo các tài liệu chuyên biệt trong thư mục `docs/`:

- 🏛️ [**Kiến Trúc Hệ Thống (Architecture)**](docs/ARCHITECTURE.md): Phân tích chi tiết WebGL pipeline, MDX rendering, Canvas loop và Error Boundary.
- 🚀 [**Đặc Tả Tính Năng (Features Spec)**](docs/FEATURES.md): Danh mục chi tiết các component và khả năng tương tác.
- 🎨 [**Hướng Dẫn Tùy Biến (Customization Guide)**](docs/CUSTOMIZATION_GUIDE.md): Các bước chỉnh sửa thông tin cá nhân, cập nhật kỹ năng, thêm dự án mới và viết blog.
- 🚢 [**Hướng Dẫn Triển Khai (Deployment Guide)**](docs/DEPLOYMENT.md): Hướng dẫn deploy lên Vercel, VPS, Docker container và tối ưu hóa SEO.
- 🎨 [`docs/MEONO_ART_PROMPTS.md`](docs/MEONO_ART_PROMPTS.md), [`docs/BANG_ART_PROMPTS.md`](docs/BANG_ART_PROMPTS.md): Prompt vẽ ảnh lá bài (tùy chọn) cho Mèo Nổ / Đấu Súng.

---

## 📄 Bản Quyền (License)

Dự án này được phân phối dưới giấy phép mã nguồn mở. Xem chi tiết tại file [LICENSE](LICENSE).


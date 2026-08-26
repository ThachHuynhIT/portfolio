# 🚀 Modern 3D Developer Portfolio & Multi-Experience Platform

Một nền tảng Portfolio cá nhân cao cấp kết hợp đồ họa không gian 3D tương tác, nền tảng Blog MDX hiệu năng cao, game Arcade 2D Contra hoài niệm và các công cụ tiện ích cho lập trình viên.

Được xây dựng với **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **React Three Fiber (Three.js)** và **Framer Motion**.

---

## ✨ Điểm Nổi Bật (Key Features)

### 1. 🌟 Interactive 3D Portfolio (`/`)
- **Interactive 3D Hero Scene**: Vật thể 3D hình khối xoay mượt mà và tương tác trực tiếp theo chuyển động chuột mà không kích hoạt chu kỳ re-render của React.
- **Glassmorphic Design System**: Giao diện tối màu hiện đại với hiệu ứng kính mờ (Backdrop Blur), viền neon phát sáng và độ tương phản cao.
- **3D Tilt Project Cards**: Thẻ dự án tương tác nghiêng 3D chân thực, gắn nhãn công nghệ và hỗ trợ liên kết nhanh tới Live Demo và GitHub Repository.
- **Contact Form Validation**: Form gửi liên hệ được xác thực dữ liệu chặt chẽ bằng `react-hook-form` và `zod`.

### 2. 📝 Server-Compiled MDX Blog (`/blog` & `/blog/[slug]`)
- **Server-Side MDX Parsing**: Nạp và biên dịch file `.mdx` bằng `gray-matter` và `next-mdx-remote/rsc`.
- **Syntax Highlighting & Deep Linking**: Tự động tô màu mã nguồn với `rehype-highlight` và tạo heading ID với `rehype-slug`.
- **Instant Category Filtering**: Lọc bài viết theo danh mục tức thì ngay tại client-side.
- **Static Generation & Dynamic SEO**: Sinh static page khi build và tối ưu thẻ meta OpenGraph theo từng bài viết.

### 3. 🕹️ 2D Contra Arcade Canvas Game (`/contra`)
- **HTML5 Canvas 60 FPS Game Engine**: Động cơ game 2D thuần túy chạy trên Canvas không giật lag.
- **6 Hệ Thống Vũ Khí**: Đạn thường, Spread Gun (S - 5 tia), Machine Gun (M), Rapid Fire (R), Laser (L), Barrier (B), Fireball (F).
- **Trùm Cuối & Kẻ Địch AI**: Lính tuần tra, xạ thủ trên cao, tháp pháo xoay 360°, drone bay và Boss đa giai đoạn.
- **Hiệu Ứng Hoài Niệm (Retro FX)**: Bộ lọc CRT scanlines, rung lắc màn hình khi nổ, hệ thống mảnh vỡ hạt tàn lửa.

### 4. 🛠️ JSON Parameter Validator (`/tools/json-validator`)
- **Batch Processing & Suffix Matching**: Tự động ghép cặp các file `tb_def_exception_parameter_*.json` và `tb_def_parameter_*.json`.
- **Data Integrity Verification**: Tìm kiếm và liệt kê các `tb_def_parameter__id` bị thiếu.
- **Báo Cáo & Export**: Hỗ trợ xuất file báo cáo JSON chi tiết chỉ với 1 click.

### 5. 💖 Trang Kỷ Niệm Tình Yêu (Couple Celebration) (`/couple`)
- **Đồng Hồ Tình Yêu Realtime**: Đếm thời gian yêu nhau chính xác đến từng giây.
- **Dòng Thời Gian Kỷ Niệm & Bucket List**: Lưu giữ những khoảnh khắc đáng nhớ và danh sách mục tiêu cùng thực hiện.
- **Hiệu Ứng Lãng Mạn**: Mưa trái tim động bay lượn và những bức thư tình bí mật dạng thẻ lật.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Lớp (Layer) | Công nghệ | Mục đích |
|---|---|---|
| **Core Framework** | [Next.js 14 (App Router)](https://nextjs.org/) | Framework React chuẩn sản xuất, hỗ trợ SSR, SSG và RSC |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict Type Checking đảm bảo độ tin cậy của mã nguồn |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Styling hiện đại với `@theme inline` và biến CSS tùy chỉnh |
| **3D Graphics** | [Three.js](https://threejs.org/) / [React Three Fiber](https://r3f.docs.pmnd.rs/) / [Drei](https://github.com/pmndrs/drei) | Kết xuất khung cảnh 3D WebGL hiệu năng cao |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Điều phối chuyển động, scroll triggers và thẻ nghiêng 3D |
| **MDX Engine** | [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote), [gray-matter](https://github.com/jonschlinkert/gray-matter) | Đọc và render bài viết kỹ thuật từ Markdown mở rộng |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) | Quản lý trạng thái form và kiểm tra tính hợp lệ dữ liệu |
| **Icons & Fonts** | `next/font/google` (Inter, Space Grotesk) | Tối ưu hóa tải phông chữ và chống giật bố cục (CLS) |

---

## 📁 Cấu Trúc Mã Nguồn (Source Tree)

```
portfolio/
├── content/blog/              # Các bài viết blog (.mdx)
├── docs/                      # Tài liệu kỹ thuật chi tiết
│   ├── ARCHITECTURE.md        # Kiến trúc hệ thống & luồng xử lý
│   ├── FEATURES.md            # Đặc tả chi tiết từng tính năng
│   ├── CUSTOMIZATION_GUIDE.md # Hướng dẫn thay đổi thông tin cá nhân & giao diện
│   └── DEPLOYMENT.md          # Hướng dẫn build, Docker & deploy
├── public/                    # Static files (ảnh, icons, resume.pdf)
├── src/
│   ├── app/                   # App Router (Pages, Layouts & Route Handlers)
│   │   ├── blog/              # Trang Blog & Chi tiết bài viết
│   │   ├── contra/            # Trang Game Contra
│   │   ├── couple/            # Trang Kỷ niệm cặp đôi
│   │   ├── tools/             # Trang Tiện ích Developer
│   │   ├── globals.css        # Cấu hình Tailwind v4 & Design Tokens
│   │   ├── layout.tsx         # Root Layout
│   │   └── page.tsx           # One-page Portfolio chính
│   ├── components/
│   │   ├── 3d/                # Three.js / React Three Fiber Components
│   │   ├── blog/              # Blog UI Components
│   │   ├── game/              # Canvas 2D Game Engine
│   │   ├── sections/          # Portfolio Sections (Hero, About, Skills, Projects, Contact)
│   │   ├── tools/             # Tool Components
│   │   └── ui/                # Reusable UI Primitives (Button, Card, Nav, Footer,...)
│   └── lib/
│       ├── animations.ts      # Framer Motion animation variants
│       ├── blog.ts            # MDX file reader & parser
│       ├── constants.ts       # Central data (Profile, Skills, Projects, Socials)
│       ├── types.ts           # Shared TypeScript domain types
│       └── utils.ts           # Classnames utility (cn)
├── CLAUDE.md                  # Hướng dẫn dành cho AI coding assistant
└── package.json               # Dependencies & scripts
```

---

## 🚀 Bắt Đầu Nhanh (Getting Started)

### 1. Cài Đặt Dependencies

```bash
npm install
```

### 2. Chạy Môi Trường Phát Triển (Development Mode)

```bash
npm run dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

### 3. Kiểm Tra Linter & Type Check

```bash
npm run lint
```

### 4. Build Bản Production

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

---

## 📄 Bản Quyền (License)

Dự án này được phân phối dưới giấy phép mã nguồn mở. Xem chi tiết tại file [LICENSE](LICENSE).

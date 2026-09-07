# 🚀 Modern 3D Developer Portfolio & Multi-Experience Platform

Một nền tảng Portfolio cá nhân cao cấp kết hợp đồ họa không gian 3D tương tác, nền tảng Blog MDX hiệu năng cao, Thư viện Nhiếp ảnh nghệ thuật & Album, Trình phát nhạc toàn cục, Game Arcade 2D Contra hoài niệm, Hệ thống Quản trị CMS và hỗ trợ Đa ngôn ngữ (Song ngữ EN / VI).

Được xây dựng với **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **React Three Fiber (Three.js)**, **Framer Motion** và kiến trúc tối ưu hiệu năng với **Lazy & Skeleton Loading**.

---

## ✨ Điểm Nổi Bật (Key Features)

### 1. 🌟 Interactive 3D Portfolio (`/`)
- **Interactive 3D Hero Scene**: Vật thể 3D hình khối xoay mượt mà và tương tác trực tiếp theo chuyển động chuột mà không kích hoạt chu kỳ re-render của React.
- **Glassmorphic Design System**: Giao diện tối màu hiện đại với hiệu ứng kính mờ (Backdrop Blur), viền neon phát sáng và độ tương phản cao.
- **Clean Tech Stack Showcase**: Phần Kỹ năng (Skills) được thiết kế dạng thẻ chip công nghệ tinh giản, hiện đại, phân loại theo nhóm (Frontend, Backend, DevOps, Design) và loại bỏ hoàn toàn các thanh phần trăm (%) chủ quan.
- **3D Tilt Project Cards**: Thẻ dự án tương tác nghiêng 3D chân thực, gắn nhãn công nghệ và hỗ trợ liên kết nhanh tới Live Demo và GitHub Repository.
- **Lazy Loading & Dynamic Splitting**: Các section dưới nếp gấp trang được tải động (`next/dynamic`) với khung Skeleton sóng ánh sáng giúp tải trang siêu tốc.
- **Contact Form Validation**: Form gửi liên hệ được xác thực dữ liệu chặt chẽ bằng `react-hook-form` và `zod`.

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
- **Chia Sẻ Phòng Nghe Nhạc**: Hỗ trợ tạo và tham gia phòng nghe nhạc thông qua mã phòng (Room Code).

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
  - **Quản lý Media**: Tích hợp Cloudinary & kho lưu trữ media nội bộ.
  - **Site Config & Navigation**: Tùy chỉnh thông tin cá nhân, menu điều hướng và mạng xã hội.

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
- **6 Hệ Thống Vũ Khí**: Đạn thường, Spread Gun (S - 5 tia), Machine Gun (M), Rapid Fire (R), Laser (L), Barrier (B), Fireball (F).
- **Trùm Cuối & Kẻ Địch AI**: Lính tuần tra, xạ thủ trên cao, tháp pháo xoay 360°, drone bay và Boss đa giai đoạn kèm hiệu ứng màn hình CRT cổ điển.

### 9. 💖 Trang Kỷ Niệm Tình Yêu (Couple Celebration) (`/couple`)
- **Đồng Hồ Tình Yêu Realtime**: Đếm thời gian yêu nhau chính xác đến từng giây.
- **Dòng Thời Gian Kỷ Niệm & Bucket List**: Lưu giữ những khoảnh khắc đáng nhớ và danh sách mục tiêu cùng thực hiện.
- **Hiệu Ứng Lãng Mạn**: Mưa trái tim động bay lượn và những bức thư tình bí mật dạng thẻ lật.

### 10. 🛠️ JSON Parameter Validator (`/tools/json-validator`)
- **Batch Processing & Suffix Matching**: Tự động ghép cặp các file `tb_def_exception_parameter_*.json` và `tb_def_parameter_*.json`.
- **Kiểm Tra Tính Toàn Vẹn Dữ Liệu**: Tìm kiếm và liệt kê các `tb_def_parameter__id` bị thiếu và xuất báo cáo JSON chi tiết.

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
| **Media Hosting** | Cloudinary / Local Storage | Lưu trữ và phân phối hình ảnh/video độ nét cao |

---

## 📁 Cấu Trúc Mã Nguồn (Source Tree)

```
portfolio/
├── content/
│   ├── blog/                  # Các bài viết blog (.mdx)
│   └── data/                  # Dữ liệu JSON (projects, photography, albums, skills, music,...)
├── docs/                      # Tài liệu kỹ thuật chi tiết
├── public/                    # Static assets (ảnh, icons, resume.pdf)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Hệ thống CMS Admin (Projects, Photography, Music, Skills,...)
│   │   ├── api/               # Backend API Route Handlers
│   │   ├── blog/              # Trang Blog & Chi tiết bài viết (MDX)
│   │   ├── contra/            # Trang Game 2D Arcade Contra
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
│   │   ├── game/              # Canvas 2D Game Engine
│   │   ├── layout/            # Layout components (GlobalBackground)
│   │   ├── music/             # Music Player & Audio Visualizer
│   │   ├── photography/       # Layouts (Masonry, Grid, Compare, Story) & Album Views
│   │   ├── projects/          # Projects UI Components
│   │   ├── sections/          # Portfolio Sections (Hero, About, Skills, Projects,...)
│   │   └── ui/                # Reusable UI Primitives (Button, Skeleton, ImageWithSkeleton,...)
│   ├── context/               # React Contexts (LanguageContext, MusicContext)
│   ├── locales/               # Từ điển đa ngôn ngữ (vi.ts, en.ts)
│   └── lib/                   # Utilities, animations, constants, types
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

Tạo file `.env.local` tại thư mục gốc với các thông tin cấu hình (nếu sử dụng Cloudinary hoặc tính năng Admin):

```env
ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Chạy Môi Trường Phát Triển (Development Mode)

```bash
npm run dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

### 4. Kiểm Tra Linter & Type Check

```bash
npm run lint
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

---

## 📄 Bản Quyền (License)

Dự án này được phân phối dưới giấy phép mã nguồn mở. Xem chi tiết tại file [LICENSE](LICENSE).


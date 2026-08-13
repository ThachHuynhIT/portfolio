# 🚀 Đặc Tả Tính Năng (Features Specification)

Tài liệu này cung cấp mô tả chi tiết về tất cả các tính năng, trang, component và trải nghiệm người dùng trong hệ thống.

---

## Danh Mục Tính Năng

1. [🌟 Trang Chủ Portfolio (Main Portfolio)](#1-trang-chủ-portfolio-main-portfolio)
2. [📝 MDX Blog Platform](#2-mdx-blog-platform)
3. [🕹️ 2D Contra Arcade Game](#3-2d-contra-arcade-game)
4. [🛠️ JSON Parameter Validator](#4-json-parameter-validator)
5. [💖 Trang Kỷ Niệm Tình Yêu (Couple Page)](#5-trang-kỷ-niệm-tình-yêu-couple-page)
6. [🎨 UI Component Primitives](#6-ui-component-primitives)

---

## 1. Trang Chủ Portfolio (Main Portfolio)

**Route**: `/` (`src/app/page.tsx`)

Trang chủ là một One-Page Application cuộn mượt mà với 5 phần chính:

### 1.1. Hero Section (`src/components/sections/HeroSection.tsx`)
- **3D Interactive Visual**: Wireframe 3D Icosahedron & Torus Knot xoay theo thời gian thực và tương tác với chuyển động chuột.
- **Dynamic Text Highlight**: Hiển thị tên lập trình viên với hiệu ứng gradient tím - lục lam (`.gradient-text`).
- **Call-to-Action Buttons**:
  - `View My Work`: Cuộn mượt mà xuống phần `#projects`.
  - `Download CV`: Tải trực tiếp file `resume.pdf` từ thư mục `public/`.
- **Status Indicator**: Badge "Available for new opportunities" với hiệu ứng radar pulse xanh lục.

### 1.2. About Section (`src/components/sections/AboutSection.tsx`)
- **Bio & Identity**: Giới thiệu cá nhân, vị trí công tác và triết lý lập trình.
- **Highlight Cards**:
  - 🚀 Fast Delivery & Clean Architecture.
  - 🎨 Modern & Responsive Design.
  - 💡 Continuous Learning & Problem Solving.
- **Animated Stats**: Thống kê số năm kinh nghiệm, số dự án hoàn thành và sự hài lòng.

### 1.3. Skills Section (`src/components/sections/SkillsSection.tsx`)
- **Phân loại 4 nhóm kỹ năng**:
  - `Frontend`: React, Next.js, TypeScript, Three.js, Tailwind CSS.
  - `Backend`: Node.js, Python, PostgreSQL, MongoDB.
  - `Tools`: Docker, Git.
  - `Design`: Figma.
- **Skill Bar Progress & Level**: Hiển thị % độ thành thạo và icon sinh động.
- **Interactive Floating 3D Icons**: Nền phụ họa 3D tương tác.

### 1.4. Projects Section (`src/components/sections/ProjectsSection.tsx`)
- **Interactive 3D Tilt Cards (`TiltCard.tsx`)**: Hiệu ứng nghiêng phối cảnh 3D tự nhiên theo vị trí chuột.
- **Project Filter / Tagging**: Hiển thị tags công nghệ (e.g. Next.js, Three.js, WebGL, AI, TypeScript).
- **Featured Badges**: Đánh dấu các dự án tiêu biểu (`featured: true`).
- **Quick Links**: Nút xem Demo trực tiếp (`liveUrl`) và mã nguồn GitHub (`githubUrl`).

### 1.5. Contact Section (`src/components/sections/ContactSection.tsx`)
- **3D Particle Field**: Nền hạt 3D chuyển động chậm tạo chiều sâu thị giác.
- **Form Validation chặt chẽ**: Sử dụng `react-hook-form` + `zod` xác thực:
  - Tên (tối thiểu 2 ký tự).
  - Email (định dạng email hợp lệ).
  - Tiêu đề (tối thiểu 5 ký tự).
  - Nội dung tin nhắn (tối thiểu 20 ký tự).
- **Fallback Mailto Client**: Tự động mở client gửi email của người dùng với nội dung đã điền nếu không dùng backend serverless mail.

---

## 2. MDX Blog Platform

**Routes**:
- Danh sách bài viết: `/blog` (`src/app/blog/page.tsx`)
- Chi tiết bài viết: `/blog/[slug]` (`src/app/blog/[slug]/page.tsx`)

### 2.1. Quản Lý Nội Dung Bằng MDX
- Các bài viết được lưu trữ tại `content/blog/*.mdx`.
- Hỗ trợ Frontmatter đầy đủ:
  ```yaml
  ---
  title: "Tên bài viết"
  excerpt: "Tóm tắt ngắn gọn"
  date: "2024-11-20"
  category: "Tutorial"
  tags: ["react", "three.js", "3d"]
  readTime: "8 min read"
  ---
  ```

### 2.2. Tính Năng Blog
- **Category Filter Tức Thì (`BlogList.tsx`)**: Lọc bài viết theo danh mục mà không tải lại trang.
- **Code Syntax Highlighting**: Sử dụng `rehype-highlight` tự động tô màu code block cho TypeScript, JS, Bash, CSS,...
- **Auto Heading Slugs**: Plugin `rehype-slug` tự động gán `id` cho các thẻ tiêu đề để hỗ trợ Deep Linking.
- **Glassmorphic Reader Layout**: Khung đọc bài viết tối ưu typography, tương phản cao, dễ đọc.
- **Tác Giả Card & Tag Cloud**: Hiển thị thông tin tác giả và danh sách thẻ liên quan cuối bài.

---

## 3. 🕹️ 2D Contra Arcade Game

**Route**: `/contra` (`src/app/contra/page.tsx` & `src/components/game/ContraGame.tsx`)

Một game arcade 2D cổ điển được viết bằng HTML5 Canvas:

### 3.1. Cơ Chế Điều Khiển
- **Di chuyển**: `A` / `D` hoặc `Mũi tên Trái` / `Phải`.
- **Ngồi / Trườn (Prone)**: `S` hoặc `Mũi tên Xuống`.
- **Nhắm bắn 8 hướng**: Kết hợp di chuyển + ngắm (`W`, `S`, chéo).
- **Nhảy**: `K` hoặc `Space` (hỗ trợ nhảy xuyên qua các nền tảng xuyên thấu `bridge`).
- **Bắn**: `J` hoặc `Z` (giữ phím để bắn liên thanh).
- **Tạm dừng**: `P` hoặc `Escape`.

### 3.2. Hệ Thống Vũ Khí (Power-Ups)
- **Normal Gun**: Đạn thường cơ bản.
- **Spread Gun (S)**: Bắn chùm 5 tia hình nón uy lực diện rộng.
- **Machine Gun (M)**: Bắn đạn liên thanh tốc độ cao.
- **Rapid Fire (R)**: Tăng tốc độ bay và sát thương của đạn.
- **Laser Gun (L)**: Tia laser xuyên phá qua nhiều mục tiêu.
- **Barrier Shield (B)**: Khiên chắn năng lượng bất tử tạm thời.
- **Fireball (F)**: Đạn lửa xoáy gây sát thương nổ diện rộng.

### 3.3. Kẻ Địch & Môi Trường
- **Kẻ địch AI**: Lính bộ binh tuần tra, lính bắn tỉa trên cao, pháo tháp xoay 360 độ, drone bay.
- **Boss Chiến**: Trùm cuối với thanh máu (Boss HP bar), các đợt tấn công phân tầng và triệu hồi lính hỗ trợ.
- **Môi trường phong phú**: Nền đất, cầu nổ, gai nhọn sát thương, vùng nước bơi lội (`swimming`).
- **Hiệu ứng đồ họa**: CRT Scanline filter, hiệu ứng rung màn hình khi nổ (screen shake), hệ thống hạt tàn lửa.

---

## 4. 🛠️ JSON Parameter Validator

**Route**: `/tools/json-validator` (`src/app/tools/json-validator/page.tsx`)

Công cụ chuyên dụng dành cho Developer để kiểm tra tính khớp nối dữ liệu:

### 4.1. Quy Trình Hoạt Động
1. Người dùng kéo thả nhiều file `.json` vào khu vực Dropzone.
2. Hệ thống tự động lọc và nhóm các cặp file theo hậu tố tên file (`_suffix`):
   - File Exception: `tb_def_exception_parameter_<suffix>.json`
   - File Parameter: `tb_def_parameter_<suffix>.json`
3. So khớp các `tb_def_parameter__id` được định nghĩa trong danh sách exception xem có tồn tại trong danh mục parameter không.

### 4.2. Kết Quả & Báo Cáo
- Hiển thị danh sách các ID bị thiếu (Missing IDs).
- Thống kê tổng số lượng tham số đã kiểm tra và tổng số tham số hợp lệ.
- Nút xuất báo cáo (Export Report) ra file JSON chi tiết.

---

## 5. 💖 Trang Kỷ Niệm Tình Yêu (Couple Page)

**Route**: `/couple` (`src/app/couple/page.tsx`)

Trang kỷ niệm tình yêu lãng mạn được thiết kế độc lập:

- **Đồng Hồ Tình Yêu Thời Gian Thực**: Đếm chính xác số năm, tháng, ngày, giờ, phút, giây bên nhau từ mốc thời gian kỷ niệm.
- **Countdown Kỷ Niệm Tiếp Theo**: Đếm ngược đến ngày kỷ niệm tiếp theo (1 năm, 2 năm,...).
- **Interactive Timeline**: Dòng thời gian các sự kiện đáng nhớ (lần đầu gặp, buổi hẹn hò đầu tiên, ngày chính thức yêu).
- **Bucket List Tương Tác**: Danh sách những điều ước/mục tiêu cùng làm với trạng thái đã hoàn thành (`done: true/false`).
- **Bức Thư Tình (Love Letters)**: Thẻ lật mở (flip cards) chứa những tâm thư bí mật.
- **Hiệu Ứng Lãng Mạn**: Floating heart particles bay trên màn hình và trình phát nhạc nền tùy chọn.

---

## 6. 🎨 UI Component Primitives (`src/components/ui/`)

| Component | File | Mô tả |
|---|---|---|
| **`AnimatedSection`** | `AnimatedSection.tsx` | Wrapper kích hoạt hiệu ứng Framer Motion khi cuộn tới màn hình (`viewport={{ once: true }}`). |
| **`Button`** | `Button.tsx` | Nút bấm đa năng với các biến thể: `primary`, `secondary`, `outline`, `ghost` kèm glow effects. |
| **`GlassCard`** | `GlassCard.tsx` | Thẻ hiệu ứng kính mờ (Backdrop Blur, viền bán trong suốt, đổ bóng). |
| **`TiltCard`** | `TiltCard.tsx` | Thẻ tương tác 3D nghiêng theo tọa độ chuột với hiệu ứng spring physics. |
| **`Navigation`** | `Navigation.tsx` | Thanh điều hướng cố định trên đầu trang với hiệu ứng kính mờ, mobile menu và chỉ báo mục active. |
| **`Footer`** | `Footer.tsx` | Chân trang với liên kết mạng xã hội, copyright và nút "Scroll to top". |

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

---

## 1. Thay Đổi Thông Tin Cá Nhân & Cấu Hình Trang

Tất cả thông tin cốt lõi của portfolio được tập trung tại **`src/lib/constants.ts`**.

### 1.1. Cập nhật `siteConfig`
Mở file `src/lib/constants.ts` và chỉnh sửa:

```typescript
export const siteConfig = {
  name: "Tên Bạn Portfolio",
  title: "Tên Bạn | Senior Fullstack Developer",
  description: "Mô tả ngắn gọn về kinh nghiệm, thế mạnh và đam mê của bạn...",
  url: "https://yourdomain.com",
  ogImage: "/og.jpg",
  author: {
    name: "Tên Bạn",
    title: "Senior Fullstack Developer",
    bio: "Tôi xây dựng các sản phẩm web hiện đại kết hợp giữa trải nghiệm người dùng tinh tế và kiến trúc hệ thống bền vững.",
    avatar: "/avatar.jpg", // Đặt ảnh của bạn vào thư mục public/avatar.jpg
    email: "contact@yourdomain.com",
    location: "TP. Hồ Chí Minh, Việt Nam",
  },
};
```

### 1.2. Cập nhật Liên kết Xã hội (`socialLinks`)
```typescript
export const socialLinks: SocialLink[] = [
  { name: "GitHub", url: "https://github.com/yourusername", icon: "github" },
  { name: "LinkedIn", url: "https://linkedin.com/in/yourusername", icon: "linkedin" },
  { name: "Twitter", url: "https://twitter.com/yourusername", icon: "twitter" },
];
```

### 1.3. Cập nhật File CV / Resume
Đặt file PDF của bạn vào thư mục `public/resume.pdf`. Nút "Download CV" ở Hero Section sẽ tự động tải file này.

---

## 2. Quản Lý Kỹ Năng (Skills)

Mở `src/lib/constants.ts` và chỉnh sửa mảng `skills`:

```typescript
export const skills: Skill[] = [
  { name: "React", icon: "⚛️", category: "frontend", level: 95 },
  { name: "Next.js", icon: "▲", category: "frontend", level: 90 },
  { name: "TypeScript", icon: "📘", category: "frontend", level: 92 },
  { name: "Node.js", icon: "🟢", category: "backend", level: 88 },
  { name: "PostgreSQL", icon: "🐘", category: "backend", level: 85 },
  { name: "Docker", icon: "🐳", category: "tools", level: 80 },
  { name: "Figma", icon: "🎯", category: "design", level: 75 },
];
```

- **`category`**: Thuộc 1 trong 4 nhóm: `"frontend" | "backend" | "tools" | "design"`.
- **`level`**: Số nguyên từ `1` đến `100` để hiển thị thanh phần trăm tiến độ.

---

## 3. Thêm / Sửa Dự Án (Projects)

Mở `src/lib/constants.ts` và cập nhật mảng `projects`:

```typescript
export const projects: Project[] = [
  {
    id: "project-slug-1",
    title: "Tên Dự Án Của Bạn",
    description: "Mô tả ngắn hiển thị trên thẻ dự án.",
    longDescription: "Mô tả chi tiết về công nghệ, kiến trúc và thách thức giải quyết...",
    image: "/projects/my-project.jpg", // Đặt ảnh vào thư mục public/projects/
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL"],
    liveUrl: "https://my-live-project.com", // Để trống nếu không có demo
    githubUrl: "https://github.com/yourusername/repo-name",
    featured: true, // true để hiển thị huy hiệu nổi bật
  },
];
```

---

## 4. Viết Bài Blog Mới (MDX)

Để thêm một bài viết mới:
1. Tạo một file `.mdx` mới trong thư mục **`content/blog/`**, ví dụ: `content/blog/huong-dan-nextjs-14.mdx`.
2. Định dạng nội dung bài viết với phần Header Frontmatter:

```markdown
---
title: "Hướng Dẫn Xây Dựng Ứng Dụng Với Next.js 14"
excerpt: "Tìm hiểu toàn diện về App Router, Server Components và Server Actions trong Next.js 14."
date: "2025-01-15"
category: "Tutorial"
tags: ["next.js", "react", "typescript", "fullstack"]
readTime: "7 min read"
---

# Hướng Dẫn Xây Dựng Ứng Dụng Với Next.js 14

Nội dung bài viết bắt đầu từ đây...

## Cài đặt dự án

\`\`\`bash
npx create-next-app@latest my-app
\`\`\`

Bạn có thể viết bất kỳ cú pháp Markdown tiêu chuẩn nào kèm theo các khối code có highlight tự động!
```

Hệ thống sẽ tự động quét file, sinh static route tại `/blog/huong-dan-nextjs-14` và đưa vào danh mục tương ứng.

---

## 5. Tùy Chỉnh Màu Sắc & Theme (Tailwind CSS v4)

Dự án sử dụng Tailwind CSS v4 với cấu hình inline trong **`src/app/globals.css`**.

Để thay đổi bảng màu chủ đạo (mặc định là Tím & Lục lam / Cyan):

```css
:root {
  --background: #050505; /* Màu nền chính */
  --foreground: #fafafa; /* Màu chữ chính */
  --purple-500: #8b5cf6; /* Màu nhấn 1 (Accent 1) */
  --cyan-500: #06b6d4;   /* Màu nhấn 2 (Accent 2) */
}
```

Các utility class gradient sẽ tự động thừa hưởng màu sắc mới của bạn:
- `.gradient-text`: Text gradient giữa `--purple-500` và `--cyan-500`.
- `.glow-purple` & `.glow-cyan`: Đổ bóng phát sáng neon.

---

## 6. Tùy Biến Trang Kỷ Niệm Tình Yêu (Couple Page)

Trang `/couple` có cấu hình độc lập tại đầu file **`src/app/couple/page.tsx`** trong đối tượng `COUPLE_CONFIG`:

```typescript
const COUPLE_CONFIG = {
  // Tên hai người
  person1: "Tên Bạn",
  person2: "Tên Người Thương",

  // Mốc thời gian bắt đầu yêu nhau (YYYY-MM-DD HH:mm:ss)
  anniversary: "2024-05-30 20:00:00",

  // Ngày sinh nhật & Cung hoàng đạo
  birthdays: [
    { name: "Anh", date: "2000-01-18", emoji: "🎂", zodiac: "♑ Ma Kết" },
    { name: "Em", date: "2001-07-28", emoji: "🎀", zodiac: "♌ Sư Tử" },
  ],

  // Các mốc kỷ niệm đặc biệt
  specialDates: [
    { name: "Ngày gặp nhau", date: "2023-11-15", emoji: "✨" },
    { name: "Chính thức yêu nhau", date: "2024-05-30", emoji: "💕" },
    { name: "Kỷ niệm 1 năm", date: "2025-05-30", emoji: "🎉" },
  ],

  // Danh sách việc cùng làm (Bucket List)
  bucketList: [
    { text: "Cùng đi du lịch Đà Lạt", emoji: "🏔️", done: true },
    { text: "Xem hoàng hôn trên biển", emoji: "🌅", done: true },
    { text: "Đi du lịch nước ngoài", emoji: "✈️", done: false },
  ],

  // Bức thư tình yêu bí mật
  loveLetters: [
    {
      from: "Anh",
      title: "Gửi em yêu thương",
      content: "Nội dung bức thư...",
    },
  ],
};
```

---

## 7. Tùy Biến Game Contra

Bạn có thể điều chỉnh thông số game trong **`src/components/game/ContraGame.tsx`**:

- **Máu & Mạng người chơi**: Tìm kiếm biến khởi tạo `Player` (`hp: 100`, `lives: 3`).
- **Sức mạnh vũ khí**: Tìm bảng cấu hình `WEAPONS` để điều chỉnh tốc độ đạn (`speed`), thời gian hồi chiêu (`cooldown`), số tia đạn (`spreadCount`).
- **Thiết kế Level**: Mảng `LEVELS` chứa danh sách các `Platform`, vị trí xuất hiện quái vật (`enemies`) và boss (`bossAt`).

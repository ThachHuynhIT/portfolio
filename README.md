# 🚀 Modern 3D Developer Portfolio & Multi-Experience Platform

**English** | [Tiếng Việt](README.vi.md)

A personal portfolio platform that combines interactive 3D graphics, a fast MDX blog, an art photography library with albums, a global music player, a full admin CMS and bilingual support (EN / VI).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **React Three Fiber (Three.js)**, **Framer Motion**, and a performance-first architecture with **lazy & skeleton loading**.

---

## ✨ Key Features

### 1. 🌟 Interactive 3D Portfolio (`/`)
- **3D black hole hero**: the hero background is a raymarched black hole (self-managed WebGL, `src/components/3d/blackhole/`); the camera follows page scroll without triggering React re-renders.
- **Glassmorphic design system**: a modern dark UI with backdrop blur, glowing neon borders and high contrast.
- **Clean tech stack showcase**: the Skills section shows compact technology chips grouped by category (Frontend, Backend, DevOps, Design), with no subjective percentage bars.
- **3D tilt project cards**: project cards tilt in 3D, carry technology tags and link straight to the live demo and GitHub repository.
- **Lazy loading & dynamic splitting**: below-the-fold sections load dynamically (`next/dynamic`) behind shimmering skeletons for a fast first paint.
- **Contact form**: validated with `react-hook-form` + `zod` and sent to `/api/contact` (rate-limited, stored in Postgres, email notification via Resend).

### 2. 📸 Art Photography Library & Albums (`/photography` & `/photography/album/[slug]`)
- **Curated collections**: works are grouped into themed albums with an automatic or hand-picked cover, and bilingual titles and descriptions.
- **4 layout modes**:
  - **Masonry**: a staggered layout that follows each photo's natural height.
  - **Grid**: an even, uniform grid.
  - **Compare**: an interactive before/after slider comparing the original and the retouched photo.
  - **Story**: a magazine-style photo essay.
- **Detailed lightbox**: view high-resolution photos and videos with full EXIF data (aperture, shutter speed, ISO, focal length, lens).
- **Featured first**: works and albums marked `featured` always appear at the top.

### 3. 🎵 Music Player & Listening Room (`/music`)
- **Dedicated listening room**: a spinning vinyl record, an audio visualizer and a curated track list.
- **Global floating music player**: a mini player pinned to the bottom of the screen keeps playing while you navigate between pages.

### 4. 🌐 Full Multilingual Support (EN / VI)
- A language switcher between **Tiếng Việt 🇻🇳** and **English 🇬🇧** with crisp flag icons.
- Applied everywhere: home page, projects, skills, blog, photography & albums, and the whole admin panel.

### 5. 🛡️ Full Admin CMS (`/admin`)
- A modern admin interface behind a secure login:
  - **Projects**: add, edit and delete projects, demo and GitHub links, featured flag.
  - **MDX blog posts**: write, publish and edit posts.
  - **Photography & albums**: upload photos, group them into albums, pick covers, set EXIF metadata and bilingual fields.
  - **Skills**: manage icons, technology categories and publish state.
  - **Music**: manage the track list, audio links and artists.
  - **Media**: Cloudinary library (metadata stored in Postgres), with re-sync from Cloudinary.
  - **Site config & navigation**: personal info, home page section content, navigation menu and social links.
- All content is stored in **PostgreSQL (Prisma)**; `/admin` is protected by an HMAC-signed session cookie (`AUTH_SECRET`).

### 6. ⚡ Performance, Lazy & Skeleton Loading
- **Skeleton shimmer UI**: GPU-accelerated shimmering placeholders for images, project cards, posts and whole sections.
- **`ImageWithSkeleton`**: smooth image loading with an `opacity: 0 -> 1` fade (`500ms ease-out`), no layout shift, and built-in lazy loading.
- **Instant route transitions (`loading.tsx`)**: App Router loading states for `/photography`, `/projects` and `/blog`.

### 7. 📝 Server-Compiled MDX Blog (`/blog` & `/blog/[slug]`)
- **Server-side MDX parsing**: `.mdx` files are loaded and compiled with `gray-matter` and `next-mdx-remote/rsc`.
- **Syntax highlighting & deep linking**: code is highlighted with `rehype-highlight` and headings get IDs from `rehype-slug`.
- **Instant category filter**: posts are grouped by topic (React, Three.js, Animation, …).

### 8. 🛠️ JSON Parameter Validator (`/tools/json-validator`)
- **Batch processing & suffix matching**: automatically pairs `tb_def_exception_parameter_*.json` with `tb_def_parameter_*.json` files.
- **Data integrity check**: finds and lists missing `tb_def_parameter__id` values and exports a detailed JSON report.

> The games (Contra and the online multiplayer games) have moved to the separate `portfolio_with_cms` repo.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core framework** | [Next.js 14 (App Router)](https://nextjs.org/) | Production React framework with SSR, SSG, RSC and Route Handlers |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type checking for reliable code |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern styling with `@theme inline`, CSS variables and custom animations |
| **3D graphics** | [Three.js](https://threejs.org/) / [React Three Fiber](https://r3f.docs.pmnd.rs/) / [Drei](https://github.com/pmndrs/drei) | WebGL 3D space scenes and dynamic star fields |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Motion orchestration, scroll triggers, modals and tab transitions |
| **Performance** | Next.js dynamic imports, skeleton loading, image optimization | Faster loads, no layout shift, snappier responses |
| **Audio engine** | Web Audio API / HTML5 Audio | Global background music and audio visualizer |
| **MDX engine** | [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote), [gray-matter](https://github.com/jonschlinkert/gray-matter) | Reading and rendering technical posts from extended Markdown |
| **Forms & validation** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) | Form state and data validation |
| **Database** | PostgreSQL + [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) | All CMS content, blog, music and contact messages |
| **Media hosting** | Cloudinary | Image, video and audio storage and delivery |
| **Email** | [Resend](https://resend.com/) | Notifications for new contact messages |

---

## 📁 Source Tree

```
portfolio/
├── content/
│   ├── blog/                  # Legacy .mdx posts (source for the migrate script)
│   └── data/                  # Legacy JSON (source for the migrate script — real data lives in Postgres)
├── docs/                      # Detailed technical docs
├── prisma/schema.prisma       # Postgres schema (client generated into src/generated/prisma)
├── public/                    # Static assets (fonts, SVG icons, …)
├── scripts/                   # migrate-json-to-db.ts
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Admin CMS (Projects, Photography, Music, Skills, …)
│   │   ├── api/               # Backend API route handlers
│   │   ├── blog/              # Blog list & post pages (MDX)
│   │   ├── music/             # Listening room
│   │   ├── photography/       # Photo library & album pages
│   │   ├── projects/          # Projects list
│   │   ├── tools/             # Developer tools (JSON validator)
│   │   ├── globals.css        # Tailwind v4 config & shimmer animations
│   │   ├── layout.tsx         # Root layout (Nav, Footer, MusicPlayer, Providers)
│   │   └── page.tsx           # Portfolio home page (dynamic sections)
│   ├── components/
│   │   ├── 3d/                # Three.js / React Three Fiber scenes
│   │   ├── admin/             # Admin CMS UI components
│   │   ├── blog/              # Blog UI components
│   │   ├── layout/            # Layout components (GlobalBackground)
│   │   ├── music/             # Music player & audio visualizer
│   │   ├── photography/       # Layouts (Masonry, Grid, Compare, Story) & album views
│   │   ├── projects/          # Projects UI components
│   │   ├── sections/          # Portfolio sections (Hero, About, Skills, Projects, …)
│   │   └── ui/                # Reusable UI primitives (Button, Skeleton, ImageWithSkeleton, …)
│   ├── context/               # React contexts (Language, Music, Theme, Toast)
│   ├── locales/               # Translation dictionaries (vi.ts, en.ts)
│   ├── middleware.ts          # Protects /admin
│   └── lib/                   # db.ts (Prisma), content/* (data access), utils
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` (Next.js) and `.env` (Prisma CLI / scripts) and fill in real values. The full commented list is in [`.env.example`](.env.example):

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Postgres (Neon, …) — required, every page reads from the DB |
| `AUTH_SECRET`, `ADMIN_PASSWORD` | Session cookie signing & `/admin` login password |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media upload & management |
| `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL` | Email for new contact messages |

`npm install` runs `prisma generate` automatically (postinstall). If the DB is empty, seed sample data from `content/` with `npx tsx scripts/migrate-json-to-db.ts`.

### 3. Development mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Lint & type check

```bash
npm run lint            # eslint .
npx tsc --noEmit -p .   # type check
```

### 5. Production build

```bash
npm run build
npm run start
```

---

## 📖 Documentation

For a deeper look at each part of the project, see the docs in `docs/` (written in Vietnamese):

- 🏛️ [**Architecture**](docs/ARCHITECTURE.md): WebGL pipeline, MDX rendering and error boundaries in detail.
- 🚀 [**Features Spec**](docs/FEATURES.md): detailed catalogue of components and interactions.
- 🎨 [**Customization Guide**](docs/CUSTOMIZATION_GUIDE.md): editing personal info, updating skills, adding projects and writing posts.
- 🚢 [**Deployment Guide**](docs/DEPLOYMENT.md): deploying to Vercel, a VPS or a Docker container, plus SEO.

---

## 📄 License

This project is distributed under an open-source license. See [LICENSE](LICENSE) for details.

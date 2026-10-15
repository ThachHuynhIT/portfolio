# CLAUDE.md

This file provides guidance to Claude Code and other AI coding assistants when working with code in this repository.

---

## 🔧 Language & Tech Stack

- **Primary Language**: TypeScript (TS) with strict mode enabled (`tsconfig.json`)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4 (inlined in `globals.css` with `@theme inline`)
- **3D Graphics**: React Three Fiber (`@react-three/fiber`), `drei`, `three`
- **Animation**: Framer Motion
- **Data**: PostgreSQL via Prisma 7 (`prisma/schema.prisma`, driver adapter `@prisma/adapter-pg`, client generated to `src/generated/prisma` on `postinstall`)
- **Media / Mail**: Cloudinary (`src/lib/cloudinary.ts`, `src/lib/media-service.ts`), Resend (contact notifications)
- **Blog Engine**: MDX stored in Postgres, rendered with `next-mdx-remote/rsc`, `rehype-slug`, `rehype-highlight`
- **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`

---

## 🚀 Key Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build & compile static MDX routes
npm run start    # Run the production build locally
npm test         # Vitest unit tests (vitest run)
npm run lint     # eslint . (flat config via FlatCompat, extends next/core-web-vitals + next/typescript; ignores src/generated)
npx tsc --noEmit -p .   # Type check
```

> **Note on Testing & Types**: Unit tests use Vitest (`npm test` = `vitest run`, config in `vitest.config.mts`); tests live next to the code as `src/lib/*.test.ts`. Type checking: `npx tsc --noEmit -p .` (or `npm run build`). Env vars: see `.env.example`.

---

## 📚 Project Documentation Index

Detailed documentation (Vietnamese) lives in [`docs/`](docs/):
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/FEATURES.md`](docs/FEATURES.md), [`docs/CUSTOMIZATION_GUIDE.md`](docs/CUSTOMIZATION_GUIDE.md), [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## 🏛️ Architecture & Routing

Path alias `@/*` maps to `./src/*`.

### Route Structure (`src/app`)
- **`/` (`page.tsx`)**: One-page portfolio composing sections in order: `HeroSection` ➔ `AboutSection` ➔ `SkillsSection` ➔ `ProjectsSection` ➔ `PhotoPreviewSection` ➔ `BlogPreviewSection` ➔ `ContactSection` (data fetched server-side from `src/lib/content/*` and `src/lib/blog.ts`).
- **`/blog` & `/blog/[slug]`**: MDX blog. Posts are rows of `CmsBlogPost` in Postgres, read via `src/lib/blog.ts` and rendered with `next-mdx-remote/rsc` (EN + optional VI body). `content/blog/*.mdx` is only the legacy source for `scripts/migrate-json-to-db.ts`.
- **`/projects`, `/photography` (+ `/photography/album/[slug]`), `/music`**: full project gallery, photo gallery/albums (Masonry/Grid/Compare/Story + lightbox), music lounge (`Track`/`Playlist` models). `GlobalMusicPlayer` is mounted in the root layout.
- **`/admin/**` + `/api/admin/**`**: CMS for all content. `src/middleware.ts` guards `/admin` pages (signed `admin_session` cookie, `AUTH_SECRET`); API routes call `requireAdminSession()` from `src/lib/admin-auth.ts`. `/api/music/tracks*` and `/api/music/upload` check the session for writes (POST/PATCH/DELETE, upload); the public GETs stay open (`GET /api/music/tracks/[id]` also bumps the play count).
- **`/tools/json-validator` (`page.tsx`)**: Utility for batch-validating parameter matching across `tb_def_exception_parameter_*.json` and `tb_def_parameter_*.json` files.
- **`/couple` (`page.tsx`)**: Isolated anniversary countdown and romantic memory page with its own layout and CSS module (`couple.module.css`). Content comes from `/api/couple` (Postgres `CmsCouple*`, edited at `/admin/couple`); `DEFAULT_COUPLE_DATA` in the page is only the fallback.

---

## 🧩 Subsystems & Engineering Conventions

### 1. 3D WebGL Pipeline (`src/components/3d`)
- All Three.js / R3F components **must** be marked with `"use client"`.
- **`SceneContainer.tsx`** is the mandatory wrapper:
  - Configures the R3F `<Canvas>`.
  - Automatically respects `prefers-reduced-motion` (falls back to a static CSS gradient instead of mounting WebGL).
  - Wraps children in a class-based `SceneErrorBoundary` to gracefully degrade if WebGL crashes.
  - **Never create independent R3F `<Canvas>` roots**; always pass scenes as children into `SceneContainer` (used by `StarryBackground3D` and the Contact `ParticleField`).
- **Exception**: the Hero (and 404 page) background is `blackhole/BlackHoleCanvas.tsx`, a raymarched black hole with its own imperative `THREE.WebGLRenderer` + loop — not R3F, so it does not go through `SceneContainer`.
- **Performance Rule**: Use mutable `useRef` for high-frequency values (pointer, scroll) and read them inside `useFrame`/the render loop instead of React state, to avoid re-rendering the DOM at 60 FPS.

### 2. UI Components & Animations (`src/components/ui`, `src/lib/animations.ts`)
- Generic building blocks (`Button`, `GlassCard`, `TiltCard`, `AnimatedSection`, `Navigation`, `Footer`, `Skeleton*`, `ImageWithSkeleton`, `Icon`, …) are re-exported via `src/components/ui/index.ts`.
- Use `AnimatedSection` with variants from `src/lib/animations.ts` (`fadeInUp`, `fadeInLeft`, `blurFadeIn`, `staggerContainer`) rather than inline Framer Motion configurations.
- Use `cn()` helper (`src/lib/utils.ts`) combining `clsx` + `tailwind-merge` for dynamic classes.

### 3. Data Management
- All site content (site config, nav/social links, skills, projects, photos/albums, couple page, media registry, blog, contact messages) lives in Postgres (`Cms*` models) and is read/written only through `src/lib/content/*.ts` and `src/lib/blog.ts` (public reads in `src/lib/content/*` are wrapped in `unstable_cache`; admin API routes call `revalidateTag` after writes). Music uses the `Track`/`Playlist` models directly. `src/lib/db.ts` is the Prisma singleton.
- Edit content through `/admin`, not inline in components. Homepage section copy defaults come from `src/locales/{en,vi}.ts`; admin overrides are stored in `SiteConfig.sectionsContent` and resolved by `src/lib/content-overrides.ts`.
- `content/data/*.json` and `content/blog/*.mdx` are legacy seed data, only read by `scripts/migrate-json-to-db.ts` (`npx tsx scripts/migrate-json-to-db.ts`).
- `src/lib/constants.ts` only holds `EXCLUDED_ROUTE_PREFIXES` and `isExcludedRoute()`. Domain types are in `src/lib/types.ts`.

### 4. Styling Conventions
- Tailwind v4 is configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css` (no `tailwind.config.js`).
- Design tokens: `--background: #050505`, `--foreground: #fafafa`, `--purple-500: #8b5cf6`, `--cyan-500: #06b6d4`. These tokens flip automatically per theme (see below), so `bg-background`/`text-foreground` need no extra work.
- Reusable utility classes: `.gradient-text`, `.glass`, `.glow-purple`, `.glow-cyan`, `.animate-float`, `.animate-pulse-glow`, `.animate-gradient`.

### 5. Light/Dark Theme Toggle
- **Dark is the default/original look.** `globals.css` declares `@custom-variant light (&:where([data-theme="light"], [data-theme="light"] *));` — any Tailwind class prefixed `light:` (e.g. `light:text-neutral-900`) applies **only** when an ancestor (or the element itself) has `data-theme="light"`. When styling a component, **add** `light:` classes alongside the existing unprefixed ones; never remove/replace the dark classes.
- `data-theme` is set on `<html>` at runtime by `ThemeProvider` (`src/context/ThemeContext.tsx`), driven by `useTheme()`/`ThemeToggle` (`src/components/ui/ThemeToggle.tsx`, rendered in `Navigation.tsx`). Preference is persisted to `localStorage["portfolio_theme"]` and falls back to `prefers-color-scheme`. An inline blocking script in `src/app/layout.tsx` (`THEME_INIT_SCRIPT`) sets `data-theme` before hydration to avoid a flash of the wrong theme — **keep it in sync** with `detectPreferredTheme()` in `ThemeContext.tsx`; the excluded-route list is injected from `EXCLUDED_ROUTE_PREFIXES` and matched like `isExcludedRoute()` (prefix itself or `prefix/…`).
- **Excluded routes stay dark-only**: `EXCLUDED_ROUTE_PREFIXES` in `src/lib/constants.ts` (`/admin`, `/couple`, `/music`) are forced to `resolvedTheme = "dark"` regardless of user preference — do not add `light:` classes inside those subtrees.
- **The photography lightbox (`PhotoLightboxModal.tsx`) is an intentional additional exception** — it stays dark-only ("theater mode" for viewing photos) even outside excluded routes. Don't add `light:` classes to it.
- When converting a component: use `light:text-neutral-900/800/600/500` for `text-white` at decreasing opacity, `light:bg-neutral-900/[0.0N]` for `bg-white/N` surfaces, `light:border-neutral-900/10-15` for `border-white/N`, and `light:bg-white/70-90` for `bg-black/N` used as page/card chrome. Do **not** add a `light:` variant to a `bg-black/N` (or similar) overlay that sits on top of a photo/thumbnail for caption legibility — that overlay is correct in both themes.

### 6. Form Handling
- Forms must use `react-hook-form` + `@hookform/resolvers` + `zod` schemas for validation (as demonstrated in `ContactSection.tsx`).

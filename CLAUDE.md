# CLAUDE.md

This file provides guidance to Claude Code and other AI coding assistants when working with code in this repository.

---

## 🔧 Language & Tech Stack

- **Primary Language**: TypeScript (TS) with strict mode enabled (`tsconfig.json`)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4 (inlined in `globals.css` with `@theme inline`)
- **3D Graphics**: React Three Fiber (`@react-three/fiber`), `drei`, `three`
- **Animation**: Framer Motion
- **Blog Engine**: MDX (`content/blog/`), `next-mdx-remote/rsc`, `gray-matter`, `rehype-slug`, `rehype-highlight`
- **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`

---

## 🚀 Key Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build & compile static MDX routes
npm run start    # Run the production build locally
npm run lint     # ESLint (flat config via FlatCompat, extends next/core-web-vitals + next/typescript)
```

> **Note on Testing & Types**: There is no standalone unit test runner configured. Type checking and syntax validation happen via `npm run lint` and `npm run build`.

---

## 📚 Project Documentation Index

Detailed documentation files are available in the [`docs/`](file:///d:/WorkSpace/portfolio/docs/) directory:
- [Architecture Documentation](file:///d:/WorkSpace/portfolio/docs/ARCHITECTURE.md) (`docs/ARCHITECTURE.md`)
- [Features Specification](file:///d:/WorkSpace/portfolio/docs/FEATURES.md) (`docs/FEATURES.md`)
- [Customization Guide](file:///d:/WorkSpace/portfolio/docs/CUSTOMIZATION_GUIDE.md) (`docs/CUSTOMIZATION_GUIDE.md`)
- [Deployment Guide](file:///d:/WorkSpace/portfolio/docs/DEPLOYMENT.md) (`docs/DEPLOYMENT.md`)

---

## 🏛️ Architecture & Routing

Path alias `@/*` maps to `./src/*`.

### Route Structure (`src/app`)
- **`/` (`page.tsx`)**: One-page portfolio composing sections in order: `HeroSection` ➔ `AboutSection` ➔ `SkillsSection` ➔ `ProjectsSection` ➔ `ContactSection`.
- **`/blog` & `/blog/[slug]`**: Server-side MDX blog engine. Content lives as `.mdx` files in `content/blog/` (outside `src/`). Files are read at build/request time via server-only functions in `src/lib/blog.ts` using Node `fs`.
- **`/contra` (`page.tsx`)**: Fullscreen 2D Contra arcade canvas game (`src/components/game/ContraGame.tsx`, ~1800 lines). Loaded dynamically with `{ ssr: false }` and `mounted` state protection to prevent hydration mismatches.
- **`/tools/json-validator` (`page.tsx`)**: Utility for batch-validating parameter matching across `tb_def_exception_parameter_*.json` and `tb_def_parameter_*.json` files.
- **`/couple` (`page.tsx`)**: Isolated anniversary countdown and romantic memory page with its own CSS module (`couple.module.css`). Keep its config (`COUPLE_CONFIG`) isolated within the page component.

---

## 🧩 Subsystems & Engineering Conventions

### 1. 3D WebGL Pipeline (`src/components/3d`)
- All Three.js / R3F components **must** be marked with `"use client"`.
- **`SceneContainer.tsx`** is the mandatory wrapper:
  - Configures the R3F `<Canvas>`.
  - Automatically respects `prefers-reduced-motion` (falls back to a static CSS gradient instead of mounting WebGL).
  - Wraps children in a class-based `SceneErrorBoundary` to gracefully degrade if WebGL crashes.
  - **Never create independent `<Canvas>` roots**; always pass scenes as children into `SceneContainer`.
- **Performance Rule**: Use mutable `useRef` for high-frequency updates (e.g. `mousePositionRef` in `HeroSection`) and read it inside `useFrame` to avoid re-rendering the React DOM at 60 FPS.

### 2. UI Components & Animations (`src/components/ui`, `src/lib/animations.ts`)
- Generic building blocks (`Button`, `GlassCard`, `TiltCard`, `AnimatedSection`, `Navigation`, `Footer`) are re-exported via `src/components/ui/index.ts`.
- Use `AnimatedSection` with variants from `src/lib/animations.ts` (`fadeInUp`, `fadeInLeft`, `blurFadeIn`, `staggerContainer`) rather than inline Framer Motion configurations.
- Use `cn()` helper (`src/lib/utils.ts`) combining `clsx` + `tailwind-merge` for dynamic classes.

### 3. Data Management & Single Source of Truth
- **`src/lib/constants.ts`** is the single source of truth for site content: `navLinks`, `socialLinks`, `skills`, `projects`, and `siteConfig`.
- Edit portfolio data in `constants.ts`, not inline in section components.
- Domain types are defined in `src/lib/types.ts`.

### 4. Styling Conventions
- Tailwind v4 is configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css` (no `tailwind.config.js`).
- Design tokens: `--background: #050505`, `--foreground: #fafafa`, `--purple-500: #8b5cf6`, `--cyan-500: #06b6d4`.
- Reusable utility classes: `.gradient-text`, `.glass`, `.glow-purple`, `.glow-cyan`, `.animate-float`, `.animate-pulse-glow`, `.animate-gradient`.

### 5. Form Handling
- Forms must use `react-hook-form` + `@hookform/resolvers` + `zod` schemas for validation (as demonstrated in `ContactSection.tsx`).

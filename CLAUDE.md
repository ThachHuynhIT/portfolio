# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Next.js App Router, http://localhost:3000)
npm run build    # production build
npm run start    # run the production build
npm run lint     # ESLint (flat config via FlatCompat, extends next/core-web-vitals + next/typescript)
```

There is no test suite/runner configured in this repo. Type checking happens via `next build` / the editor's TS server (no standalone `tsc` script).

## Architecture

This is a Next.js 14 App Router personal portfolio site (`src/app`) styled with Tailwind CSS v4, animated with Framer Motion, and using React Three Fiber / drei / three for 3D scenes. Path alias `@/*` maps to `src/*`.

### Route structure (`src/app`)
- `/` (`page.tsx`) — composes the one-page portfolio out of section components in order: Hero, About, Skills, Projects, Contact.
- `/blog` and `/blog/[slug]` — MDX-backed blog. Content lives as `.mdx` files in `content/blog/` (not under `src/`), read at request/build time via `src/lib/blog.ts` (uses Node `fs`, so these are server-only functions). Frontmatter is parsed with `gray-matter`; each post has `title`, `excerpt`, `date`, `category`, `tags`, `readTime`. Post bodies are rendered with `next-mdx-remote/rsc`'s `MDXRemote` using custom `mdxComponents` and `rehype-slug`/`rehype-highlight` plugins (see `src/app/blog/[slug]/page.tsx`).
- `/contra` — a self-contained Canvas-based Contra-style game (`src/components/game/ContraGame.tsx`, ~1800 lines: single component owning game loop, physics, levels, enemies, particles). Loaded via `next/dynamic` with `ssr: false` since it depends on the DOM canvas and `window`; the page also gates rendering on a `mounted` state to avoid hydration mismatches.
- `/tools/json-validator` — standalone utility page/component (`src/components/tools/JsonValidator.tsx`), unrelated to the portfolio sections.
- `/couple` — a separate, unrelated personal page (Vietnamese-language anniversary/countdown page) with its own layout and CSS module (`couple.module.css`). Treat it as isolated from the portfolio design system; don't refactor its config object (`COUPLE_CONFIG`) into shared types/constants.

### 3D scenes (`src/components/3d`)
All Three.js/R3F code is client-only (`"use client"`). `SceneContainer` is the standard wrapper: it creates the `<Canvas>`, respects `prefers-reduced-motion` (falls back to a static gradient div instead of mounting WebGL), and wraps children in a class-based `SceneErrorBoundary` so a WebGL/driver failure degrades to the static fallback instead of crashing the page. New 3D scenes should be built as children passed into `SceneContainer`, not as their own `<Canvas>` roots. Scene components (`Hero3DScene`, `ParticleField`, `FloatingTechStack`) are plain R3F component trees using `useFrame` for animation and are re-exported from `src/components/3d/index.ts`.

### Shared UI, sections, lib
- `src/components/ui` — generic building blocks (`Button`, `GlassCard`, `TiltCard`, `AnimatedSection`, `Navigation`, `Footer`), re-exported via `index.ts`. `AnimatedSection` + the variants in `src/lib/animations.ts` (`fadeInUp`, `fadeInLeft`, `blurFadeIn`, `staggerContainer`, etc.) are the standard way scroll-in animations are composed across sections — prefer reusing these variants over hand-rolling new Framer Motion transitions.
- `src/components/sections` — the one-page portfolio sections (Hero/About/Skills/Projects/Contact), re-exported via `index.ts`.
- `src/lib/constants.ts` — single source of truth for site content: `navLinks`, `socialLinks`, `skills`, `projects`, `siteConfig`. Editing portfolio copy/links/projects should happen here, not inline in components.
- `src/lib/types.ts` — shared domain types (`Project`, `BlogPost`, `Skill`, `ContactFormData`, `NavLink`, `SocialLink`) used by both `constants.ts` and the components that consume them.
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge) for conditional class merging; use it instead of manual string concatenation for Tailwind classes.

### Styling
Tailwind v4 is configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css` (no `tailwind.config.js`). Design tokens live there as CSS variables (`--background: #050505`, `--foreground`, `--purple-500: #8b5cf6`, `--cyan-500: #06b6d4`), and the file also defines global utility classes used throughout the app: `.gradient-text`, `.glass`, `.glow-purple`/`.glow-cyan`, `.animate-float`/`.animate-pulse-glow`/`.animate-gradient`. Reuse these rather than redefining equivalent styles per-component. The site is dark-themed by default (`bg-black text-white` on `<body>` in `src/app/layout.tsx`).

### Forms
Contact form (`ContactSection`) uses `react-hook-form` with `@hookform/resolvers` and `zod` schemas for validation — follow this pattern for any new form rather than uncontrolled inputs.

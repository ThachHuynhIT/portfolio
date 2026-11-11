# CLAUDE.md

This file provides guidance to Claude Code and other AI coding assistants when working with code in this repository.

---

## 🔧 Language & Tech Stack

- **Primary Language**: TypeScript (TS) with strict mode enabled (`tsconfig.json`)
- **Framework**: Next.js 15 (App Router, React 19)
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
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/FEATURES.md`](docs/FEATURES.md), [`docs/CUSTOMIZATION_GUIDE.md`](docs/CUSTOMIZATION_GUIDE.md), [`docs/DESIGN_TOKENS.md`](docs/DESIGN_TOKENS.md), [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## 🏛️ Architecture & Routing

Path alias `@/*` maps to `./src/*`.

### Route Structure (`src/app`)
- **`/` (`page.tsx`)**: One-page portfolio composing sections in order: `HeroSection` ➔ `AboutSection` ➔ `SkillsSection` ➔ `ProjectsSection` ➔ `PhotoPreviewSection` ➔ `BlogPreviewSection` ➔ `ContactSection` (data fetched server-side from `src/lib/content/*` and `src/lib/blog.ts`). `HomeBlackHole` is a fixed page-level black hole behind all sections, so sections must not paint opaque full-width Void bands; dense content sits on solid Hull surfaces (`.portfolio-solid`). `BlogPreviewSection` returns `null` with no posts, and `layout.tsx` drops `/blog` nav/footer links via `filterBlogNavLinks()` (`src/lib/navigation-section.ts`).
- **`/blog` & `/blog/[slug]`**: MDX blog. Posts are rows of `CmsBlogPost` in Postgres, read via `src/lib/blog.ts` and rendered with `next-mdx-remote/rsc` (EN + optional VI body). Bodies must pass `src/lib/mdx-policy.ts` (no ESM, `{expressions}`, JSX or raw HTML; checked on admin write and before render). Public reads (`getPostSummaries`, `getPostBySlug`) are `unstable_cache`d with tag `blog`; list views get `BlogPostListItem` (no MDX bodies). `content/blog/*.mdx` is only the legacy source for `scripts/migrate-json-to-db.ts`.
- **`/projects`, `/photography` (+ `/photography/album/[slug]`), `/music`**: full project gallery, photo gallery/albums (Masonry/Grid/Compare/Story + lightbox), music lounge (`Track`/`Playlist` models). `GlobalMusicPlayer` is mounted in the root layout.
- **`/admin/**` + `/api/admin/**`**: CMS for all content. `src/middleware.ts` guards `/admin` pages (signed `admin_session` cookie, `AUTH_SECRET`); API routes call `requireAdminSession()` from `src/lib/admin-auth.ts`. `/api/music/tracks*` and `/api/music/upload` check the session for writes (POST/PATCH/DELETE, upload); the public GETs stay open and are read-only (`GET /api/music/tracks/[id]` returns published tracks only); plays are recorded with `POST /api/music/tracks/[id]/play` (same-origin, rate-limited). Uploads go through `src/lib/upload-validation.ts` (size caps, MIME+extension allowlist, magic-byte check).
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
  - **Never create independent R3F `<Canvas>` roots**; always pass scenes as children into `SceneContainer`. No page currently mounts an R3F scene: the old `StarryBackground3D` site background was replaced by the static CSS starfield (`.portfolio-stars`) rendered by `GlobalBackground` on every public page except `/` (the homepage has `HomeBlackHole`), `/admin` and `/couple`; `/music` gets it pinned dark via `data-portfolio-dark`. `ParticleField` was removed; the Contact background is CSS shooting stars (`.portfolio-contact-stars`).
- **Exception**: the homepage fixed page-level layer (and 404 page background) uses `blackhole/BlackHoleCanvas.tsx`, a raymarched black hole with its own imperative `THREE.WebGLRenderer` + loop — not R3F, so it does not go through `SceneContainer`.
- **Performance Rule**: Use mutable `useRef` for high-frequency values (pointer, scroll) and read them inside `useFrame`/the render loop instead of React state, to avoid re-rendering the DOM at 60 FPS.

### 2. UI Components & Animations (`src/components/ui`, `src/lib/animations.ts`)
- Generic building blocks (`Button`, `GlassCard`, `TiltCard`, `AnimatedSection`, `Navigation`, `Footer`, `Skeleton*`, `ImageWithSkeleton`, `Icon`, …) are re-exported via `src/components/ui/index.ts`.
- Non-home public pages use the page shell: `.portfolio-page` → `.portfolio-section` → `.portfolio-column`, with `PageHeader` (`src/components/ui/PageHeader.tsx`, server-compatible; renders `SectionHeading as="h1"` + optional intro/slot) as the page title. `SectionHeading` takes optional `as` (`h1`/`h2`, default `h2`) and `className`. `.portfolio-theme[data-portfolio-dark="true"]` pins the portfolio tokens (and star dots) to their dark values for dark-only scopes (music, the photo lightbox).
- Pages reveal content with a staggered scroll entrance: add `portfolio-reveal` to a block/card and `RevealObserver` (mounted once in `layout.tsx`) fades it in as it enters the viewport, ordering elements that enter together. CSS hides them only under `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, with a 4s failsafe, so content still renders without JS. The homepage sections below the hero use it too (the hero keeps its typing intro). Don't put it on dialogs. Add one variant class for a themed entrance: `portfolio-reveal--sweep` (headings: wipe + light streak), `--lens` (cards/panels: 3D tilt out of blur + accretion border flare), `--iris` (photos: aperture open), `--focus` (paragraphs: blur to sharp), `--trail` (list rows: slide in + shooting-star underline); no class = fade up.
- Pointer feedback is global: `PointerEffects` (mounted once in `layout.tsx`) delegates events. Add `portfolio-fx-card` to a card for a cursor spotlight + up to 5° tilt and lift (`data-fx-no-tilt` = spotlight only, for list rows; the spotlight uses layered backgrounds, not pseudo-elements). Add `portfolio-chip` to filter/tab/toggle buttons (hover lift, active underline via `aria-pressed`/`aria-selected`/`data-active`, press scale); `.portfolio-action`, `.portfolio-chip` and `.portfolio-fx-ripple` get a click ripple. Effects need a fine pointer and are off under reduced motion. The non-home starfield is `InteractiveStarfield` (2D canvas, physics in `src/lib/starfield.ts`): parallax, pointer glow/constellation lines and click ripples; it hides the CSS `.portfolio-stars` layer via `data-starfield="live"` and is not mounted under reduced motion.
- Use `AnimatedSection` with variants from `src/lib/animations.ts` (`fadeInUp`, `fadeInLeft`, `blurFadeIn`, `staggerContainer`, plus the homepage set `orbitIn`, `clipReveal`, `factsStagger`/`factsOrbit`, `constellationDraw`, `shootingStarRow`) rather than inline Framer Motion configurations.
- Homepage motion rule: one entrance moment per section, `viewport={{ once: true }}`, reduced motion renders the final state; transform/opacity (or one-shot clip-path/stroke-dashoffset) only; at most one continuous loop in view besides the black hole. Content must render without JS.
- Use `cn()` helper (`src/lib/utils.ts`) combining `clsx` + `tailwind-merge` for dynamic classes.

### 3. Data Management
- All site content (site config, nav/social links, skills, projects, photos/albums, couple page, media registry, blog, contact messages) lives in Postgres (`Cms*` models) and is read/written only through `src/lib/content/*.ts` and `src/lib/blog.ts` (public reads in `src/lib/content/*` are wrapped in `unstable_cache`; admin API routes call `revalidateTag` after writes). Music uses the `Track`/`Playlist` models directly. `src/lib/db.ts` is the Prisma singleton.
- Edit content through `/admin`, not inline in components. Homepage section copy defaults come from `src/locales/{en,vi}.ts`; admin overrides are stored in `SiteConfig.sectionsContent` and resolved by `src/lib/content-overrides.ts`.
- `content/data/*.json` and `content/blog/*.mdx` are legacy seed data, only read by `scripts/migrate-json-to-db.ts` (`npx tsx scripts/migrate-json-to-db.ts`).
- `src/lib/constants.ts` only holds `EXCLUDED_ROUTE_PREFIXES` and `isExcludedRoute()`. Domain types are in `src/lib/types.ts`.

### 4. Styling Conventions
- Tailwind v4 is configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css` (no `tailwind.config.js`).
- **Public pages use scoped tokens** on `.portfolio-theme` (approved direction: `docs/superpowers/specs/2026-11-06-portfolio-design-direction.md`): `--portfolio-void` `#05070D`, `--portfolio-hull` `#0C1018`, `--portfolio-ink` `#ECE9E4`, `--portfolio-dust` `#9BA1AC`, `--portfolio-accretion` `#F2B45A` (+ `-hover`, `--portfolio-on-accretion`), `--portfolio-hairline`, `--portfolio-control`, with light values under `[data-theme="light"] .portfolio-theme` (Accretion `#9A5B0B` keeps text ≥4.5:1). Use the `*-portfolio-*` utilities (`bg-portfolio-hull`, `text-portfolio-dust`…) — they flip per theme, so no `light:` pair is needed. Font: Be Vietnam Pro (fallback Inter). Layout/state classes: `.portfolio-section`, `.portfolio-column`, `.portfolio-solid`, `.portfolio-case`, `.portfolio-action*`, `.portfolio-text-link`, `.portfolio-input`.
- Legacy tokens (`--background: #050505`, `--foreground: #fafafa`, `--purple-500: #8b5cf6`, `--cyan-500: #06b6d4`) stay for dark-only routes, the lightbox and not-yet-converted pages; they also flip per theme. No raw dark hex in shared public components.
- Legacy utility classes (not on the homepage): `.gradient-text`, `.glass`, `.glow-purple`, `.glow-cyan`, `.animate-float`, `.animate-pulse-glow`, `.animate-gradient`.
- **Shared colors and sizes (admin, legacy and not-yet-converted pages) are tokenized — do not hand-write repeated values.** See `docs/DESIGN_TOKENS.md` for the full inventory.
  - `src/lib/design-tokens.ts` — individual tokens (`surface.card`, `border.subtle`, `text.muted`, `radius.card`, `motion.base`, `zIndex.nav`, `brand.gradient`, ...). Each already bundles its `light:` variant; `*Dark` tokens carry none and are for the excluded routes.
  - `src/lib/ui-presets.ts` — whole recipes composed from those tokens (`presets.card`, `presets.input`, `presets.inputDark`, `presets.badge.success`, ...).
  - `src/app/globals.css` — CSS custom properties for anything styled in plain CSS. The brand scale (`--purple-400/500/600`, `--cyan-400/500/600`) drives the gradients, glows, focus ring, scrollbar and selection; `--code-*` drives the blog syntax theme. These hex values are mirrored by `palette` in `design-tokens.ts` — **change both together**.
  - Rule of thumb: a value used in 3+ components belongs in a token, named by role (`radius.card`) not by value. Compose with `cn()` so appended classes override the token.

### 5. Light/Dark Theme Toggle
- **Dark is the default/original look.** `globals.css` declares `@custom-variant light (&:where([data-theme="light"], [data-theme="light"] *));` — any Tailwind class prefixed `light:` (e.g. `light:text-neutral-900`) applies **only** when an ancestor (or the element itself) has `data-theme="light"`. When styling a component, **add** `light:` classes alongside the existing unprefixed ones; never remove/replace the dark classes.
- `data-theme` is set on `<html>` at runtime by `ThemeProvider` (`src/context/ThemeContext.tsx`), driven by `useTheme()`/`ThemeToggle` (`src/components/ui/ThemeToggle.tsx`, rendered in `Navigation.tsx`). Preference is persisted to `localStorage["portfolio_theme"]` and falls back to `prefers-color-scheme`. An inline blocking script (`THEME_INIT_SCRIPT`, built by `buildThemeInitScript()` in `src/lib/theme-init.ts` and emitted by `src/app/layout.tsx`) sets `data-theme` before hydration to avoid a flash of the wrong theme — **keep it in sync** with `detectPreferredTheme()` in `ThemeContext.tsx`; the excluded-route list is injected from `EXCLUDED_ROUTE_PREFIXES` and matched like `isExcludedRoute()` (prefix itself or `prefix/…`). Its sha256 is pinned in the report-only CSP in `next.config.js`; `src/lib/security-headers.test.ts` fails with the new hash if the script changes.
- **Excluded routes stay dark-only**: `EXCLUDED_ROUTE_PREFIXES` in `src/lib/constants.ts` (`/admin`, `/couple`, `/music`) are forced to `resolvedTheme = "dark"` regardless of user preference — do not add `light:` classes inside those subtrees.
- **The photography lightbox (`PhotoLightboxModal.tsx`) is an intentional additional exception** — it stays dark-only ("theater mode" for viewing photos) even outside excluded routes. Don't add `light:` classes to it.
- When converting a component: use `light:text-neutral-900/800/600/500` for `text-white` at decreasing opacity, `light:bg-neutral-900/[0.0N]` for `bg-white/N` surfaces, `light:border-neutral-900/10-15` for `border-white/N`, and `light:bg-white/70-90` for `bg-black/N` used as page/card chrome. Do **not** add a `light:` variant to a `bg-black/N` (or similar) overlay that sits on top of a photo/thumbnail for caption legibility — that overlay is correct in both themes.

### 6. Form Handling
- Forms must use `react-hook-form` + `@hookform/resolvers` + `zod` schemas for validation (as demonstrated in `src/components/sections/ContactForm.tsx`; shared schema in `src/lib/contact-schema.ts`).

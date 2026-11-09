# Non-home public pages restyle — Implementation Plan

> **For agentic workers:** use `superpowers:executing-plans` to implement task-by-task; use `superpowers:subagent-driven-development` only if the owner chooses delegation. Steps use checkboxes. This document authorizes no implementation during the spec/plan writing step. Codex performs UI work; Claude reviews and runs checks.

**Goal:** Make the non-home public pages visually match the existing homepage while preserving behavior, with the authorized Grid/Masonry keyboard fix.

**Architecture:** Reuse scoped portfolio tokens, extend SectionHeading without changing its default h2 rendering, and add one small PageHeader plus a page CSS shell. Replace GlobalBackground's R3F decoration with static CSS stars; pin music/theater token scopes dark while the global mini player follows its host theme. Restyle existing components in place rather than rewriting their systems.

**Tech Stack:** Existing TypeScript strict, Next App Router, Tailwind CSS v4, Framer Motion, Vitest and existing React/Prisma dependencies. Do not upgrade versions or install packages; historical overhaul version labels are not instructions to downgrade the checkout.

**Spec:** `docs/superpowers/specs/2026-11-09-pages-restyle-design.md`.

**References:** Read all `CLAUDE.md`, `docs/DESIGN_TOKENS.md`, `docs/superpowers/specs/2026-11-06-portfolio-design-direction.md` and the current homepage references named in the spec. Format follows `docs/superpowers/plans/2026-11-06-portfolio-overhaul.md` (constraints, reusable verification gates, phases/tasks, interfaces, checkboxes, review focus and risks).

## Global Constraints

- Work on existing `feature/pages-restyle` from `develop`; do not create another branch/worktree, commit during planning, merge or deploy. Implementer commits per phase after Claude verification/review; owner controls merge.
- About 120 minutes total: Phase 1 25 min, Phase 2 30 min, Phase 3 35 min, Phase 4 30 min, including review/check time. Keep each phase shippable. If checks/environment exceed the budget, report actual remaining work; never silently omit acceptance checks or claim completion.
- Public presentation only, plus native keyboard photo activation. No homepage page/section/HomeBlackHole edits, admin/couple edits, API/content/data changes, MusicContext edits, routing/filter/lyrics/playback/upload logic changes, dependencies, CSP or theme-init changes.
- Keep server components server; only interactive leaves require `"use client"`. Use `cn()` for conditional classes. No new Canvas, duplicated theme provider, broad player refactor or global legacy-token rewrite.
- No `light:` additions in `/admin`, `/couple`, `/music` or PhotoLightboxModal. Portfolio utility colors flip through CSS tokens. Music uses portfolio dark tokens; the lightbox changes accents only. Photo caption overlays remain neutral dark in both themes.
- One entrance moment per section; shared transform/opacity variants, `viewport={{ once: true }}`, reduced-motion final state and SSR-visible content. Existing lightbox motion is untouched. Do not replace existing input/validation logic with a new form system.
- No Vitest tests for CSS/class snapshots. No pure helper is planned. If new pure logic becomes necessary, identify the exact helper/API and add a focused failing Vitest test, implement minimally and rerun; do not expand scope for convenience.

## Verification gates (apply to every task)

**G — Claude runs after the task's changes:**

```bash
npx tsc --noEmit -p .
npm run lint -- --max-warnings=0
npm test
npm run build
```

Expected: every command exit 0, no lint warnings, all existing tests pass, production build completes with required DB/env available. The spec/plan author does not run npm/Node. Coalesce the gate once at the end of each phase when its tasks are reviewed together, to fit the budget; a failed gate is fixed and rerun before that phase's commit. No new code test is expected for presentation-only work.

**U — Claude browser checks on a built app:** every route touched by the task at 375px and 1440px, dark and light, and with reduced motion. Music remains dark under both stored preferences; the lightbox remains dark when opened from a light page. Confirm `document.documentElement.scrollWidth <= window.innerWidth`, no console/hydration errors, Be Vietnam Pro including VI diacritics, text contrast ≥4.5:1, control/focus ≥3:1, Tab focus visible, Enter/Space native activation, and hover/active/disabled states. Check actual content plus empty/no-match/loading/error states where they exist, not invented fallback logic. Use existing content/local browser fixtures without writing CMS data. Disable JS and confirm server-fed titles/content remain visible; playback, uploads and filtering still require JS. Include a homepage and excluded-route regression check when shared files change.

**L — legacy scan:** commands below use `rg` (grep equivalent). No matches means exit 1, which is success for these scans; distinguish it from a file/path error. Also inspect imported recipes and inline CSS: an empty string scan alone does not prove conversion. Never scan all `globals.css` expecting no legacy definitions, because untouched consumers retain them.

Existing tests of special relevance: `src/lib/security-headers.test.ts` and `src/lib/theme-init.test.ts` must stay unchanged and pass (no script/hash edits); `src/lib/home-black-hole.test.ts` and `src/lib/motion-math.test.ts` protect homepage behavior; `src/lib/blog.test.ts`, `src/lib/blog-list.test.ts`, `src/lib/mdx-policy.test.ts` protect reads/MDX; `src/lib/music-routes.test.ts` and `src/lib/music-schema.test.ts` protect music contracts. No existing assertion is intentionally invalidated. If an assertion fails, report its exact name and investigate the regression; do not weaken it to pass a restyle.

## Review Focus

1. Navigation from music to a light public page: mini player is light, tokenized, visible and independent of leaked `music.css` root variables (Task 5 browser scenario).
2. Empty data and absent project images: header/controls remain coherent, full titles wrap, no rocket art is substituted (Tasks 3, 6 browser scenarios).
3. Keyboard photo opening in Grid and Masonry: Enter/Space open the correct item once, focus remains visible without hover, and no nested interactive markup (Task 3 browser scenario).
4. Long bilingual album/blog titles, filenames and code at 375px: page never widens; code and intentional control strips may scroll internally (Tasks 3, 6, 7 browser scenarios).
5. JS disabled/reduced motion and route transitions: titles/content remain visible, no non-home decorative WebGL, no theme flash introduced, 404 does not hide the next page's chrome (Tasks 1, 2, 4, 7 browser scenarios).

---

## Phase 1 — Shared shell, header and loading states (25 minutes)

### Task 1: Static background and safe token scopes

**Files:**
- Modify: `src/components/layout/GlobalBackground.tsx`, `src/app/globals.css`.
- Delete conditionally: `src/components/3d/StarryBackground3D.tsx`.
- Modify documentation: `CLAUDE.md`, `docs/ARCHITECTURE.md`.
- Read-only: `src/app/layout.tsx`, `src/components/sections/HomeBlackHole.tsx`, `src/lib/constants.ts`, `src/components/3d/index.ts`, `src/components/3d/SceneContainer.tsx`.

**Interfaces:** `PortfolioScope({ children }: { children: ReactNode })` and default `GlobalBackground()` exports remain. Produce dark scope marker `.portfolio-theme[data-portfolio-dark="true"]`; no change to `isExcludedRoute()` or its exclusion list.

- [ ] Remove dynamic R3F import, light purple/cyan wash and mount/theme gating from GlobalBackground. Render an SSR-visible, aria-hidden, pointer-events-none fixed Void layer with its own `.portfolio-theme` and `.portfolio-stars` child on non-home public paths; pin music background dark. Return null for `/`, `/admin` and `/couple` (prefix or child boundaries). Preserve PortfolioScope exclusions and existing homepage `data-home` output.
- [ ] Add dark scope overrides after light tokens in globals.css, pinning all current portfolio properties and star dot variables. Keep rules opt-in; do not change existing light preference detection or palette definitions.
- [ ] Search imports/exports: `rg -n 'StarryBackground3D' src --glob '!generated/**'`. Remove the starfield source only if no references remain after import removal, including barrels/dynamic imports. Keep SceneContainer and its export. Do not touch black hole engine files.
- [ ] Update CLAUDE.md's GlobalBackground/SceneContainer/404 notes and ARCHITECTURE.md tree plus §3D discussion (currently lines around 62, 88–94 mention the R3F starfield). State static public CSS stars, homepage-only black hole, retained SceneContainer contract, excluded route boundaries and new scope marker. Do not claim Contact's unrelated background was changed here.
- [ ] Verify G and U: `/`, `/photography`, `/music`, unknown path, `/couple`, `/admin/login`; static dots in both public themes, no R3F background canvas, one homepage black hole as before. Confirm stars sit behind content/footer, not behind an opaque unintended body band; excluded subtree markup/CSS stays unchanged. Couple gets no replacement decoration. Test public→music→public transitions and JS disabled.
- [ ] L: `rg -n 'StarryBackground3D|from-purple|via-cyan|gradient-text|bg-slate-' src/components/layout/GlobalBackground.tsx` returns no matches. Inspect only the added CSS for raw component colors and scope leakage.

**Done:** static background replaces global R3F, homepage is unchanged, scopes do not leak, docs match. Commit with Task 2 after Phase 1 gates.

### Task 2: Page header pattern and matching skeletons

**Files:**
- Create: `src/components/ui/PageHeader.tsx`.
- Modify: `src/components/ui/SectionHeading.tsx`, `src/lib/animations.ts`, `src/app/globals.css`.
- Modify: `src/app/photography/loading.tsx`, `src/app/projects/loading.tsx`, `src/app/blog/loading.tsx`.
- Modify documentation: `CLAUDE.md` (new component/classes).
- Read-only: `src/components/ui/Skeleton.tsx`, homepage consumers of SectionHeading.

**Interfaces:** SectionHeading gains `as?: "h1" | "h2"`, `className?: string`, preserving children/id/default h2. PageHeader consumes `{ title: ReactNode; intro?: ReactNode; children?: ReactNode; className?: string }`. Add `headingUnderline: Variants` with visible scaleX `[0, 1]`, duration 0.6, delay 0.2 to animations.ts; SectionHeading replaces only its inline underline animation with that variant. Direct-import PageHeader; no barrel edit needed.

- [ ] Add SectionHeading's optional tag/size interface with `cn()`; preserve default h2 classes and existing homepage output. Keep the spark/underline and named shared variants with `initial={false}`, reduced-motion gating and once-only viewport. Do not add a second parent entrance.
- [ ] Create server-compatible PageHeader as a div wrapping SectionHeading as h1, optional Dust intro and optional metadata slot. No client directive, hooks, fetching or locale resolution there.
- [ ] Add `.portfolio-page` navigation clearance/min-height and `.portfolio-page-header` spacing/wrapping. Scope the exact homepage stacked Void heading/intro shadows to the new header, plus opaque `.portfolio-page .portfolio-surface`. Leave `#portfolio-sections`, `.portfolio-sections` veil and `.portfolio-footer` home selectors unchanged.
- [ ] Convert three loading routes to `.portfolio-page` → `.portfolio-section` → `.portfolio-column`. Use static aria-hidden Hull/Control/Hairline blocks with bounded width matching forthcoming photo grid, project grid and blog rows; remove legacy CardSkeleton/PhotoSkeleton composition imports in these route files. Do not change Skeleton defaults or homepage loading consumers. Keep loading status accessible through a concise status label.
- [ ] Verify G and U: loading routes under throttling/route transitions, no 384px skeleton spilling out of a 343px content column, homepage heading h2 scale/spark/glow unchanged, one semantic h1 on completed pages using the new component, reduced-motion final state and SSR visibility.
- [ ] L: `rg -n 'gradient-text|glass|glow-(purple|cyan)|from-purple|to-cyan|bg-slate-|brand\.|CardSkeleton|PhotoSkeleton|animate-' src/components/ui/PageHeader.tsx src/components/ui/SectionHeading.tsx src/app/photography/loading.tsx src/app/projects/loading.tsx src/app/blog/loading.tsx` returns no matches. Review the new CSS rules separately; do not scan legacy globals as a whole.
- [ ] After Claude's G/U and review of both tasks: `git add` only Phase 1 files and `git commit -m "style: share portfolio page shell and static stars"`.

**Done:** reusable h1 pattern preserves homepage h2 appearance; route skeletons match and fit both widths; Phase 1 can ship before page conversions.

## Phase 2 — Photography and albums (30 minutes)

### Task 3: Gallery surfaces and keyboard photo targets

**Files:** Modify `src/components/photography/PhotographyGallery.tsx`, `src/components/photography/GridLayout.tsx`, `src/components/photography/MasonryLayout.tsx`, `src/components/photography/CompareLayout.tsx`, `src/components/photography/StoryLayout.tsx`, `src/components/photography/BeforeAfterSlider.tsx`, `src/components/photography/AlbumDetailView.tsx`, `src/components/photography/PhotoLightboxModal.tsx`; modify `src/app/globals.css` only for narrowly page-scoped image-loading presentation if necessary. Read-only `src/app/photography/page.tsx`, `src/app/photography/album/[slug]/page.tsx`.

**Interfaces:** Consume PageHeader and shared shell; preserve all photo/album props, callbacks, layout-mode values and state predicates. Grid/Masonry native button targets call existing photo-open callbacks. Lightbox receives only dark token scope/accent class changes, no new props.

- [ ] Replace Gallery's stock-photo/slate gradient hero and ambient purple/cyan blobs with PageHeader using existing translated title and intro; keep stats in the slot. Replace AlbumDetailView's title backdrop with PageHeader and existing album media as content. Use `.portfolio-text-link` for back/other-album links.
- [ ] Convert toolbar, search, category/layout/tab controls, cards, metadata, badges and empty notices to portfolio surfaces/text/actions/input. Keep original filter/sort/search code, photo ratios, album routing and all four layouts. Replace raw class interpolation with `cn()` for changed dynamic styles. Replace imported legacy visual recipes, not just literal classes. Retain neutral black caption scrims and white overlay text only on actual media.
- [ ] In Grid/Masonry replace onClick motion containers with valid native button opening targets inside noninteractive layout wrappers, using spans where required for valid button content. Preserve image load state and callback arguments, localized accessible name with existing title fallback, no nested interactive descendants and visible focus. Strip per-card/lay-out-switch entrance cascades; the header is the entrance. Keep BeforeAfterSlider's mechanics unchanged.
- [ ] In PhotoLightboxModal pin scope dark and replace purple/cyan/violet accents, active fills/borders and colored glow with Accretion/on-accretion/token mixes. Keep theater surfaces, motion, shortcuts, zoom, media, backdrop and info behavior. Add no `light:` classes and do not normalize slate theater surfaces.
- [ ] Verify G/U: gallery photos/albums tabs, every layout, search/no-match/reset, empty compare, album back/other albums, long VI titles, no-image loading, photo/video open, zoom/info/before-after and existing Escape/arrow/B/I shortcuts. In Grid and Masonry use only keyboard to open the correct image once via Enter then Space. Inspect target DOM for valid markup. Open lightbox from a light page and confirm dark theater and dark Accretion. No-JS shows supplied gallery/album content; no repeated card entrances/reduced-motion movement.
- [ ] L: `rg -n 'gradient-text|glass|glow-(purple|cyan)|(?:from|via|to|bg|text|border|shadow)-(?:purple|cyan|violet|indigo)-|bg-slate-|brand\.|animate-' src/components/photography/PhotographyGallery.tsx src/components/photography/GridLayout.tsx src/components/photography/MasonryLayout.tsx src/components/photography/CompareLayout.tsx src/components/photography/StoryLayout.tsx src/components/photography/BeforeAfterSlider.tsx src/components/photography/AlbumDetailView.tsx` returns no matches. Separately `rg -n '(?:purple|cyan|violet)-|light:' src/components/photography/PhotoLightboxModal.tsx` returns no matches; do not require its slate/black theater classes to disappear.
- [ ] After Claude's G/U and review: stage only Phase 2 files and `git commit -m "style: align photography pages with portfolio"`.

**Done:** both photography routes match homepage tokens; all layouts and existing states work; Grid/Masonry are native keyboard targets; lightbox remains theater mode. Phase 2 can ship without music conversion.

## Phase 3 — Music and global mini player (35 minutes)

### Task 4: Minimal dark music skin conversion

**Files:** Modify `src/app/music/page.tsx`, `src/app/music/music.css`, `src/components/music/MusicPlayer.tsx`, `src/components/music/MusicSidebar.tsx`, `src/components/music/LyricsView.tsx`, `src/components/music/Visualizers.tsx`; `src/lib/animations.ts` only if an existing interaction's transform/opacity variant cannot be reused. Read-only `src/context/MusicContext.tsx`.

**Interfaces:** `.music-page-root` becomes `.portfolio-theme[data-portfolio-dark="true"]`; current CSS class names and all player/context APIs remain. Existing `--music-*` become scoped aliases to portfolio properties. No new helper or audio API.

- [ ] Add local dark portfolio scope in MusicPage without changing its data query/catch/ISR or widening PortfolioScope. Move `music.css` declarations from `:root` into `.music-page-root`. Map music primary/secondary/accent→Accretion, bg→Void, sidebar/surface→Hull, surface-hover→token mix, text→Ink/Dust, border→Hairline, border-hover→Control/Accretion. Remove nebula variables/washes and ambient glow rendering; delete related rules only when no consumers remain.
- [ ] Replace remaining hardcoded CSS colors, gradients, colored shadows/glows, glass blur and decorative pulse/spin styling in place. Keep responsive studio/transport layout. Use portfolio 8px controls, Accretion focus and active borders/text. Fix `.music-top-search`/dropdown minimum widths locally so 375px does not overflow; do not mask the problem with body overflow-x hidden. Apply portfolio-column sizing to stage content and section rhythm inside existing scroll geometry.
- [ ] Replace MusicPlayer/MusicSidebar/LyricsView utility/inline legacy colors and imported visual recipes, including `text-purple-400`, `text-cyan-400`, timer styling and Suspense black fallback. Use PageHeader at the existing stage-heading location; do not add height above the studio. Keep all copy, handlers, active tab/queue/lyric predicates and `parseLrcLyrics()` unchanged. Remove repeated decorative entrances and use named shared variants for remaining motion with final-state reduced behavior.
- [ ] Tokenize Bars/Wave/Pulsar drawing colors; canvas receives computed CSS color strings read once from its scoped element per effect setup, never unresolved `var()` in canvas APIs or getComputedStyle per frame. Remove colored blur/shadows. Keep audio geometry/calculations/modes; use transform/opacity for decorative DOM motion and still final visualizers under reduced motion (no waveform RAF). Do not edit MusicContext or rewrite high-frequency audio state management. Remove extra vinyl/status/logo decorative loops so the chosen visualizer owns the motion budget.
- [ ] Verify G/U: both stored preferences produce identical dark palette; mobile drawer/search results fit; desktop transport remains visible; player/queue/charts/favorites/info/lyrics tabs, sort/search/genre, no-match/no-lyrics/loading/error/empty states retain current behavior. Smoke play/pause/seek/volume/repeat/shuffle/speed/EQ/timer/like, collapsed dock and existing upload entry without uploading real media. Check visualizer modes, token canvas colors and reduced-motion stills while playback continues. JS-disabled content does not acquire new mount guards.
- [ ] L: `rg -n 'gradient-text|glass|glow-(purple|cyan)|(?:purple|cyan|pink|violet|indigo)-|bg-slate-|brand\.|animate-|#[0-9a-fA-F]{3,8}|rgba?\(' src/app/music/page.tsx src/app/music/music.css src/components/music/MusicPlayer.tsx src/components/music/MusicSidebar.tsx src/components/music/LyricsView.tsx src/components/music/Visualizers.tsx` returns no legacy styling matches. Remove stale theme comments too; any numeric canvas transparency must derive from computed tokens, not a retained neon palette. `rg -n 'light:|:root' src/app/music/music.css src/app/music/page.tsx src/components/music/MusicPlayer.tsx src/components/music/MusicSidebar.tsx src/components/music/LyricsView.tsx src/components/music/Visualizers.tsx` returns no matches.

**Done:** dark portfolio music skin covers CSS, TSX and canvas without player rewrite; no global music variable leakage. Commit with Task 5.

### Task 5: Theme-aware floating mini player

**Files:** Modify `src/components/music/GlobalMusicPlayer.tsx`; reuse `src/app/globals.css` and `src/lib/animations.ts` from earlier tasks, extending a page-independent mini-player selector there only if needed. Read-only `src/app/layout.tsx`, `src/components/music/GlobalMusicPlayerLazy.tsx`, `src/context/MusicContext.tsx`.

**Interfaces:** GlobalMusicPlayer's API, visibility predicates, spacer and useMusic calls remain; own rendered `.portfolio-theme` scope supplies flipping tokens outside PortfolioScope. No music.css dependency.

- [ ] Add independent portfolio scope on the rendered mini-player root. Replace `bg-black/80 light:bg-white/90`, purple shadow, progress gradient and legacy text/controls with opaque Hull/Hairline, Ink/Dust, Accretion, token focus and existing `.portfolio-action*` where suitable. Retain safe-area positioning, footer spacer and max width. Replace inline spring reveal with existing named transform/opacity variants and reduced-motion final state.
- [ ] Verify G/U: start playback on music, navigate to photography/blog/projects in light mode, pause/next/dismiss/open music, change themes while playing, scroll to footer at 375px and ensure spacer prevents obstruction. Reload a public route directly to confirm styles work without music.css having loaded. Confirm hidden on excluded routes per existing logic. No-JS SSR content of host pages stays visible.
- [ ] L: `rg -n 'gradient-text|glass|glow-(purple|cyan)|(?:from|via|to|bg|text|border|shadow)-(?:purple|cyan|pink)-|bg-slate-|brand\.|animate-|light:' src/components/music/GlobalMusicPlayer.tsx` returns no matches.
- [ ] After Claude's G/U and review of Tasks 4–5: stage only Phase 3 files and `git commit -m "style: apply portfolio tokens to music surfaces"`.

**Done:** route skin stays dark, mini player follows light/dark and preserves playback behavior. Phase 3 can ship independently of remaining pages.

## Phase 4 — Projects, Blog, 404 and validator (30 minutes)

### Task 6: Projects and blog surfaces, including MDX

**Files:** Modify `src/components/projects/ProjectsGallery.tsx`, `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/components/blog/BlogList.tsx`, `src/components/blog/BlogPostView.tsx`, `src/app/globals.css` for page-scoped prose/highlight rules. Read-only `src/app/projects/page.tsx`, `src/lib/blog.ts`, `src/lib/blog-list.ts`, `src/lib/mdx-policy.ts`.

**Interfaces:** Consume PageHeader/shell; retain Project props, ProjectDetailModal state/close interface, BlogList filters, BlogPostView metadata and ReactNode content slots. `mdxComponents` still merges `cn(ours, className)` with className removed from spread props.

- [ ] Replace ProjectsGallery purple eyebrow/header with PageHeader, search with `.portfolio-input`, tag states with shared controls. Replace TiltCard/GlassCard with `.portfolio-case.portfolio-solid`, full wrapping titles, Ink/Dust/Hairline and portfolio links/actions. Remove absent-image rocket blocks entirely in card and modal; retain real images/featured labels. Keep filtering and modal/Escape/focus restoration behavior; no new project data or dialog rewrite.
- [ ] Remove BlogPage/BlogPostView radial legacy backgrounds. Use shared page/column/header and Hull rows in BlogList following BlogPreviewSection's date/title/read-time rhythm; retain category predicates, excerpts/tags/links. Move no-post notice below header rather than losing title through early return; keep empty/no-match meanings. Article and author use opaque surfaces within ~68ch reading width; category/availability/tags use tokens, preserving original-English fallback.
- [ ] Tokenize mdxComponents headings/body/links/lists/blockquote/inline code/pre/strong/hr and policy notice classes without changing renderMdxBody/MDX plugins or data. Add only page-scoped highlight roles derived from portfolio tokens, overriding existing purple/cyan code colors inside converted articles. Keep hljs/language classes, syntax readability and pre internal scrolling. Remove prose-invert dependence in favor of explicit token styling, preserve long-link wrapping.
- [ ] Verify G/U: project tag/search/no-match, full long titles, absent/real images, modal close/focus/links; blog all/category/no-post/no-match, EN/VI with/without translated body, MDX headings/links/blockquote/inline/fenced code and policy notice. Check missing slug 404. Exercise long code/URLs at 375px; no whole-page overflow. SSR shows posts/content; reduced-motion content visible. G includes blog/MDX existing tests; none should need changed assertions.
- [ ] L: `rg -n 'gradient-text|glass|GlassCard|TiltCard|glow-(purple|cyan)|(?:from|via|to|bg|text|border|shadow)-(?:purple|cyan|pink|violet|indigo)-|bg-slate-|brand\.|animate-' src/components/projects/ProjectsGallery.tsx src/app/blog/page.tsx 'src/app/blog/[slug]/page.tsx' src/components/blog/BlogList.tsx src/components/blog/BlogPostView.tsx` returns no matches. Shell users must pass the literal bracketed filename correctly (PowerShell use quoted `'src/app/blog/[slug]/page.tsx'` without backslashes). Inspect scoped highlight CSS separately; do not remove global legacy syntax rules.

**Done:** projects/blog match portfolio including modal, empty and MDX states; no content/reader policy changes. Commit with Task 7.

### Task 7: Static 404 and validator presentation; final review

**Files:** Modify `src/app/not-found.tsx`, `src/app/tools/json-validator/page.tsx`, `src/components/tools/JsonValidator.tsx`. No changes to validation helpers or theme scripts.

**Interfaces:** 404 keeps its client component, BlackHoleCanvas, HUD, sound toggle and Return Home href `/`. JsonValidator's existing state, file handlers, `extractSuffix`, `groupFilesBySuffix`, `validateAllFiles`, `loadSampleData` and results shape remain untouched.

- [ ] Keep the 404 black hole experience (BlackHoleCanvas, HudMetrics, SoundToggle, useHideGlobalChrome, Return Home `/`). Re-skin only: raw RGBA/inline HUD and copy colors → portfolio tokens; `404` emphasis in Accretion; Return Home as `.portfolio-action .portfolio-action-primary`; HUD readable in both themes.
- [ ] Replace validator page gray/purple gradient and centered legacy heading with shell/PageHeader. Replace tool glass/blur panels, blue/pink/purple actions, gradient pair/result badges and gray boxes with portfolio surfaces/actions/input styling and token text/borders. Keep success/error labels/icons and all calculations/attributes. Keep file/folder controls, make their existing inputs keyboard reachable via visually hidden (`sr-only`) rather than `hidden` presentation and expose focus on associated label; no new selection handler. Long filenames/IDs wrap, grids use `min-width: 0`, result scroll stays local. Remove repeated result entrances and legacy animate-spin; pending text remains.
- [ ] Verify G/U: unknown route in both themes, black hole and HUD still render, Return Home works and the nav is restored after navigating away. Validator no files, sample load, file/folder selection, drag active, matching pairs, malformed JSON, valid and missing IDs, validating disabled state; tab to input/action labels and see focus. Confirm same results and matching semantics, long filenames at 375px, no new RHF/zod migration or network/API changes. Reduced-motion and no-JS shell readable.
- [ ] L: `rg -n 'gradient-text|glass|glow-(purple|cyan)|(?:from|via|to|bg|text|border|shadow)-(?:purple|cyan|pink|violet|indigo)-|bg-slate-|brand\.|animate-' src/app/not-found.tsx src/app/tools/json-validator/page.tsx src/components/tools/JsonValidator.tsx` returns no matches. Review remaining blue/red/green status styling: use tokens and existing labels/icons, not legacy colored panel recipes.
- [ ] Claude runs final G and U for all listed routes at both widths/themes, including reduced motion, keyboard photo activation, homepage h2/background and `/admin/login`/`/couple` regression checks. Review `git diff --check`, `git diff --stat` and changed paths: no forbidden implementation files, behavior changes or theme script hash changes. Record failures/blockers honestly in review; no new evidence file required.
- [ ] After Claude review and gates: stage only Phase 4 files and `git commit -m "style: align projects blog and utility pages"`. Provide owner before/after browser evidence and check results, leave branch unmerged.

**Done:** every in-scope route/state satisfies the spec, all four phase commits are independently reviewable, owner retains merge control.

## Risks

- `music.css` is large and full of literal rules after its top variables. A top-block-only swap leaves legacy art; a rewrite cannot fit the budget. Edit declarations in place, scan TSX/canvas too, and defer unrelated dead-rule cleanup.
- Canvas colors require resolved CSS values; bars/pulsar inline styles can override token CSS. Reduced motion must stop decorative rendering without muting or resetting playback.
- Removing R3F affects shared negative stacking and the prior incidental couple background. Keep excluded subtree code unchanged and verify its content; retain SceneContainer and homepage engine.
- ProjectsGallery really contains placeholders and a distinct modal from the homepage. Remove missing-image regions without changing data or pulling in a new modal implementation.
- Lightbox's accent tokens must remain dark even beneath a light portfolio parent. Preserve theater typography and neutral dark surfaces; do not use a broad legacy-removal scan as permission to restyle it.
- SectionHeading is shared with the homepage. Optional props and page-only selectors must leave existing h2 layout unchanged; replacing its inline underline with an equivalent shared variant is the only motion extraction there.
- Production build depends on configured DB/environment. Missing credentials or unavailable DB is a verification blocker, not a passing build. Claude owns checks; this document contains no claimed execution results.

## Câu hỏi mở

None. The user's eleven settled decisions are binding. No prototype, theme, scope, branch, merge or execution-method question is reopened here.

## Order and completion condition

Task 1 → 2 → Claude G/U/review → Phase 1 commit; Task 3 → G/U/review → Phase 2 commit; Task 4 → 5 → G/U/review → Phase 3 commit; Task 6 → 7 → final G/U/review → Phase 4 commit. No implementation, checks or commits occur in this spec/plan authoring turn. Completion of implementation requires actual green results and browser evidence, not only an empty legacy scan.


# Portfolio overhaul theo phase — Implementation Plan

> **Dành cho người/agent triển khai:** dùng `superpowers:executing-plans` để thực hiện từng task; chỉ dùng `superpowers:subagent-driven-development` nếu người dùng chọn cách đó. Các bước dùng checkbox (`- [ ]`). Đây chỉ là tài liệu, chưa chạy cài đặt, sửa ứng dụng hay commit.

**Goal:** Khắc phục review correctness/security/performance/tooling và làm mới homepage theo hướng đã đề xuất, có cổng duyệt hero trước rollout.

**Architecture:** Data cache và mutation ở `src/lib/content/*` / `src/lib/blog.ts`; helper thuần có Vitest trước implementation; giữ Next.js 14. UI giữ section locale ở client và tách heavy islands, token/style opt-in cho consumer thực sự render trong dark-only; mỗi phase là một PR có thể ship độc lập vào `develop`.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript strict, Tailwind v4, Prisma 7/Postgres, Framer Motion, Three.js/R3F, react-hook-form + zod, Vitest 3.

**Spec:** `docs/superpowers/specs/2026-11-06-portfolio-overhaul-design.md`.

**Design direction:** `docs/superpowers/specs/2026-11-06-portfolio-design-direction.md` (đặc biệt §2, §6, §8) là nguồn token/composition, còn là đề xuất tới khi Task 13 được duyệt. Thay thế plan cũ `docs/superpowers/plans/2026-10-26-portfolio-ui-update.md:1–24`; giữ file cũ làm lịch sử, không sửa trong lượt này.

## Global Constraints

- Đọc spec và toàn bộ `CLAUDE.md` trước triển khai. `CLAUDE.md:59–67`: Three.js/R3F client, R3F chỉ qua SceneContainer; không thêm Canvas root; black hole imperative là ngoại lệ; high-frequency dùng ref.
- `CLAUDE.md:85–90`: thêm `light:` cạnh dark, không thay dark bằng light; không thêm `light:` vào `/admin`, `/couple`, `/music`, `PhotoLightboxModal`; overlay ảnh giữ đen cả hai theme.
- Token/font/focus/Button mới phải opt-in scope portfolio; mặc định cũ vẫn hoạt động cho dark-only/shared consumer. Không đổi global legacy palette/font rồi chỉ kiểm tra `resolvedTheme`.
- `CLAUDE.md:69–78`: dùng `cn`, AnimatedSection + shared variants; DB CMS chỉ qua content layer/blog; cache public reads, auth trước admin write, invalidate tag sau write thành công. Music được dùng Track/Playlist trực tiếp theo quy tắc hiện có.
- Form mới hoặc đổi logic phải RHF + zod + resolver (`CLAUDE.md:92–93`). Giữ blank/unset semantics của `src/lib/content-overrides.ts:14–50`.
- Copy EN/VI đã duyệt theo `docs/superpowers/specs/2026-11-06-portfolio-content.md`; nhập qua `/admin` sau UI trong task giao section, không script/seed/migrate/upsert DB. F10 thống nhất Frontend Software Engineer. Không số điện thoại/ngày sinh trên site; không email thật khi test. Xoá demo cần chat xác nhận danh sách slug trước thao tác `/admin/blog`.
- Khi triển khai: sau thao tác đầu `npm install`, dùng branch `feature/<topic>` từ `develop`; mỗi phase PR vào `develop`, không `main`. Không chạy các lệnh này trong lượt lập tài liệu.
- TDD cho pure logic: viết test có tên và assertions bên dưới → chạy đỏ → implementation tối thiểu → chạy xanh. Không thêm test chỉ phản chiếu class CSS. Các test hiện có giữ nguyên trừ cập nhật auth được nêu rõ ở Task 8b.
- Với mọi task có lệnh target tests bên dưới: chạy lại **chính lệnh đó sau implementation**, kỳ vọng tất cả test được nêu PASS, rồi `npx tsc --noEmit -p .` và `npm run lint` exit 0 trước commit. Những test characterization đã xanh không cần tạo fail giả; mọi behavior mới phải có test đỏ thật trước. Các bước `tsc/lint/test pass` ở task UI tương ứng ba lệnh đầy đủ `npx tsc --noEmit -p .`, `npm run lint`, `npm test`.
- Mỗi task có bước commit; format `git commit -m "<type>: <subject>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`, stage chính xác file của task bằng `git add -- <paths>`, không `git add .`. Chỉ commit sau checks tương ứng xanh; đây là chỉ dẫn triển khai về sau.

- Hệ chuyển động theo design direction §8: chỉ Framer Motion + CSS, không dependency mới; gỡ gsap ở Phase 0. Variants ở `src/lib/animations.ts`, dùng AnimatedSection khi phù hợp; chỉ transform/opacity/blur ngắn/stroke-dashoffset, không animate layout.
- Ngoài black hole/starfield, tối đa một loop liên tục trong viewport; mọi loop pause off-screen/tab ẩn. `prefers-reduced-motion` hiện final ngay, không parallax/drawing/sequence. Nội dung không phụ thuộc animation để hiện; one-shot dùng `viewport={{ once: true }}`.
- Pure helpers motion mới phải Vitest đỏ trước implementation; Task 20 đo initial JS `/` và frame rate trước/sau cùng device/build/network, mục tiêu 60 fps trên điện thoại tầm trung.

### Bộ kiểm tra đóng phase (G)

```bash
npx tsc --noEmit -p .
npm run lint
npm test
npm run build
```

Kỳ vọng: cả bốn exit 0; lint 0 error/0 warning từ Phase 0 trở đi; Vitest tất cả pass; build compile/render thành công. Build cần `DATABASE_URL` hợp lệ và các biến môi trường ứng dụng, font build có network/cache phù hợp. Dùng test/staging DB được phép, không production thiếu dữ liệu rồi để `getSiteConfig()` upsert default. Thiếu biến/quyền/kết nối là blocker chưa đóng phase. CI hiện chỉ tsc + informational lint (`.github/workflows/ci.yml:27–33`), vì vậy không coi CI xanh thay được G.

### Ma trận UI (U)

Chụp 390×844 và 1280×800 × dark/light; chạy EN và VI, keyboard (Tab/Shift+Tab/Enter/Space/Escape, focus return), reduced-motion, no-JS và hydration chậm. Đối chiếu ảnh `/admin`, `/couple`, `/music`, PhotoLightboxModal với baseline dark-only, cả khi preference lưu là light; không có đổi font/token/control không chủ đích. Kiểm tra thêm 320/768/1440 cho overflow ở Phase 5. Không có lỗi console/hydration hay request lỗi mới. Mỗi task UI chạy U cho phần chạm; mỗi phase UI chạy U toàn phạm vi. Kết quả ảnh/check ghi vào PR, không thêm screenshot vào repo nếu chưa cần.

## Review Focus

1. Blog static cache sau CRUD/new slug không stale, không body trong client list → Task 3 (`blog-list.test.ts`, route mocks + production invalidation).
2. Upload giả MIME/extension/subtype/path và multipart thứ hai sai không side effect → Task 4 (`upload-validation.test.ts`, mocks Cloudinary).
3. MDX expressions/ESM/mọi JSX không được evaluate, code fences không bị chặn → Task 6 (`mdx-policy.test.ts`).
4. CSP không chặn theme init, Next/RSC, media/CV/WebGL → Task 7 report-only smoke và Task 20 ghi giới hạn đã biết.
5. Locale race/no-JS/CMS blank/shared theme inheritance không mất nội dung hoặc đổi dark-only → Task 9, 12–20; `locale-loader.test.ts`, `content-overrides.test.ts`, U và screenshot baseline.
6. Motion khi no-JS/reduced-motion, nhiều section cùng viewport và tab ẩn: nội dung luôn hiện, loop dừng đúng, keyboard tương đương hover; Task 12–19 chạy U, Task 20 đo contrast composite/initial JS/frame rate.

---

## File Structure

Danh sách **Modify** dưới đây là file đã tồn tại; **Create** là output tương lai, không được tạo trong lượt viết plan. Các test dùng `src/**/*.test.ts` theo `vitest.config.mts:8–10`.

| Nhóm / task | File và trách nhiệm |
|---|---|
| 1–2 | `package.json`, `package-lock.json`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `next.config.js`: restore/tooling/dependencies/lint |
| 3 | `src/lib/blog.ts`, `src/lib/types.ts`, blog routes/pages/client consumers; mới `src/lib/blog-list.ts`, `blog-list.test.ts`, `blog.test.ts`: DTO/cache/mutation |
| 4 | Hai upload routes; mới `src/lib/upload-validation.ts`, `upload-validation.test.ts`, `upload-routes.test.ts`: metadata/signature/cap |
| 5 | Music track routes, `src/context/MusicContext.tsx`; mới `src/lib/music-schema.ts`, `music-schema.test.ts`, `music-routes.test.ts`, route `[id]/play/route.ts` |
| 6 | Blog render/write; mới `src/lib/mdx-policy.ts`, `mdx-policy.test.ts`: remark AST policy |
| 7 | `next.config.js`, `src/app/layout.tsx`, `src/middleware.ts`; mới `src/lib/theme-init.ts`, `theme-init.test.ts`, `security-headers.test.ts`: byte ổn định/theme/CSP |
| 8 | `src/lib/content/site-config.ts`, `src/app/layout.tsx`; mới `src/lib/site-config-fallback.ts`, `site-config-fallback.test.ts`, `content-overrides.test.ts`, `session-token.test.ts`, `rate-limit.test.ts`; modify `session-token.ts` nếu test parser fail |
| 8b | Auth route/login/middleware/helpers; scrypt/login schema + tests, env/docs Task 8b bắt buộc; không store mới |
| 9 | Locale index/context; mới `src/lib/locale-loader.ts`, `locale-loader.test.ts`: EN tĩnh/SSR, VI lazy, switch atomic |
| 10 | `src/components/ui/Icon.tsx`; mới `src/components/ui/PublicIcon.tsx`, `src/components/ui/icons/public.tsx`, `admin.tsx`, `music.tsx`, `brands.tsx`, `src/lib/icon-names.ts`, `icon-names.test.ts`: chia registry |
| 11 | ImageWithSkeleton, AlbumDetailView, blackhole engine/canvas; mới `src/lib/cloudinary-image-loader.test.ts`, `seo.test.ts`: LCP/lifecycle |
| 12 | globals/layout/Button/Navigation/Footer/toggles; navigation-section helper/tests, SectionHeading, motion-math helper/tests và animations.ts: token opt-in + Hobby + shared motion |
| 13 | Hero/page/GlobalBackground/StarryBackground3D/SceneContainer/BlackHoleCanvas/AnimatedSection/animations/locales; mới `src/components/sections/HeroCanvas.tsx`, `HeroActions.tsx`: prototype/approval |
| 14–19 | Sáu section, page/barrel/locales; constellation helper/tests (15), BlogList/layout/nav filter/tests (18), xoá ParticleField + barrel export (19); mới `src/components/sections/ProjectDialog.tsx`, `ContactForm.tsx`, `CopyEmailButton.tsx`: section locale client nhẹ/heavy islands |
| 20 | `CLAUDE.md`, `docs/HALLMARK_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, hai tài liệu overhaul này: evidence và quy tắc đã duyệt |
| 21 | Chỉ ghi backlog trong plan; không refactor/nâng major ở đợt này |

## Phase 0 — Môi trường & tooling

### Task 1: Restore môi trường, phân loại lint và làm lint sạch (Q3, Q1)

**Files:** Modify `package-lock.json` nếu `npm install` thực sự cập nhật; `eslint.config.mjs:9–13`; `.github/workflows/ci.yml:30–33`. Các file `src/` chỉ sửa khi diagnostic thực tế chỉ ra, inventory dự kiến cần đọc: `src/app/layout.tsx`, `src/context/LanguageContext.tsx`, `src/lib/content/nav-links.ts`, `src/lib/content/photography.ts`, `src/app/api/admin/blog/route.ts`, `src/app/api/admin/photography/upload/route.ts`, `src/app/api/admin/media/route.ts`, `src/app/api/admin/media/sync/route.ts`, `src/app/api/admin/couple/route.ts`, `src/app/admin/photography/page.tsx`, `src/app/admin/couple/page.tsx`, `src/app/admin/social-links/page.tsx`, `src/app/admin/media/page.tsx`, `src/app/admin/skills/page.tsx`, `src/app/admin/music/AdminMusicClient.tsx`, `src/app/admin/music/[id]/edit/EditTrackClient.tsx`, `src/components/admin/IconPickerModal.tsx`, `src/components/admin/MediaPickerModal.tsx`, `src/components/music/MusicPlayer.tsx`, `src/components/music/LyricsView.tsx`, `src/components/tools/JsonValidator.tsx`, `src/components/3d/StarryBackground3D.tsx`. Đây là danh sách grep `any`, không phải kết quả ESLint; pin danh sách diagnostic chính xác trong checklist task trước sửa, file ngoài danh sách chỉ thêm khi lint nêu đúng lỗi.

**Interfaces:** giữ public API; sản phẩm là lint blocking toàn source, không disable rule/ignore `src`. `vitest.config.mts` giữ node/alias hiện tại.

- [ ] **Bước 1:** Lệnh đầu lúc bắt đầu implementation là `npm install`; kỳ vọng local Vitest được cài và `postinstall` chạy `prisma generate` thành công. Ghi lỗi env nếu có, không `db push`/seed. Sau đó kiểm tra worktree sạch/những thay đổi có sẵn, chuyển `develop` và tạo `feature/portfolio-tooling`; không ghi đè việc của người dùng.
- [ ] **Bước 2:** Chạy `npm run lint`, `npm test`, `npx tsc --noEmit -p .` lấy baseline thật. Đối chiếu số review 7888 tổng, 7792 worktrees, 8 agents, khoảng 88 source; không dùng số cũ làm assertion.
- [ ] **Bước 3:** Bổ sung global ignores `.claude/worktrees/**`, `.agents/**`, `.hallmark/**`, `.superpowers/**` cạnh ignores hiện có. Chạy lint lại, liệt kê chính xác path/rule/line của phần còn lại trong task/PR.
- [ ] **Bước 4:** Sửa diagnostics theo nhóm nhỏ: `unknown` + narrow error, Prisma/domain types đúng, xóa import/variable không dùng, escape JSX text, dependency hooks đúng lifecycle. Không dùng blanket disable, không đổi CSS dark-only; nếu phải đổi pure behavior thì thêm regression test trước ở file cạnh module. F9 fallback giữ typed shape, Task 8 hoàn thiện nguồn fallback; không né lint bằng cast khác.
- [ ] **Bước 5:** `npm run lint` phải 0 error/0 warning, rồi xóa `continue-on-error` và comment số lỗi cũ, đổi tên step thành `Lint`. `npm test` và tsc pass trước commit.
- [ ] **Bước 6 — Commit:** stage đúng file diagnostic đã sửa; `chore: restore tooling and enforce clean lint`, dùng trailer Global Constraints.

### Task 2: Dọn dependency và watcher cũ (Q2, Q5), đóng Phase 0

**Files:** Modify `package.json:2–63`, `package-lock.json`, `next.config.js:10–37`.

**Interfaces:** giữ scripts `dev/build/start/lint/test/postinstall`, Prisma generate; không nâng Next 14 hoặc ESLint 8.

- [ ] Grep **từng package** trong `src`, `scripts`, config và repo, loại `.claude/worktrees`, `.agents`, `.next`, lockfile khỏi evidence usage. Ví dụ `rg -n -F 'gsap' src scripts next.config.js`; lặp cho `zustand`, `canvas-confetti`, `@types/canvas-confetti`, `marked`, `sonner`, `@number-flow/react`, `@formkit/auto-animate`, `@next/mdx`, `@use-gesture/react`, `gray-matter`. Kỳ vọng không có executable import của nhóm bỏ; từ “marked” trong comment không phải usage. Kiểm tra dynamic import/require và package config nữa. Evidence hiện tại: chỉ `scripts/migrate-json-to-db.ts:17` import gray-matter.
- [ ] Chỉ remove package đã xác nhận không dùng bằng `npm uninstall <verified-packages>`; chuyển gray-matter sang devDependencies với version hiện có và đổi name `my-app` → `portfolio` trong manifest/lock root. `npm install` sync lock, không sửa lock bằng tay.
- [ ] `rg -n 'content/data|\.json' src/lib/constants.ts src/lib/content next.config.js` chứng minh watcher rationale không còn đúng; bỏ block `if (dev)` tại `next.config.js:23–36`, bỏ `dev` argument nếu không dùng, giữ HEIC external packages/Cloudinary loader.
- [ ] Chạy G; kỳ vọng xanh toàn bộ. Smoke admin save trên test DB không gây full reload bất thường; không đổi copy thật. Mở PR Phase 0 vào `develop`, ghi dependency evidence và environment recovery; merge xong phase sau tách branch mới từ develop.
- [ ] **Commit:** `chore: prune unused packages and legacy watcher`, trailer Global Constraints.

## Phase 1 — Correctness & bảo mật

### Task 3: Blog cache, metadata DTO và data layer writes (F1, F2)

**Files:** Modify `src/lib/blog.ts:5–68`, `src/lib/types.ts` (BlogPost), `src/app/blog/page.tsx:1–23`, `src/app/blog/[slug]/page.tsx:6–18`, `src/app/page.tsx:4,53–62`, `src/components/blog/BlogList.tsx`, `src/components/sections/BlogPreviewSection.tsx`, `src/app/api/admin/blog/route.ts`, `src/app/api/admin/blog/[slug]/route.ts`; Create `src/lib/blog-list.ts`, `src/lib/blog-list.test.ts`, `src/lib/blog.test.ts`.

**Interfaces:** `BlogPostListItem = Omit<BlogPost,"content"|"content_vi">`; `getPostSummaries(): Promise<BlogPostListItem[]>`; `getPostBySlug(slug: string): Promise<BlogPost|null>`; `toBlogListItem(row: BlogListRow): BlogPostListItem`; `createPost`, `updatePost`, `deletePost` trong `blog.ts` giữ hợp đồng admin hiện có.

- [ ] Viết trước `maps_list_without_either_body` (assert `Object.hasOwn(item,'content')` và `'content_vi'` đều false), `maps_nullable_vi_to_undefined`, `sorts_summaries_newest_first`, `categories_use_metadata_only`. `blog.test.ts` mock Prisma/cache: query list `select` không body, slug khác nhau không dùng chung value, mutation fail không invalidate ở route. Chạy `npm test -- src/lib/blog-list.test.ts src/lib/blog.test.ts` → đỏ trước helper/API mới.
- [ ] Tạo whitelist query và mapper tường minh, không `{...row}`. Mẫu cache không tầm thường:

```ts
export const getPostSummaries = unstable_cache(
  async () => (await db.cmsBlogPost.findMany({ select: blogListSelect }))
    .map(toBlogListItem).sort(comparePostDates),
  ["blog-summaries-v1"], { tags: ["blog"] }
);
export const getPostBySlug = unstable_cache(
  async (slug: string) => { /* findUnique + full mapper */ },
  ["blog-post-v1"], { tags: ["blog"] }
);
```

`blogListSelect` chỉ slug/title/titleVi/excerpt/excerptVi/date/category/tags/readTime; `comparePostDates` giữ thứ tự hiện tại, date lỗi không crash. `getAllCategories/getAllTags/getPostsByCategory/getPostsByTag` dùng metadata list nếu consumer chỉ list; grep mọi consumer `getAllPosts`, full API còn cần phải cache cùng tag. `generateStaticParams` dùng summary slug.

Assertion mẫu cho test mapper (fixture `row` đủ các trường list và cố tình có body để bắt lỗi spread):

```ts
expect(toBlogListItem(row)).toMatchObject({ slug: row.slug, title: row.title });
expect(toBlogListItem(row)).not.toHaveProperty("content");
expect(toBlogListItem(row)).not.toHaveProperty("content_vi");
```
- [ ] Chuyển Prisma CMS writes từ hai route vào `blog.ts`, giữ `requireAdminSession` đầu route, `revalidateTag("blog")` sau write thành công cho cả create/update/delete. Admin list bỏ cả EN và VI body; editor GET full giữ nguyên. Client props list/preview dùng DTO mới.
- [ ] Test trên production build + test DB: warm `/blog`, `/blog/<slug>`, `/`; create/update/delete qua authenticated API fixture rồi reload cả ba, kiểm tra category/title/body mới và slug tạo sau build truy cập được. Không chỉ test dev/HMR. Inspect RSC/list props không có MDX EN/VI. Target tests và tsc/lint pass.
- [ ] **Commit:** `fix: cache blog reads and limit list payloads`, trailer Global Constraints.

### Task 4: Validation upload dùng chung (F3)

**Files:** Modify `src/app/api/admin/photography/upload/route.ts:11–61`, `src/app/api/music/upload/route.ts:11–69`; Create `src/lib/upload-validation.ts`, `src/lib/upload-validation.test.ts`, `src/lib/upload-routes.test.ts`.

**Interfaces:** `validateUpload(file: File, kind: "photo"|"video"|"audio"|"thumbnail"): Promise<ValidatedUpload>` trả `{buffer: Buffer,mimeType:string,extension:string}`; `parsePhotoSubType(value: unknown, isBefore:boolean, isVideo:boolean): "processed"|"raw"|"video"`; `UploadValidationError` có status `400|413|415`. File/type/size check trước buffer, signature check sau bounded read.

- [ ] Viết `rejects_size_limit_plus_one`, `accepts_exact_limit`, `rejects_zero_bytes`, `rejects_mime_extension_mismatch`, `rejects_forged_signature`, `rejects_path_subtype`, `accepts_heic_signature`, `rejects_svg`, `validates_all_parts_before_upload`, `does_not_leak_provider_error`, `auth_precedes_body`. File mock dùng bytes signature thật nhỏ; `arrayBuffer` spy không được gọi khi size quá. Chạy `npm test -- src/lib/upload-validation.test.ts src/lib/upload-routes.test.ts` → đỏ.
- [ ] Helper allowlist: JPEG `.jpg/.jpeg`, PNG `.png`, WebP `.webp`, GIF `.gif`, HEIC/HEIF `.heic/.heif` với MIME tương ứng; video MP4/M4V (`video/mp4`), WebM, MOV (`video/quicktime`); audio MP3 (`audio/mpeg`), WAV (`audio/wav` hoặc `audio/x-wav`), M4A (`audio/mp4`), OGG, FLAC. Signature/container kiểm tra tương ứng, không chỉ tin `file.type`; HEIC dùng ftyp brand. Giữ converter hiện có trong media service; không đổi public ID bằng tên file tự do.

Assertion test biên phải ghim giá trị cụ thể, không chỉ `toThrow()` bất kỳ:

```ts
await expect(validateUpload(oversizedPhoto, "photo")).rejects.toMatchObject({ status: 413 });
expect(readArrayBufferSpy).not.toHaveBeenCalled(); // oversizedPhoto.size = 10 * 1024 * 1024 + 1
expect(() => parsePhotoSubType("../../secret", false, false)).toThrow();
```
- [ ] Áp image 10 MiB, thumb 5 MiB, audio/video 50 MiB, tổng body 60 MiB; cap body stream trước `formData` để chunked/missing Content-Length vẫn có cap, `Content-Length` chỉ early rejection. Deploy ingress cap phải kiểm tra thực tế và lấy min với app cap; không thêm direct-to-cloud upload ở task này. Enum subtype reject string lạ, không sanitize bằng cách giữ path; MIME rỗng trả 415.
- [ ] Routes auth trước parse; music validate cả audio+thumbnail trước upload; dùng `unknown` catch, `UploadValidationError` trả status cụ thể; lỗi provider trả `{error:"Upload failed"}` 500, log server không đưa credentials/raw message về client. Test route với mocked service, upstream không nhận file invalid; manual 413 ingress bằng fixture trong môi trường được phép.
- [ ] Chạy target tests, tsc/lint; **Commit:** `fix: validate upload size type and subtype`, trailer Global Constraints.

### Task 5: Music input và tách play event khỏi GET (F5, F6)

**Files:** Modify `src/app/api/music/tracks/route.ts`, `src/app/api/music/tracks/[id]/route.ts`, `src/context/MusicContext.tsx:698–708`, `src/lib/rate-limit.ts` nếu bổ sung retry contract; Create `src/app/api/music/tracks/[id]/play/route.ts`, `src/lib/music-schema.ts`, `src/lib/music-schema.test.ts`, `src/lib/music-routes.test.ts`.

**Interfaces:** `createTrackSchema`, `patchTrackSchema` zod; `POST /api/music/tracks/[id]/play` trả 204 khi increment, 404 unpublished/missing, 429 + Retry-After, 403 cross-origin. GET detail không mutation.

Contract assertions viết trước (fixture `validTrack` chỉ chứa các trường schema):

```ts
expect(createTrackSchema.safeParse({ ...validTrack, duration: NaN }).success).toBe(false);
expect(createTrackSchema.safeParse({ ...validTrack, audioUrl: "javascript:alert(1)" }).success).toBe(false);
expect(patchTrackSchema.safeParse({}).success).toBe(false);
expect(patchTrackSchema.parse({ duration: 0 })).toEqual({ duration: 0 });
```

- [ ] Viết trước `rejects_nan_infinite_negative_duration`, `rejects_non_https_urls`, `rejects_wrong_boolean_and_unknown_keys`, `rejects_empty_patch`, `preserves_zero_duration_and_order`; routes `get_never_increments`, `unpublished_is_404_for_get_and_play`, `play_is_atomic_and_limited`, `patch_only_p2025_is_404`, `invalid_json_is_400`. Chạy `npm test -- src/lib/music-schema.test.ts src/lib/music-routes.test.ts` → đỏ.
- [ ] Schema `.strict()`: title/artist trim nonempty max 200; album/genre max 200 nullable; duration `z.number().finite().nonnegative()`, order integer ≥0; URLs HTTPS via `new URL(...).protocol`, thumbnail nullable; published boolean. Create defaults duration/order 0, published true; PATCH `.partial()` nhưng object không rỗng và không nhận field id/playCount. Không `Number()` tùy tiện; UI gửi number hợp lệ.
- [ ] GET `findFirst({where:{id,published:true}})`; catch DB outage 500. POST play same-origin kiểm tra Origin với request URL (chấp nhận same-origin fetch không Origin theo Fetch Metadata, reject cross-site); limiter 10/phút/IP+track, không tin IP trái nhất; atomic `updateMany({where:{id,published:true},data:{playCount:{increment:1}}})`, count 0→404. Giữ limitation per instance ghi rõ cho tới 8b.
- [ ] MusicContext đổi fetch sang `{method:"POST"}` endpoint play trong playback event hiện có, giữ once-per-load ref; không increment khi GET/prefetch. Invalid input→400, P2025→404, P2002→409, khác→500; `requireAdminSession` trước POST/PATCH/DELETE writes. Test playback pause/resume không spam, UI music giữ nguyên.
- [ ] Target tests + tsc/lint và U đối chiếu `/music` dark-only; **Commit:** `fix: validate tracks and record plays via post`, trailer Global Constraints.

### Task 6: Chính sách MDX trước compile (F8)

**Files:** Modify `src/app/blog/[slug]/page.tsx:133–154`, `src/lib/blog.ts` (validate write), hai admin blog routes (map lỗi policy 400); Create `src/lib/mdx-policy.ts`, `src/lib/mdx-policy.test.ts`; Modify `package.json`, `package-lock.json` chỉ nếu cần khai báo parser/AST package đang là transitive dependency.

**Interfaces:** `remarkRestrictMdx(options: {allowedComponents: readonly string[]})` plugin, `validateMdxSource(source:string): Promise<void>` dùng cùng parser/policy; policy không import DB.

- [ ] **Sanity check:** `rg -n 'import |export |<[A-Z]|\{.*\}' content/blog -g '*.mdx'`; phân biệt code fence/AST; không xin allowlist. Đã chốt `allowedComponents: []`, từ chối mọi JSX, không nới policy theo kết quả grep.
- [ ] Viết `rejects_esm`, `rejects_flow_and_text_expression`, `rejects_all_jsx_including_html_fragment_and_nested_nodes`, `rejects_unsafe_url`, `accepts_markdown_highlight_and_slug`, `accepts_jsx_inside_code_fence`; chạy compiler thật với plugin trong test, assert malicious fixture bị throw trước render, không thực thi payload. `npm test -- src/lib/mdx-policy.test.ts` → đỏ.
- [ ] Duyệt AST recursive trước compilation: reject `mdxjsEsm`, `mdxFlowExpression`, `mdxTextExpression`; reject mọi `mdxJsxFlowElement`/`mdxJsxTextElement` kể cả component, HTML, fragment và literal attributes; reject nguy hiểm cả link/image URL. Ví dụ logic trọng yếu:

```ts
if (blockedNodeTypes.has(node.type)) throw new MdxPolicyError(node.type);
// blockedNodeTypes gồm cả hai loại JSX; duyệt recursive, allowlist luôn rỗng.
```

- [ ] Gắn `remarkPlugins` vào **cả hai** MDXRemote EN/VI, giữ rehypeHighlight/Slug và merge className. Dùng cùng policy ở create/update trước DB write; existing invalid content hiển thị lỗi an toàn không execute, editor báo cụ thể vị trí nhưng không lộ stack. Chạy target tests + build fixture trên test DB; **Commit:** `fix: restrict executable mdx syntax`, trailer Global Constraints.

### Task 7: Security headers và CSP report-only (F4)

**Files:** Modify `next.config.js`, `src/app/layout.tsx:95–124`; Create `src/lib/theme-init.ts`, `src/lib/theme-init.test.ts`, `src/lib/security-headers.test.ts`.

**Interfaces:** buildThemeInitScript(prefixes: readonly string[]): string trong src/lib/theme-init.ts, layout gọi với EXCLUDED_ROUTE_PREFIXES. next.config.js tạo CSP report-only với script-src self + sha256 hash của đúng bytes THEME_INIT_SCRIPT do helper tạo; không require TS trực tiếp, test chống drift config/layout. Không nonce, không headers() trong layout, không sửa middleware; giữ static rendering.

- [ ] Test trước `theme_script_matches_excluded_prefix_boundary`, `theme_script_survives_storage_error`, `theme_hash_matches_emitted_script`, `headers_deny_frames_and_nosniff`, `hsts_only_production_https_policy`. VM DOM mocks kiểm tra `/admin`, `/admin/x`, `/administrator`, `/music`, `/couple`, saved light/system dark; đồng bộ ThemeContext. `npm test -- src/lib/theme-init.test.ts src/lib/security-headers.test.ts` → đỏ cho exports mới.
- [ ] `headers()` source `/:path*`: XFO DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS production HTTPS max-age 31536000; kiểm tra response headers trước khi thêm vì Vercel có thể đã gửi HSTS cho domain nền tảng, tránh trùng; CSP tối thiểu enforcing `frame-ancestors 'none'` riêng, policy đầy đủ `Content-Security-Policy-Report-Only` với `default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Thêm directive cụ thể cho nguồn thực tế; không thêm Resend client.
- [ ] Tính sha256 từ đúng bytes THEME_INIT_SCRIPT do buildThemeInitScript tạo và so với script emit trong production HTML. Chỉ thêm hash vào script-src CSP report-only; inventory inline Next/RSC và ghi legitimate violations, không tuyên bố hash theme bao phủ framework scripts. Không mở matcher middleware, không nonce/request CSP, không đổi static/ISR sang dynamic.
- [ ] `npm run build` + `npm run start`, `curl.exe -I http://localhost:3000/`; kỳ vọng headers có mặt (HSTS tùy env), không dùng dev CSP làm production result. Browser smoke dark/light trước paint, Cloudinary ảnh/audio/video, CV iframe từ nguồn thật, WebGL/reduced motion, `/blog` code highlight, admin login; frame-ancestors ngăn site bị embed, không đồng nghĩa cấm CV frame bên trong. Ghi legitimate violations để Task 20 xử lý, giữ report-only theo quyết định đã chốt.
- [ ] Target tests + tsc/lint; **Commit:** `security: add headers and report only csp`, trailer Global Constraints.

### Task 8: Typed fallback và test logic nền (F9, Q4), đóng Phase 1 core

**Files:** Modify `src/app/layout.tsx:33,113–116`, `src/lib/content/site-config.ts:9–80`; Create `src/lib/site-config-fallback.ts`, `site-config-fallback.test.ts`, `content-overrides.test.ts`, `session-token.test.ts`, `rate-limit.test.ts`; Modify `src/lib/session-token.ts:59–68` nếu parser test fail; read `src/lib/content-overrides.ts`, `src/lib/rate-limit.ts`, `src/lib/seo.ts`.

**Interfaces:** `getFallbackSiteConfig(): SiteConfig` thuần, reuse existing defaults qua mapper chung; không ghi DB/cached fake success. `signToken/verifyToken` giữ Web Crypto dùng Node/Edge.

- [ ] Test trước fallback `complete_author_and_safe_metadata_when_db_fails`, không `t/d/n/a/localhost` giả. Token `round_trips_payload`, `rejects_wrong_secret_tamper_bad_hex_extra_segments`, `does_not_validate_expiry_itself` (caller chịu expiry). Limiter fake clock `blocks_after_max`, `resets_after_window`, `isolates_keys`, `clear_restores`, `uses_last_forwarded_ip_or_unknown`; ghim boundary hiện tại `now > resetAt` để không đổi vô tình. Overrides `unset_uses_locale_default`, `blank_hides_optional`, `blank_required_uses_default`, `vi_section_does_not_leak_en_override`, `site_field_vi_blank_falls_back_en`, `unknown_category_and_read_time_preserved`.
- [ ] `npm test -- src/lib/site-config-fallback.test.ts src/lib/session-token.test.ts src/lib/rate-limit.test.ts src/lib/content-overrides.test.ts` → đỏ cho helper mới; characterization hiện đúng có thể xanh trước, ghi rõ test parser nào fail thật, không tạo fail giả.
- [ ] Trích default/mapper typed để content layer và fallback dùng chung không import Prisma runtime trong pure helper; root catches typed arrays `NavLink[]/SocialLink[]`, fallback config hoàn chỉnh. Metadata optional giữ `buildMetadata` semantics. Log outage server; catch ngoài cache, không cache dummy. Parser token reject số segment khác 2 nếu test mới phát hiện, không thay crypto algorithm.
- [ ] Chạy G, smoke DB lỗi không metadata giả/crash (mock/offline test, không ngắt production). PR `feature/portfolio-security` → `develop`, nêu report-only và Task 8b bắt buộc tiếp theo. **Commit:** `fix: use typed config fallbacks and test core helpers`, trailer Global Constraints.

### Task 8b: Login scrypt, giữ limiter/session hiện có — F7 vô điều kiện

**Files:** Modify `src/app/api/admin/auth/route.ts`, `src/app/admin/login/page.tsx`, `src/lib/admin-auth.ts`, `.env.example`, `docs/DEPLOYMENT.md`; Create `src/lib/admin-password.ts`, `admin-password.test.ts`, `src/lib/login-schema.ts`, `login-schema.test.ts`, `src/lib/admin-auth.test.ts`. Read session-token/rate-limit/middleware, giữ primitive hiện có. Không store/schema/dependency mới.

**Interfaces:** `verifyAdminPassword(password:string):Promise<boolean>` dùng `crypto.scrypt`, env `ADMIN_PASSWORD_SCRYPT` format `scrypt$<16-byte salt hex>$<64-byte key hex>`, N=16384/r=8/p=1. `loginSchema` strict chỉ `{password:string}` không rỗng. Giữ HMAC session 24 giờ bằng AUTH_SECRET và cookie flags hiện có.

- [ ] Test trước `accepts_correct_salted_scrypt_password`, `rejects_wrong_password`, `missing_or_malformed_hash_fails_closed`, `different_salts_produce_different_hashes`, `rejects_old_passwordHash_even_with_password`, `rejects_blank_or_non_string_password`. Route mocks: sai 401/recordAttempt, đúng clearAttempts/createSession, quota 5 sai/15 phút 429. `npm test -- src/lib/admin-password.test.ts src/lib/login-schema.test.ts src/lib/admin-auth.test.ts` đỏ → implementation → xanh; token/expiry dùng tests Task 8. Không thêm tests shared multi-instance/revocation; bỏ các case này khỏi phạm vi test F7 cũ.
- [ ] Bỏ hashPassword/SHA-256 client, RHF + zod/resolver POST password qua HTTPS; parse strict server, scrypt + timingSafeEqual với key cùng độ dài. Từ chối passwordHash, không fallback ADMIN_PASSWORD; không log body/password/hash/token. Không thay limiter/HMAC/logout bằng store hay opaque session.
- [ ] `.env.example` chỉ placeholder `ADMIN_PASSWORD_SCRYPT=`; docs ghi format/tham số và lệnh local một lần dưới đây (chỉ hướng dẫn implementation tương lai, không chạy ở lượt sửa tài liệu). Nhập password ẩn, không password literal trong history:

```powershell
$credential = Get-Credential -UserName admin -Message 'Mat khau admin de tao scrypt hash'
$env:PORTFOLIO_PASSWORD_ONCE = $credential.GetNetworkCredential().Password
node -e 'const {randomBytes,scrypt}=require("node:crypto");const salt=randomBytes(16);scrypt(process.env.PORTFOLIO_PASSWORD_ONCE,salt,64,{N:16384,r:8,p:1},(err,key)=>{if(err)throw err;console.log(["scrypt",salt.toString("hex"),key.toString("hex")].join("$"));});'
Remove-Item Env:PORTFOLIO_PASSWORD_ONCE
```

- [ ] Output chỉ vào env local/deployment, không repo; xoá ADMIN_PASSWORD deployment khi env mới sẵn sàng. Docs ghi limiter không cộng dồn qua instance/cold start và không revoke server token sao chép trước expiry; logout chỉ xoá cookie. Không Redis/Upstash/store/schema/dependency mới.
- [ ] Target tests + G/U login dark-only; PR riêng `feature/portfolio-auth` → develop, env/rollback không secrets. **Commit:** `security: verify admin passwords with salted scrypt`, trailer Global Constraints.

## Phase 2 — Performance không đổi giao diện

### Task 9: Chỉ load dictionary đang dùng (P1)

**Files:** Modify `src/locales/index.ts:1–26`, `src/context/LanguageContext.tsx:57–138`; Create `src/lib/locale-loader.ts`, `src/lib/locale-loader.test.ts`; read `src/locales/en.ts`, `vi.ts`.

**Interfaces:** loadDictionary(locale: Locale): Promise<TranslationDict> trả EN import tĩnh hoặc VI qua import(); Provider vẫn chỉ nhận children, SSR defaultLocale EN; setLocale(locale): Promise<void> (caller không cần await vẫn hợp lệ); giữ t(...), t.hero, isMounted, refreshOverrides. Không initialDictionary prop từ server.

- [ ] Tests trước `loads_vi_only_when_selected`, `latest_switch_wins_when_promises_reverse`, `failed_load_preserves_previous_dictionary`, `interpolation_and_explicit_fallback`, `property_and_function_access_agree`. `npm test -- src/lib/locale-loader.test.ts` → đỏ; mock import loaders đếm EN/VI calls, không import cả hai như fixture runtime.
- [ ] Index giữ EN import tĩnh làm default/SSR dictionary và type/locale metadata; VI qua dynamic import, không re-export VI runtime tĩnh. Giữ flow client: SSR EN, sau mount đọc localStorage/browser detection rồi chỉ load VI nếu được chọn. Không cookies()/headers() trong layout, không blank SSR chờ effect.
- [ ] Mount/switch dùng chung loader và generation ref: preload trước publish locale/dictionary, response cũ không đè lựa chọn mới; failure giữ dict/locale cũ và báo trạng thái accessible. Giữ localStorage và cookie write hiện tại ở LanguageContext, cập nhật html lang sau load thành công; không router.refresh(). Giữ interpolation/fallback hiện có và t Proxy property lookup typed, không any; hai API dùng cùng dictionary.
- [ ] Build/network audit `/`, `/blog`, `/music`: initial EN không chứa VI dictionary chunk; VI chỉ tải khi được chọn lúc mount/switch, EN vẫn là dictionary SSR tĩnh. Switch không reload hay làm trắng UI; giữ EN/VI hiện tại và static rendering. Target tests + U pass; **Commit:** `perf: load active locale dictionary on demand`, trailer Global Constraints.

### Task 10: Tách icon registries theo consumer (P2)

**Files:** Modify `src/components/ui/Icon.tsx:13–373`, `src/components/ui/index.ts`, `src/components/ui/Navigation.tsx`, `src/components/ui/Footer.tsx`, `src/components/sections/SkillsSection.tsx` (imports public); Create `src/components/ui/PublicIcon.tsx`, `src/components/ui/icons/public.tsx`, `src/components/ui/icons/admin.tsx`, `src/components/ui/icons/music.tsx`, `src/components/ui/icons/brands.tsx`, `src/lib/icon-names.ts`, `src/lib/icon-names.test.ts`. Modify `src/components/admin/IconPickerModal.tsx` chỉ đổi import registry admin, không style.

**Interfaces:** giữ `Icon({name,size,className,filled})`, `isKnownIconName`, TECH/SOCIAL name lists; tên lạ có fallback hiện tại, name metadata không import component registry. `PublicIcon` synchronous, không hook/`use client`, chỉ direct named imports từ tập public hữu hạn. `Icon.tsx` là compatibility client island lazy cho name CMS/admin/music, không statically import registry lớn; component server (nếu có) vẫn render được island con mà không trở thành client component.

- [ ] Tests `aliases_remain_known`, `empty_unknown_names_false`, `tech_social_lists_preserved`, `public_name_module_has_no_runtime_registry_dependency` (test contract resolver bằng mock module); `npm test -- src/lib/icon-names.test.ts` đỏ trước tách helper. Inventory mọi name literal và name CMS; không bỏ icon chỉ vì grep không thấy tên dynamic.
- [ ] Tách metadata tên khỏi lucide/brand JSX registry; `PublicIcon.tsx` dùng synchronous public registry/direct named imports, không import compatibility Icon. Navigation/Footer đổi sang PublicIcon cho tên cố định; skill/social name động dùng Icon island hoặc URL image, chỉ lazy import đúng registry do `icon-names.ts` phân loại. `Icon.tsx` thêm `use client`, dynamic loader registry admin/music/brand và fallback slot có width/height cố định; không kéo hook vào PublicIcon. IconPicker đọc metadata names thuần, registry admin chỉ load khi mở picker. Không re-export mọi registry qua public barrel; URL skill/social icons giữ alt/size. Khi Tasks 14–19 tách heavy islands, tên icon cố định dùng PublicIcon trực tiếp.
- [ ] So `.next/static/chunks` và browser network trước/sau cùng build: public initial/shared JS không kéo toàn bộ admin/music registries; icon không flash sai hoặc biến mất ở admin/music/project modal. Target tests, tsc/lint và U pass; **Commit:** `perf: split icon registries by consumer`, trailer Global Constraints.

### Task 11: Priority image và lifecycle WebGL (P3, P4, Q4), đóng Phase 2

**Files:** Modify `src/components/ui/ImageWithSkeleton.tsx:71–103`, `src/components/photography/AlbumDetailView.tsx:77–82`, `src/components/3d/blackhole/engine.ts:504–520`, `src/components/3d/blackhole/BlackHoleCanvas.tsx:62–169`; Create `src/lib/cloudinary-image-loader.test.ts`, `src/lib/seo.test.ts`; Modify `src/lib/cloudinary-image-loader.ts`, `src/lib/seo.ts` chỉ nếu test phát hiện lỗi đúng phạm vi.

**Interfaces:** giữ image props, `dispose():void` idempotent, black hole props; loader `insertCloudinaryTransform`, `buildMetadata`, `toOgImage` giữ API.

- [ ] Test trước `inserts_transform_after_upload_marker`, `keeps_non_cloudinary_url_unchanged`, `preserves_version_and_query`, `unsplash_width_quality`, `omits_blank_metadata`, `og_image_has_1200_630_only_when_transformed`, `canonical_and_article_type_preserved`; `npm test -- src/lib/cloudinary-image-loader.test.ts src/lib/seo.test.ts` characterization có thể xanh, sửa behavior chỉ với regression đỏ thật.
- [ ] Priority image dùng opacity hiện ngay (`priority || isLoaded`), không shimmer/placeholder phủ priority. Tôn trọng `alt=""` trang trí thay `alt || "Image"`. Album blurred cover thêm `sizes="100vw"`, bỏ `priority` vì trang trí; ảnh nội dung LCP thật mới priority khi đo xác nhận. Không thay mọi ảnh lazy thành eager.
- [ ] Engine cleanup thứ tự: mark disposed → cancel RAF/listener/observer → dispose GPU resources → `renderer.dispose()` → `renderer.forceContextLoss()`. Hủy cả RAF scroll đang pending trong Canvas (giữ ID), deferred callbacks không khởi tạo lại engine đã disposed; forceContextLoss chỉ renderer cũ. Không tạo renderer mới/R3F Canvas.
- [ ] Browser cold-load/no-JS priority ảnh hiện khi decoded, cache-hit và lỗi ảnh không stuck; mount/unmount/theme switch/home↔404 ≥10 lần, không tăng WebGL contexts/listener, console không render vào context disposed. Đo LCP và initial transfer cùng điều kiện trước/sau, không hứa Lighthouse score thiếu baseline.
- [ ] G + U không đổi giao diện, PR `feature/portfolio-performance` → `develop`. **Commit:** `perf: reveal priority images and release webgl contexts`, trailer Global Constraints.

## Phase 3 — Nền tảng thiết kế và hero prototype

### Task 12: Token/font/UI opt-in, Navigation và Footer (P7, UI contrast/targets)

**Files:** Modify `src/app/globals.css:31–70,110–112,231–234`, `src/app/layout.tsx:22–31,119–133`, `src/components/ui/Button.tsx`, `Navigation.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `LanguageSwitcher.tsx`, `src/locales/en.ts`, `src/locales/vi.ts`; Create `src/lib/navigation-section.ts`, `navigation-section.test.ts`, `src/components/ui/SectionHeading.tsx`, `src/lib/motion-math.ts`, `motion-math.test.ts`; Modify `src/lib/animations.ts`. Modify `src/components/layout/GlobalBackground.tsx` chỉ ở Task 13. Read `PhotoLightboxModal.tsx` inheritance trước chốt scope.

**Interfaces:** restyle trực tiếp Button/Navigation/ThemeToggle, không appearance prop. Chỉ LanguageSwitcher thêm `appearance?: "legacy" | "portfolio"`, default legacy; Navigation truyền portfolio. Đã đọc source: Button chỉ dùng ở HeroSection, ContactSection, ProjectsSection và ProjectsGallery (/projects), đều public. Root layout mount Navigation nhưng Navigation.tsx:240–246 return null trên admin/music/couple; ThemeToggle chỉ render trong Navigation. LanguageSwitcher còn render tại src/app/admin/layout.tsx, src/app/admin/login/page.tsx, src/app/couple/page.tsx, src/components/music/MusicSidebar.tsx nên giữ opt-in để bảo toàn legacy. getSectionNavTarget(sectionId:string):string map photos/blog→hobby, không suy từ nhãn dịch. portfolio-theme wrapper và --portfolio-* tokens không đổi :root legacy.

- [ ] Test trước `photos_and_blog_map_to_hobby`, `projects_stays_projects`, `empty_hidden_sections_skipped`, `hobby_parent_active_from_child_href`; `npm test -- src/lib/navigation-section.test.ts` → đỏ. Baseline U gồm font/focus của dark-only và lightbox để bắt inherited regressions.
- [ ] Thêm semantic variables Void/Hull/Ink/Dust/Accretion/Hairline đúng bảng **direction:37–44**, scale chữ/layout theo **:50–58**, không tạo bảng token khác. Map `@theme inline` thành `bg-portfolio-void`, `text-portfolio-ink`, `border-portfolio-control`; control border có biến đậm riêng đo ≥3:1, không dùng Hairline divider làm input border.
- [ ] Load `Be_Vietnam_Pro` subsets `["latin","vietnamese"]`, weights 400/500/600/700/800, variable `--font-be-vietnam-pro`; chỉ apply font-sans mới trong public portfolio scope, giữ Inter/Space Grotesk và legacy mapping cho excluded/lightbox. Không đổi body font toàn app; nếu scope ancestor bọc lightbox portal thì restore legacy font/token rõ ràng. Font loading không được làm đổi screenshot dark-only.
- [ ] Button restyle trực tiếp (không appearance prop): Accretion solid + foreground đo đạt, outline/control radius 8px, focus ring 2px offset 2px; thêm light class tương ứng bên cạnh dark. Thay transition-all bằng transition-colors/opacity/transform cần thiết. Text/button contrast ≥4.5:1 ở hai theme, state hover/focus/error/loading đo riêng; Hairline divider không bị nhầm control.
- [ ] Navigation: solid Void sau scroll, active underline Accretion, không gradient pill; scroll list gồm `photos` và `blog`, mapping active Hobby qua nav children `/photography`/`/blog`, giữ links CMS. ThemeToggle restyle trực tiếp, LanguageSwitcher opt-in portfolio `min-w-11 min-h-11`; Footer bỏ rendered bio, tên/links/social ≥44×44, không glow/gradient. Không xóa dữ liệu bio DB. Locale keys mới như nav.hobby thêm EN/VI đồng thời; không sửa copy CMS.
- [ ] Create `src/components/ui/SectionHeading.tsx`: `SectionHeading({children,id?})`, star ignition chấm Accretion + SVG aria-hidden orbit arc stroke-dashoffset một lần; text SSR luôn hiện. Modify `src/lib/animations.ts` cho variants chung, dùng ở Task 14–19.
- [ ] Navigation logo TH có orbit ring theo scroll-progress qua ref; active underline trượt bằng layoutId (source hiện activeNavTab là pill). Footer one-shot shooting star; button/link hover viền Accretion 150 ms, press scale 0.98; pause off-screen/tab ẩn, reduced motion final ngay.
- [ ] Create `src/lib/motion-math.ts` và `motion-math.test.ts`; TDD `mapScrollProgress(scrollY:number,maxScroll:number):number`: `clamps_to_zero_one`, `zero_range_returns_zero`, `half_scroll_returns_half`. `npm test -- src/lib/motion-math.test.ts` đỏ → implement → xanh. U keyboard, reduced motion, one-shot không lặp khi cuộn ngược.
- [ ] U gồm `/projects` kiểm Button trong ProjectsGallery; photos/blog highlight Hobby, menu Escape/focus return, theme/storage trước paint, font dấu VI không fallback, screenshot dark-only nguyên vẹn; target tests + G pass. **Commit:** `feat: add scoped portfolio design foundations`, trailer Global Constraints.

### Task 13: Hero prototype và cổng duyệt bắt buộc (P6, hero P5)

**Files:** Modify `src/components/sections/HeroSection.tsx:28–178`, `src/app/page.tsx:64–72`, `src/components/layout/GlobalBackground.tsx`, `src/components/3d/StarryBackground3D.tsx`, `src/components/3d/SceneContainer.tsx`, `src/components/3d/blackhole/BlackHoleCanvas.tsx`, `src/components/ui/AnimatedSection.tsx`, `src/lib/animations.ts`, `src/locales/en.ts`, `src/locales/vi.ts`; Create `src/components/sections/HeroCanvas.tsx`, `HeroActions.tsx`; Modify `src/app/globals.css` chỉ utility scope portfolio.

**Interfaces:** HeroSection({siteConfig}) giữ use client để đọc locale context Task 9, không props locale/dictionary; HeroCanvas client giữ dynamic BlackHoleCanvas; HeroActions client chứa CV state/modal, CTA dự án native `<a href="#projects">`; giữ home anchor/resumeUrl. AnimatedSection thêm opt-in progressive?: boolean, default legacy cho consumer ngoài overhaul.

- [ ] Dựng prototype đúng direction **:57–79**: full author name thay split firstName, role + context thật có sẵn, bỏ bio dài khỏi hero, không hardcode công ty nếu field hiện tại không có. Dùng copy đã duyệt §1–2; sau UI nhập `/admin` site config title/titleVi, description/descriptionVi, authorName/title/location EN/VI và hero sectionsContent. Chức danh Frontend Software Engineer; defaults en.ts/vi.ts, không script DB. Giữ text trong HTML SSR EN của client component, không đợi `isMounted` mới hiện.
- [ ] Canvas/scrim đổi từ `fixed inset-0` sang `absolute` trong hero `relative isolate overflow-hidden`; desktop lệch phải chữ trái, mobile trên/sau tên + scrim dưới. Giữ homepage StarryBackground3D qua SceneContainer sau hero, không Canvas root mới, ba lớp parallax mật độ/độ sáng thấp: scroll listener ghi ref, useFrame đọc ref; route khác giữ behavior. Starfield không hiện qua hero; khi bị hero che, off-screen hoặc tab ẩn phải pause loop (fixed wrapper không tự được IntersectionObserver coi là khuất). Hiện source dùng still trên `/`, light là gradient fallback; prototype thay riêng homepage bằng chấm Ink nhạt hoặc tắt, chốt ở Task 13. Section phủ Void 88–92%, đo contrast composite. Dùng scrollEffect sẵn có cho hero → About thu nhỏ/mờ, không pin hero; source hiện chỉ map camera theo toàn trang, nên giới hạn mapping theo hero và thêm wrapper transform/opacity qua ref, cleanup RAF/listener, không giả định prop tự fade. Section phía sau có backdrop Void bán đặc 88–92% wrapper, không nhân rộng card/heading mới trước gate; bỏ spacer `h-48`.
- [ ] Hero text/CTAs SSR opacity 1, không CSS `animation-fill-mode:both` làm invisible; CSS keyframes event horizon trước hydrate: black hole bung sáng từ điểm, tên blur ngắn → nét/scale 0.98→1, role/CTA nối tiếp; tổng ≤1.2 s, CTA <1 s. Base/final CSS đọc được no-JS, không chờ mount/WebGL; reduced motion final ngay. Shared AnimatedSection progressive dùng `initial={false}` và không animate hidden trước in-view; variants nằm `animations.ts`; không sửa behavior legacy vô tình. Reduced-motion dùng static canvas fallback, không mất chữ nếu shader lỗi.
- [ ] G + U, no-JS trước first paint và Slow 3G: tên/vai trò/hai CTA (khi resume có dữ liệu) trong fold 390×844/1280×800, CV Escape/focus return, project link native dùng được. Đo contrast trên frame black hole sáng nhất và scrim thực; chụp bốn ảnh prototype dark/light và cả nội dung VI dài.
- [ ] **Cổng duyệt:** đưa prototype/ảnh và phương án light starfield (chấm Ink nhạt hoặc tắt) cho người dùng; copy đã duyệt không xin lại, ghi phê duyệt/phản hồi rõ trong PR/plan. Chưa duyệt thì dừng tại đây; không chạy Task 14–19, không xem CI pass là approval. Điều chỉnh prototype trong cùng task tới khi được duyệt; không mở lại quyết định giữ black hole. PR Phase 3 `feature/portfolio-hero` → `develop` có thể review độc lập; rollout chưa được phép trước approval.
- [ ] **Commit:** `feat: prototype scoped black hole hero`, trailer Global Constraints. Commit chỉ sau G/U, approval cần trước bước rollout tiếp theo.

## Phase 4 — Từng section sau khi hero được duyệt

Phụ thuộc: Task 13 có approval ghi nhận. Branch `feature/portfolio-sections` từ develop đã nhận Phase 3. Mỗi task giữ source content/locale override, background Void bán đặc 88–92% đã đo contrast, container max khoảng 1120px/lề mobile 16px, typography/spacing đúng direction; không dùng eyebrow, gradient-text, GlassCard/TiltCard hay glow trang trí. Scope classes dark + `light:` bổ sung, không sửa dark-only. Section đọc t(...)/CMS text theo locale giữ use client và context Task 9, không props locale/dictionary từ server. P5 tách heavy islands thành module riêng, dynamic import dưới fold khi phù hợp, bỏ whole-section Framer Motion wrappers. Chỉ section không render text phụ thuộc locale mới có thể thành server component. Section barrel giữ re-exports; page fetch data server và truyền props nội dung hiện có. Nghiệm thu: heavy islands tách riêng, client JS đo cho `/` không tăng.

### Task 14: About — facts thay card stats (P5)

**Files:** Modify `src/components/sections/AboutSection.tsx:15–114`, `src/app/page.tsx`, `src/components/sections/index.ts`, `src/locales/en.ts` và `vi.ts` (section defaults theo copy đã duyệt).

**Interfaces:** `AboutSection({siteConfig})` client đọc locale context; dùng `resolveSectionText/resolveStatValue`, không fetch DB trong client.

- [ ] Dùng đoạn bio hiện có được duyệt + facts có nguồn; hai cột desktop/1 mobile, heading sentence case Ink; bỏ gradient orb, GlassCard và stats card, `pb-60` thay spacing hệ direction. Dùng copy §3; sau UI nhập `/admin` authorBio/authorBioVi, about sectionsContent/facts thay stats không nguồn; defaults en.ts/vi.ts. Facts orbit-in theo cung nhẹ stagger 60 ms, one-shot; shared heading Task 12, reduced motion final.
- [ ] Giữ `use client`, bỏ motion whole section, chỉ dùng AnimatedSection progressive nếu cần enhancement; không chặn SSR. Blank override ẩn đúng phần, không tự lấy EN override đè VI.
- [ ] U: empty/blank fields, VI dài, đọc facts không trùng Hero/Footer, no-JS; `npx tsc --noEmit -p .`, `npm run lint`, `npm test` → pass. **Commit:** `feat: present about content as concise facts`, trailer Global Constraints.

### Task 15: Skills — bản đồ chòm sao (P5)

**Files:** Modify `src/components/sections/SkillsSection.tsx`, `src/app/page.tsx`, `src/components/sections/index.ts`, `src/locales/en.ts`, `vi.ts`, `src/lib/animations.ts`; Create `src/lib/constellation-layout.ts`, `constellation-layout.test.ts`.

**Interfaces:** `SkillsSection({skills,siteConfig})` client đọc locale context; giữ category keys `frontend/backend/tools/design` và icon name validation.

- [ ] Bỏ selectedCategory/useState/AnimatePresence, filter tabs 4 nhóm và skill cards/progress trang trí; render chòm sao theo nhóm, skill là sao có nhãn. Markup `<ul>` thật, SVG lines aria-hidden vẽ stroke-dashoffset một lần; hover/focus highlight sao và đường liên quan; <640px plain list chấm sao không vẽ đường. Nhóm rỗng ẩn, reduced motion final không drawing.
- [ ] Bỏ ambient gradient/uppercase eyebrow, text Ink/Dust; dùng public icon path Task 10, ảnh icon có alt theo tên hoặc decorative cạnh tên để tránh đọc lặp. Section giữ use client và hook locale, bỏ wrapper Framer Motion toàn section.
- [ ] Create `src/lib/constellation-layout.ts`, `constellation-layout.test.ts`; Modify `src/lib/animations.ts`. TDD `layoutConstellation(skills:readonly {id:string}[]):{nodes:{id:string,x:number,y:number}[],edges:[string,string][]}`: empty không nodes/edges, singleton không edges, deterministic/bounded viewBox 0–100, edges chỉ nối id tồn tại/khác nhau. `npm test -- src/lib/constellation-layout.test.ts` đỏ → implement → xanh; không random render/SSR.
- [ ] Sau UI nhập `/admin/skills` đủ content §4: frontend→Frontend, backend→Backend & data, tools gộp Quality + Tools, design rỗng; bỏ WordPress/PHP/Responsive Web Design, level không hiển thị. CmsSkill.category String nhưng type/admin hiện frontend/backend/tools/design: giữ mapping này, không schema change. Skills sectionsContent qua admin, labels/defaults en.ts/vi.ts.
- [ ] U 0/1/10 skills và unknown/URL icon, VI labels dài; tsc/lint/test pass. **Commit:** `feat: present skills as accessible constellations`, trailer Global Constraints.

### Task 16: Projects — hồ sơ dự án, full title, modal island (P5)

**Files:** Modify `src/components/sections/ProjectsSection.tsx:16–310`, `src/app/page.tsx`, `src/components/sections/index.ts`; Create `src/components/sections/ProjectDialog.tsx`; Modify `src/locales/en.ts`, `vi.ts` nếu cần accessible labels.

**Interfaces:** ProjectsSection({projects,siteConfig}) client đọc locale context; ProjectDialog client nhận `project`, localized labels và trigger children/ID, giữ Escape/trap/return focus; props data vẫn Project, không thêm field schema.

- [ ] Chuyển inline ProjectModal và open state vào module ProjectDialog riêng, dynamic import dưới fold khi phù hợp; bỏ wrapper Framer Motion toàn section; list SSR trong client section render full title `break-words`, bỏ `line-clamp-1`, rocket placeholder cả list và modal. Có ảnh thật thì render aspect ratio + sizes, không ảnh thì bỏ media column.
- [ ] Danh sách hồ sơ tên/bối cảnh/vai trò/stack/năm chỉ field hiện có, thiếu thì ẩn; featured theo CMS, Accretech lên đầu chỉ khi record thật xác nhận, không hardcode theo substring. Giữ links thật/modal/Xem tất cả và không dựng thành tích mới. CmsProject không có role/year: đặt đầu description/descriptionVi theo content §5, không schema mới. Sau UI nhập `/admin/projects` đủ Accretech, Zonenop Game mới, Personal portfolio mới, SUUTA, KMJ CMS Portal; featured ba đầu, links/tags/descriptions/longDescriptions EN/VI đúng copy, ảnh thật hoặc trống. Projects sectionsContent qua admin và defaults locales theo §6. Pointer lensing radial mờ qua CSS variables set bằng DOM ref, không re-render/tilt 3D; focus highlight tương đương, title dịch 4px.
- [ ] U 0/1/2/3 projects, title VI dài, no image/broken image, keyboard modal và external link; tsc/lint/test pass. **Commit:** `feat: show projects as readable case files`, trailer Global Constraints.

### Task 17: PhotoPreview — dải ảnh gọn và alt (P5)

**Files:** Modify `src/locales/en.ts`, `src/locales/vi.ts`, `src/components/sections/PhotoPreviewSection.tsx`, `src/app/page.tsx`, `src/components/sections/index.ts`, `src/components/ui/ImageWithSkeleton.tsx` chỉ nếu consumer alt cần sửa; read `src/components/photography/PhotoLightboxModal.tsx` (không restyle).

**Interfaces:** PhotoPreviewSection client đọc locale context, giữ `photography: PhotoItem[]`, `id="photos"`, `/photography`; không thay lightbox API.

- [ ] Thay carousel/state visited/autoplay/timer bằng dải 3–4 ảnh responsive (3–4 desktop, 1–2 mobile với horizontal native scroll nếu cần), aspect ratio cố định và `sizes` theo số cột; bỏ khối cao/thông tin lặp/caption overlay dư, heading Ink. 0 photos ẩn preview, 1/2 không nhân bản ảnh; không priority ảnh dưới fold.
- [ ] Photo strip parallax 8–24px qua ref cập nhật transform, không state mỗi frame; off-screen/tab ẩn dừng, reduced motion static. Sau UI nhập photo sectionsContent content §6 qua `/admin`; Modify thêm en.ts/vi.ts cho defaults.
- [ ] Kiểm kê rendered DOM homepage xác định đúng hai ảnh thiếu alt từ review, lưu selector/source trong PR. Ảnh nội dung alt theo title localized thật, trang trí alt rỗng được helper giữ nguyên; không dùng generic Image. Nếu consumer ngoài file liệt kê là nguồn finding, bổ sung chính xác path vào task trước sửa. Không thêm `light:` vào photo overlay hay lightbox.
- [ ] Bỏ wrapper Framer Motion toàn section và slider dots cùng carousel; nếu còn điều khiển trượt thì hit area ≥44×44, keyboard scroll dùng được. So chiều cao section trước/sau thay baseline 1193px, mobile tổng cao giảm có số đo, không cắt nội dung để đạt con số tùy ý.
- [ ] U + mở gallery/lightbox từ public light theme vẫn dark-only; tsc/lint/test pass. **Commit:** `feat: compact photography preview and preserve image semantics`, trailer Global Constraints.

### Task 18: BlogPreview — hàng metadata (P5)

**Files:** Modify `src/components/sections/BlogPreviewSection.tsx`, `src/app/page.tsx`, `src/components/sections/index.ts`, `src/locales/en.ts`, `vi.ts`, `src/components/blog/BlogList.tsx`, `src/app/blog/page.tsx`, `src/app/layout.tsx`, `src/lib/navigation-section.ts`, `navigation-section.test.ts`.

**Interfaces:** `filterBlogNavLinks(links: readonly NavLink[], hasPosts:boolean):NavLink[]` trong `src/lib/navigation-section.ts`, giữ nguyên input, lọc đệ quy link blog theo href, bỏ parent chỉ khi mất mọi child và không có destination dùng được; root layout dùng summaries cached Task 3. BlogPreviewSection client nhận `posts: BlogPostListItem[]`, đọc locale context; không content body; `id="blog"` và `/blog/[slug]` giữ.

- [ ] Bỏ wrapper Framer Motion toàn section; rỗng return null trước wrapper/heading. Render hàng date (`time dateTime`), full title link và readTime; bỏ GlassCard, gradient word/eyebrow và tag 10px; metadata tối thiểu scale direction. Dùng translateReadTime và localize title/VI fallback hiện tại; không thay query thành full body.
- [ ] Bài hiện có đã xác nhận demo. CmsBlogPost không có published flag: liệt kê slug read-only qua data layer, trình danh sách trong chat; chỉ sau người dùng xác nhận danh sách mới xoá qua `/admin/blog` (không hoàn tác), không script/DB delete trực tiếp. Không đoán slug hay xem quyết định demo là xác nhận xoá.
- [ ] Modify thêm `src/components/blog/BlogList.tsx`, `src/app/blog/page.tsx`, `src/app/layout.tsx`, `src/lib/navigation-section.ts`/test. `/blog` empty state No posts yet. / Chưa có bài viết. theo content §7 trong locale defaults. Đã đọc source: root layout lấy getPublishedNavLinks; nav-links.ts map CMS children, Navigation map props desktop/mobile, nên nav/Hobby là data-driven. Khi summaries rỗng lọc `/blog`/`#blog` khỏi nav/children và Footer cùng props; giữ Photos/Music/children khác, có bài lại hiện. Tests trước `empty_blog_hides_only_blog_links`, `nonempty_blog_preserves_links`, chạy navigation-section.test.ts đỏ → implementation → xanh; production CRUD smoke không stale nav.
- [ ] Sau UI nhập blog sectionsContent theo §6 qua admin; nếu sau này có bài, row one-shot sao băng ngắn dịch ngang/vệt mờ với shared variants, không che SSR, reduced motion final. Link Read Story nếu còn phải ≥4.5:1, nếu bỏ theo layout mới ghi tương đương title link trong contrast report.
- [ ] U 0/1/3 posts, ngày/readTime lạ, title dài, Hobby active; tsc/lint/test pass. **Commit:** `feat: render blog preview as metadata rows`, trailer Global Constraints.

### Task 19: Contact — email chính, form island (P5)

**Files:** Modify `src/components/sections/ContactSection.tsx`, `src/app/page.tsx`, `src/components/sections/index.ts`, `src/locales/en.ts`, `vi.ts`; Create `src/components/sections/ContactForm.tsx`, `CopyEmailButton.tsx`; Modify `src/components/3d/index.ts`; Delete `src/components/3d/ParticleField.tsx` sau kiểm tra importer; read `src/lib/contact-schema.ts`, `src/app/api/contact/route.ts` (giữ handler).

**Interfaces:** ContactSection({siteConfig}) client đọc locale context; ContactForm module client riêng nhận localized copy/validation; CopyEmailButton module client riêng nhận email + labels, clipboard failure có status. Form tiếp tục POST `/api/contact`, RHF/zod/resolver, honeypot và fallback mailto hiện có.

- [ ] Bỏ dynamic import/use ParticleField trong ContactSection. Grep source hiện chỉ Contact consumer và `src/components/3d/index.ts` re-export: Modify barrel bỏ export, grep lại không importer rồi Delete `src/components/3d/ParticleField.tsx`; thêm cả hai file vào phạm vi Task 19. Không Canvas thay thế.
- [ ] Signal rings khi pending, success lắng thành xác nhận chỉ sau response.ok; copy-email thành công phát vòng nhỏ. Một loop trong view ngoài black hole/starfield, pause hidden/off-screen; reduced motion final, aria-live không phụ thuộc animation. Sau UI nhập contact sectionsContent content §6 qua admin; labels/pending/success/error/copy defaults en.ts/vi.ts; không phone/ngày sinh.
- [ ] Email lớn + native mailto + copy target ≥44px, clipboard result aria-live; không báo copied khi clipboard fail. Form Hull đặc, control border token đậm ≥3:1, focus Accretion; giữ labels khi CMS blank bằng required fallback, aria-invalid/describedby và lỗi text ≥4.5:1. Không card glass/glow/gradient header; section giữ use client, bỏ wrapper Framer Motion toàn section; dynamic import ContactForm/CopyEmailButton dưới fold khi phù hợp.
- [ ] Giữ validation minimum hiện tại (name 2/email/subject 5/message 20) và onSubmit thật, pending disable/double-submit guard, success chỉ sau response.ok, error giữ input và mailto fallback. Shared schema nếu trích helper thuần phải test trước với tên `rejects_short_contact_fields`, `accepts_valid_contact_payload`, đặt `src/lib/contact-schema.test.ts` trước sửa `src/lib/contact-schema.ts`; không thay rule server ngoài phạm vi.
- [ ] Mock contact requests để test invalid/429/500/network/success, không email thật; U keyboard submit/focus/errors và copy, no-JS email dùng được. G + U toàn Phase 4; PR `feature/portfolio-sections` → `develop`, kèm approval hero và evidence nhập copy đã duyệt. **Commit:** `feat: prioritize email and clarify contact form states`, trailer Global Constraints.

## Phase 5 — Hồi quy, accessibility, docs và PR

### Task 20: Final verification và bàn giao (F10, Q4, toàn bộ UI/UX)

**Files:** Modify `CLAUDE.md:48–51,69–93`, `docs/HALLMARK_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/superpowers/specs/2026-11-06-portfolio-overhaul-design.md`, `docs/superpowers/plans/2026-11-06-portfolio-overhaul.md`; không promote CSP hay script DB. Branch `feature/portfolio-verification` từ develop.

**Interfaces:** đầu ra là evidence kiểm chứng + docs phản ánh hệ đã duyệt; ghi đúng hai giới hạn F7, CSP đầy đủ report-only và trạng thái xác nhận slug demo.

- [ ] Đối chiếu spec từng F/P/Q với task/evidence, tất cả pure tests Q4 đã có: token, limiter, overrides, loader, SEO, upload, music schema, blog mapper; test đang xanh không được thay bằng skip. Nếu lỗi mới thì regression test trước sửa đúng task/file, không blanket ignore.
- [ ] Chạy G trên checkout phase cuối với test/staging DB hợp lệ; build xong start production. Run U đầy đủ + widths 320/768/1440; no-JS hero/project anchors/email, delayed hydration, reduced motion, EN/VI switch liên tục, CMS blank/empty/1/2/3 items/broken image/title dài; không overflow, focus trap/return CV/project, lightbox giữ dark-only. So ảnh excluded kể cả font/controls inherited, không chỉ màu nền.
- [ ] Đo contrast foreground/background đã composite thật: CTA cũ 4.12:1 → ≥4.5:1, Read Story/title link 2.66:1 → ≥4.5:1, input boundary light 1.37:1 → ≥3:1; kiểm cả dark và hover/focus/error. Ghi bảng cặp màu/ratio/state/viewport vào audit; Hairline divider không thay thế control token. Inventory alt DOM không thiếu; decorative SVG aria-hidden, icon button có accessible name; toggles/social/dots còn lại ≥44×44.
- [ ] Đo cùng device/network/build conditions LCP/CLS/initial JS/transferred bytes và chiều cao trang trước/sau; đo frame rate `/` trước/sau cùng điện thoại tầm trung/build, ghi trace và kết quả so mục tiêu 60 fps; xác minh heavy islands tách riêng, client JS cho `/` không tăng, không registry/dictionary tải dư, WebGL contexts được release. Không hứa Lighthouse score tùy ý hoặc dùng số audit cũ thay đo mới.
- [ ] CSP: thu report-only evidence trên public/admin/music/media/CV, xử lý legitimate violations trong policy report-only. Giữ report-only + frame-ancestors enforcing theo quyết định, không promote/nonce/render động. Docs ghi giới hạn hash theme không bao phủ inline Next 14/RSC, không gọi strict CSP đầy đủ đã hoàn tất.
- [ ] Đối chiếu copy đã duyệt: site config/title/meta Frontend Software Engineer, sectionsContent từng section, 5 projects (2 mới), skills regroup §4, defaults en.ts/vi.ts; không phone/ngày sinh/bio lặp. Evidence nhập admin sau UI từng task; demo chỉ xoá sau chat xác nhận slug, không mở lại F10/copy/ParticleField. Kiểm loop pause, reduced motion final, one-shot, keyboard, contrast Void 88–92% và light starfield đã duyệt Task 13.
- [ ] Cập nhật CLAUDE design tokens: link hướng đã duyệt, semantic scoped variables, Be Vietnam Pro public + legacy dark-only, motion/SSR và cache blog; sửa mô tả GET music không còn increment. Architecture/deployment ghi report-only + frame-ancestors enforcing (giới hạn đã biết), env/build, locale client EN SSR/VI lazy và CSP rendering trade-off đã duyệt, upload ingress caps, F7 scrypt env/lệnh local và hai giới hạn limiter/HMAC. Không xóa exception SceneContainer/lightbox/theme.
- [ ] G + U lần cuối sau docs/config cuối; PR vào **develop** có before/after, contrast, test/build outputs, approval hero/light starfield, evidence copy đã duyệt, security rollback và pending gates. Mỗi phase trước đã có PR riêng; PR này không squash toàn overhaul thành một lần ship. Không tự deploy, không merge main.
- [ ] **Commit:** `docs: record portfolio verification and design rules`, trailer Global Constraints.

## Phase 6 — Backlog (Q6, không triển khai trong overhaul)

### Task 21: Ghi backlog tách file lớn và major upgrades

**Files:** Modify duy nhất `docs/superpowers/plans/2026-11-06-portfolio-overhaul.md` để theo dõi backlog. File thực thi tương lai: `src/components/music/MusicPlayer.tsx`, `src/context/MusicContext.tsx`, `src/app/couple/page.tsx`, `src/app/admin/photography/page.tsx`, `src/app/admin/couple/page.tsx`, `src/app/admin/site-config/page.tsx`; inventory thực tế file admin >1000 dòng trước scope. Upgrade tương lai: `package.json`, `package-lock.json`, `eslint.config.mjs`, `src/app/layout.tsx`, mới client wrapper `src/components/layout/ClientMusicPlayer.tsx`.

**Interfaces:** chỉ backlog coarse; không hứa đã refactor/upgrade. Các public APIs/appearance dark-only giữ khi triển khai sau này.

- [ ] Ghi các PR độc lập tương lai: tách MusicPlayer 2125 dòng → tách MusicContext → couple/admin pages >1000 dòng → client wrapper cho `dynamic(...,{ssr:false})` hiện ở server layout `src/app/layout.tsx:17–20` → Next 14→15 và ESLint 8→9 tương thích. Không nâng cùng lúc với UI/security phase hiện tại; mỗi item cần plan/test chi tiết riêng trước code.
- [ ] Khi chỉ cập nhật backlog, xác minh link/path; Phase 6 triển khai thật về sau vẫn bắt buộc G và U nếu chạm UI, không coi việc ghi backlog là checks code đã pass. **Commit tương lai nếu đổi backlog:** `docs: track portfolio refactor and upgrade backlog`, trailer Global Constraints. Không tạo commit này trong lượt lập tài liệu.

## Rủi ro

- Tooling lint inventory thay đổi theo checkout; phải pin diagnostics trước sửa, không lấy grep `any` làm danh sách lỗi chắc chắn. Phase 0 không đóng khi còn warnings hay CI lint bị waive.
- Upload cap của host có thể nhỏ hơn app; cap body trước parser và test ingress thực tế, không để 50 MiB thành lời hứa sai. Cloudinary mocked trong unit test, không tạo asset thật để thử invalid input.
- CSP đầy đủ report-only là giới hạn đã chốt; Task 7/20 giữ static/ISR + frame-ancestors enforcing, không promote. MDX plugin phải kiểm thử compile thật, không chỉ tên node mock.
- Shared styling/font/icons/language provider ảnh hưởng dark-only dù không sửa route files; U baseline và opt-in là bắt buộc.
- F7 không store/schema/dependency mới; memory limiter không cộng dồn đa instance và HMAC không revoke trước expiry là giới hạn docs. Build/DB thiếu điều kiện là blocker, không pass có điều kiện.
- Approval hero/light starfield và xác nhận danh sách slug xoá demo có thể chưa tới; ghi pending, dừng phần phụ thuộc, không dùng thời gian chờ làm approval. Phase có output pending gate không được gọi hoàn tất toàn bộ.

## Câu hỏi mở

Sáu câu hỏi trước đã chốt: không store F7, không JSX F8, bỏ ParticleField, blog demo, copy/F10 đã duyệt và CSP report-only. Không mở lại. Còn gate visual Task 13 (gồm light starfield) và xác nhận danh sách slug trong chat trước xoá demo qua admin/blog.

## Thứ tự và điều kiện hoàn thành

Task 1→2 (G, PR Phase 0) →3→4→5→6→7→8 (G, PR Phase 1 core); 8b là sub-phase bắt buộc, PR riêng không gate store. Tiếp theo 9→10→11 (G/U, PR Phase 2) →12→13 (G/U, PR Phase 3 + **approval**) →14→15→16→17→18→19 (G/U, PR Phase 4) →20 (G/U, PR Phase 5). Task 21 chỉ backlog.

Hoàn tất phase khi checks bắt buộc xanh, evidence được ghi và gate của phase được đáp ứng. Hoàn tất overhaul Phase 0–5 không có nghĩa Phase 6 đã triển khai hay hai giới hạn F7/CSP report-only đã được khắc phục. Khi bàn giao phải liệt kê chính xác trạng thái các gate còn mở.

## Kết quả kiểm chứng Task 20 (08/11/2026)

Chạy trên `feature/portfolio-verification` (stack trên Phase 4), `next build` + `next start`, Playwright Chromium, máy dev (không throttle CPU/mạng).

**G (checks):** `tsc --noEmit` ✅ · `eslint . --max-warnings=0` ✅ · Vitest 33 file / 211 test ✅ · `next build` ✅.

**Hiệu năng `/`:**

| Chỉ số | Trước overhaul | Sau |
| --- | --- | --- |
| First Load JS (`next build`) | 237 kB | 192 kB (route 9.62 kB) |
| JS tải lúc đầu (trình duyệt) | — | 26 file, ~435 kB transfer |
| LCP / CLS (local, không throttle) | — | 2,03 s / 0 |
| Chiều cao trang 390px | ~10.500 px | 7.378 px |
| Chiều cao trang 320 / 768 / 1440px | — | 8.130 / 6.412 / 5.710 px |

Frame rate trên điện thoại tầm trung **chưa đo** (không có thiết bị trong phiên này) — mục tiêu 60 fps còn mở.

**U (UI/a11y):**
- Không tràn ngang ở 320/768/1440 × dark/light; mọi `<img>` có `alt`; SVG trang trí `aria-hidden`; phần tử tương tác đều có tên (trừ honeypot `aria-hidden`, `tabindex=-1`).
- Contrast chữ so với nền CSS đã composite: thấp nhất dark 7,33:1, light 5,14:1 (CTA chính dark 10,98 / light 5,42; text link accretion dark 11,09 / light 5,14; tiêu đề blog dark 15,72 / light 18,58; link footer dark 7,85 / light 7,13). Viền input ≥7:1. Phép đo không tính pixel canvas hố đen phía sau.
- Không JS: tên, 4 facts, 20 skills, 3 dự án, anchor `#projects`, mailto và form đều render.
- Reduced motion: không mount canvas, đường chòm sao ở trạng thái cuối (dashoffset 0), ảnh không parallax.
- Dialog dự án: `aria-modal`, có tiêu đề liên kết, focus vào trong, Tab không thoát ra, Escape đóng và trả focus về nút mở.
- EN ⇄ VI: `lang` đổi, About/facts/nhóm skills/mô tả dự án đổi đúng và đổi ngược lại được.
- Route: `/`, `/projects`, `/photography`, `/blog`, `/blog/[slug]`, `/music`, `/couple`, `/admin/login`, `/tools/json-validator` trả 200; `/creative` 404 (không còn link nào trỏ tới). Không có console error.
- Link chữ (View Live, Source Code, All projects…) cao 40px: đạt WCAG 2.5.8 (≥24px); quy định ≥44×44 của plan áp cho toggle/social/nút icon và đã đạt.

**CSP:** header enforcing `frame-ancestors 'none'` + `X-Frame-Options: DENY`; report-only đầy đủ. Trên `/` có ~20 vi phạm report-only từ inline script Next/RSC (đúng giới hạn đã ghi trong `docs/DEPLOYMENT.md` §1.2); giữ report-only theo quyết định đã chốt.

**Nội dung (§ content spec):** đã nhập qua admin API của phiên `/admin` ngày 08/11/2026: site config/title/meta "Frontend Software Engineer", author, xoá override cũ trong `sectionsContent` (dùng defaults en/vi), 20 skills theo CV (9 skill cũ chỉ ẩn, không xoá), 5 dự án (2 mới; SUUTA/KMJ bỏ `featured`), nav Hobby `href` → `#`, ẩn mục Games (`/games` không tồn tại). Câu "I usually reply within a day" không dùng (chưa được xác nhận).

**Gate còn mở / quyết định:**
- Blog demo (`react-three-fiber-guide`, `framer-motion-guide`): người dùng chọn **giữ lại** (08/11/2026) — không xoá.
- Ảnh cho dự án Zonenop Game và Portfolio: chưa có.
- Frame rate điện thoại tầm trung: chưa đo.
- **Bảo mật:** mật khẩu admin đang dùng trùng mật khẩu mặc định cũ còn trong lịch sử git public → phải đổi mật khẩu (tạo hash mới, cập nhật `.env` và Vercel).

# Overhaul portfolio theo phase — Thiết kế

- **Ngày:** 2026-11-06
- **Branch:** `feature/<topic>` tách từ `develop` → PR vào `develop`, không vào `main`.
- **Trạng thái:** spec và plan chờ review; hướng visual còn là đề xuất, bắt buộc duyệt hero prototype trước Phase 4.
- **Copy đã duyệt:** `docs/superpowers/specs/2026-11-06-portfolio-content.md`; F10 dùng Frontend Software Engineer.
- **Plan:** `docs/superpowers/plans/2026-11-06-portfolio-overhaul.md`.
- **Design direction:** [2026-11-06-portfolio-design-direction.md](2026-11-06-portfolio-design-direction.md), đặc biệt §2, §6 và §8. Đây là nguồn duy nhất của palette, typography, spacing và composition đề xuất; tài liệu này không định nghĩa lại bảng token.
- **Thay thế:** `docs/superpowers/plans/2026-10-26-portfolio-ui-update.md:1–24` là đề xuất cũ chưa duyệt; không triển khai song song hai plan.

## 1. Mục tiêu

Nhà tuyển dụng/khách hàng đọc được nghề nghiệp, bối cảnh làm việc và đường tới dự án/liên hệ trong khoảng 10 giây trên EN/VI, mobile/desktop. Giữ black hole WebGL làm điểm nhấn duy nhất; phần còn lại của homepage rõ chữ, bề mặt đặc, ít thao tác và ít lặp nội dung. Đồng thời khắc phục toàn bộ nhóm correctness, security, performance và tooling đã review, với mỗi phase có thể giao thành một PR độc lập.

**Ngoài phạm vi (YAGNI):** không viết code trong bước lập tài liệu; không migration/seed hay ghi copy DB bằng script; không đổi CMS schema để bịa case study/thành tích; không redesign `/admin`, `/couple`, `/music`, lightbox hoặc toàn bộ trang con. Không thay black hole bằng engine khác, không thêm UI library, không nâng Next/ESLint trong các phase chính. Việc chia file khổng lồ và nâng major chỉ là backlog Phase 6.

## 2. Những gì người dùng đã chốt

| Chủ đề | Quyết định |
|---|---|
| Workflow | Spec → phased plan ở bước này; triển khai sau, từng task |
| Điểm nhấn | Giữ black hole WebGL; bỏ gradient tím/cyan, glass/glow trang trí trên homepage |
| Visual | Thực hiện theo design direction được dẫn ở đầu; prototype 1280×800 và 390×844, dark + light; người dùng duyệt trước rollout các section |
| Phạm vi review | Bao phủ F1–F10, P1–P7, Q1–Q6 và toàn bộ UI/UX |
| Git | `develop` → `feature/<topic>` → PR `develop`; từng phase shippable |
| Copy CMS | Copy EN/VI đã duyệt theo `2026-11-06-portfolio-content.md`; nhập qua `/admin` sau UI trong task giao section, không script DB; không số điện thoại/ngày sinh |
| Thứ tự | Phase 0 → 1 + 1b (F7 bắt buộc) → 2 → 3 + duyệt hero → 4 → 5; Phase 6 backlog |

## Global Constraints

- Tuân thủ toàn bộ `CLAUDE.md:7–93`: TypeScript strict, Next.js 14, Tailwind v4, Prisma 7, Framer Motion, Vitest hiện có; không tự nâng major.
- Light theme là lớp bổ sung: thêm `light:` bên cạnh class dark; không thay dark bằng light. Không thêm `light:` trong `/admin`, `/couple`, `/music` hoặc `PhotoLightboxModal`; overlay đen trên ảnh giữ nguyên ở cả hai theme (`CLAUDE.md:85–90`).
- Không đổi token/font/focus/control kế thừa của các vùng dark-only. Token mới có namespace và scope portfolio; giữ token/utility cũ cho consumer còn dùng. Shared component thực sự render trong vùng bị loại trừ đổi kiểu bằng opt-in, mặc định giữ style cũ tại đó; Button/Navigation/ThemeToggle restyle trực tiếp theo inventory Task 12.
- `THEME_INIT_SCRIPT` phải đồng bộ `detectPreferredTheme()` và phép so prefix chính xác (`CLAUDE.md:87`); CSP không được làm flash sai theme.
- Three.js/R3F là client; R3F chỉ qua `SceneContainer`, không tạo `<Canvas>` root mới; black hole imperative là ngoại lệ hiện có. Pointer/scroll dùng ref, không state cập nhật 60 FPS (`CLAUDE.md:59–67`).
- Motion dùng `AnimatedSection` và variants trong `src/lib/animations.ts`, dùng `cn()`; nội dung SSR mặc định hiện và reduced motion luôn dùng được (`CLAUDE.md:69–72`).
- CMS DB access chỉ qua `src/lib/content/*.ts` / `src/lib/blog.ts`; music `Track`/`Playlist` được dùng trực tiếp theo ngoại lệ repo. Public reads cache bằng `unstable_cache`, admin gọi `requireAdminSession()` trước xử lý và `revalidateTag` sau write thành công (`CLAUDE.md:74–78`).
- Form mới hoặc form bị sửa logic dùng `react-hook-form` + `@hookform/resolvers` + `zod` (`CLAUDE.md:92–93`). Giữ semantics override blank/unset và fallback EN/VI riêng biệt.
- Copy đã duyệt chỉ nhập qua `/admin` sau UI trong task tương ứng, không script/build/seed; test mutation chỉ trên fixture/test DB đã được phép, không DB production. Không gửi email thật để thử giao diện.
- Mỗi phase đóng bằng `npx tsc --noEmit -p .`, `npm run lint`, `npm test`, `npm run build`, tất cả exit 0. Lint phải sạch từ Phase 0. Build cần `DATABASE_URL` và môi trường build hợp lệ; thiếu môi trường là blocker, không coi là pass.
- Phase UI còn cần screenshot 390×844 và 1280×800 ở dark + light, keyboard, reduced motion, EN + VI; đối chiếu `/admin`, `/couple`, `/music`, `PhotoLightboxModal` dark-only không đổi diện mạo.
- Mỗi commit triển khai dùng conventional message, kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Trong lượt viết tài liệu này không chạy các lệnh triển khai hay commit.

- Hệ chuyển động theo design direction §8: chỉ Framer Motion + CSS, không dependency mới; gỡ gsap ở Phase 0. Variants ở `src/lib/animations.ts`, dùng AnimatedSection khi phù hợp; chỉ transform/opacity/blur ngắn/stroke-dashoffset, không animate layout.
- Ngoài black hole/starfield, tối đa một loop liên tục trong viewport; mọi loop pause off-screen/tab ẩn. `prefers-reduced-motion` hiện final ngay, không parallax/drawing/sequence. Nội dung không phụ thuộc animation để hiện; one-shot dùng `viewport={{ once: true }}`.
- Pure helpers motion mới phải Vitest đỏ trước implementation; Task 20 đo initial JS `/` và frame rate trước/sau cùng device/build/network, mục tiêu 60 fps trên điện thoại tầm trung.

## Review Focus

1. Cache blog sau create/update/delete, kể cả slug chưa có lúc build: danh sách, category và trang chi tiết cập nhật qua tag; Task 3 ghim integration ở production build, không chỉ mock cache.
2. File giả MIME, quá cỡ, multipart nhiều phần và `subType=../../…`: bị từ chối trước upload; không lộ Cloudinary error. Task 4 ghim unit boundary + route mocks.
3. MDX chứa import/export, expression hoặc mọi JSX: không được evaluate; code fence hợp lệ không bị chặn. Task 6 ghim AST fixtures cả EN/VI.
4. CSP + SSR theme + RSC/Next inline scripts: giữ report-only, đo vi phạm ở build thực; không dùng hash theme đơn lẻ rồi tuyên bố CSP đầy đủ. Task 7 ghim browser smoke và no-flash.
5. JS tắt/chậm, locale đổi liên tiếp, CMS blank/title dài và theme inheritance: nội dung còn hiện, không đổi nhầm dictionary, vùng dark-only giữ nguyên. Task 9, 12–20 ghim test và ma trận UI.

6. Motion khi no-JS/reduced-motion, nhiều section cùng viewport và tab ẩn: nội dung luôn hiện, loop dừng đúng, keyboard tương đương hover; Task 12–19 chạy U, Task 20 đo contrast composite/initial JS/frame rate.

## 3. Hiện trạng và bằng chứng

Mốc dòng dưới đây từ working tree khi lập tài liệu; finding live do review đầu vào cung cấp, không tuyên bố đã đo lại live trong lượt này.

| Nhóm | Bằng chứng thực tế | Hệ quả / phạm vi |
|---|---|---|
| F1–F2 | `src/lib/blog.ts:24–43`, `:49–68`; `src/app/blog/page.tsx:11–23`; `src/app/blog/[slug]/page.tsx:15–18`; `src/app/page.tsx:53–62` | Reads chưa cache, full body đi vào list; categories gọi lại whole table |
| Mẫu cache | `src/lib/content/site-config.ts:71–80`, `skills.ts:65–75`, `projects.ts:86–96`, `photography.ts:217–224`, `nav-links.ts:128–139`, `social-links.ts:61–71`, `couple.ts:184–199` | Copy `unstable_cache` + tag; `contact-messages.ts:5–18` là write, không cache mutation |
| Blog writes | `src/app/api/admin/blog/route.ts:50–84`; `src/app/api/admin/blog/[slug]/route.ts:34–103` | Có invalidate tag nhưng Prisma còn nằm trong route; chuyển write vào `blog.ts` |
| F3 | `src/app/api/admin/photography/upload/route.ts:11–44,56–61`; `src/app/api/music/upload/route.ts:11–49,64–69` | Buffer trước validation; subtype tự do; raw error lộ ra client |
| F4 / Q5 | `next.config.js:5–50`, đặc biệt `:23–36` | Chưa có `headers()`, watcher/comment còn nói JSON write |
| F5–F6 | `src/app/api/music/tracks/[id]/route.ts:5–50`; `src/app/api/music/tracks/route.ts:24–44`; `src/context/MusicContext.tsx:698–708` | GET increment + leak unpublished; coercion tùy tiện; consumer phải đổi cùng API |
| F7 | `src/lib/admin-auth.ts:34–51,63–103`; `src/lib/session-token.ts:50–68`; `src/lib/rate-limit.ts:1–11,61–64`; `src/app/api/admin/auth/route.ts:6–76`; `src/app/admin/login/page.tsx:8–32` | Client hash là credential dùng lại được; limiter per instance; logout chưa revoke server |
| F8 | `src/app/blog/[slug]/page.tsx:133–154` | Cả EN/VI qua MDXRemote; cần chính sách AST trước compile |
| F9 / P7 | `src/app/layout.tsx:22–33,95–106,113–124` | Fallback thực tế ở dòng 33,114–116, không phải mốc 46/117 trong review; font latin-only |
| P1 | `src/locales/index.ts:1–9`; `src/context/LanguageContext.tsx:57–138`; `src/locales/en.ts:1–138`; `src/locales/vi.ts:1–140` | Import cả hai dictionary; API `t()` và `t.foo` phải cùng hoạt động |
| P2 | `src/components/ui/Icon.tsx:13–113,126–166,314–373` | Registry tham chiếu nhiều named imports/brand JSX; không phải namespace import nhưng vẫn giữ tập lớn trong shared bundle |
| P3 | `src/components/ui/ImageWithSkeleton.tsx:71–103`; `src/components/photography/AlbumDetailView.tsx:77–82` | Priority bị opacity 0, cover trang trí fill thiếu sizes |
| P4 | `src/components/3d/blackhole/engine.ts:504–520`; `BlackHoleCanvas.tsx:62–169` | Dispose chưa force context loss; kiểm tra pending callbacks/remount |
| P5–P6 | Bảy `src/components/sections/*Section.tsx:1`; `HeroSection.tsx:63–103,123–164`; `AnimatedSection.tsx:14–25,46–51`; `src/lib/animations.ts:6–18,78–102` | Whole-section client, reveal che SSR; canvas/scrim fixed toàn trang |
| Tooling | `eslint.config.mjs:9–13`; `package.json:2–63`; `.github/workflows/ci.yml:27–33`; `vitest.config.mts:8–10` | Ignore thiếu worktrees/agent dirs; lint informational; tests đặt cạnh module |
| Layout UI | `src/app/globals.css:31–70,192–208,231–234`; `Button.tsx:20–36`; `Navigation.tsx:14,57–92,181–199`; `ThemeToggle.tsx:27–34`; `LanguageSwitcher.tsx:55–69`; `Footer.tsx:23,45–88` trong `src/components/ui/` | Scope token, active Hobby, target nhỏ, bio lặp; không đổi shared defaults thiếu kiểm soát |
| Sections | `AboutSection.tsx:21–38,42–101`; `SkillsSection.tsx:12–20,49–58,93–100`; `ProjectsSection.tsx:125–132,268–289`; `PhotoPreviewSection.tsx:56–100`; `BlogPreviewSection.tsx:21–100`; `ContactSection.tsx:54–126,203–253,324–450` trong `src/components/sections/` | Bỏ heading pattern/card/filter dư, giữ modal/form, dùng content thật |
| Contrast | `docs/HALLMARK_AUDIT.md:58–68` | View My Work 4.12:1, Read Story 2.66:1, input border light 1.37:1; dark chưa có phép đo đầy đủ |
| Content helpers | `src/lib/content-overrides.ts:14–50,65–90`; `src/lib/seo.ts:12–21,39–67`; `src/lib/cloudinary-image-loader.ts:12–17,35–48` | Ghim blank/unset, metadata optional, URL transform bằng test trước sửa |

## 4. Kiến trúc và hành vi cần đạt

### 4.1 Phase 0 — Môi trường & tooling

Q3: thao tác đầu lúc triển khai là `npm install` để khôi phục Vitest và chạy `postinstall` → Prisma generate. Không diễn giải CI xanh thành local xanh. Q1: ignore đúng `.claude/worktrees/**`, `.agents/**`, `.hallmark/**`, `.superpowers/**`, không ignore `src/`; xác minh lại baseline 7888 / 7792 / 8 / khoảng 88 vì đây là số từ review, rồi sửa lỗi thực thay vì disable rule hàng loạt. Lint sạch mới bỏ `continue-on-error` và comment cũ trong CI.

Q2: grep từng dependency trước bỏ; bỏ những package được xác nhận không dùng, chuyển `gray-matter` sang devDependency khi chỉ script migrate dùng, đổi package name thành `portfolio` cùng lockfile. Q5: bỏ watcher/comment JSON cũ sau kiểm tra không còn importer runtime. Không dùng Phase 0 để refactor UI.

### 4.2 Phase 1 — Correctness & bảo mật

F1–F2: chia `BlogPostListItem` không chứa `content`/`content_vi` và full `BlogPost` chỉ cho chi tiết/editor. Query list dùng Prisma `select` whitelist, map tường minh; category/tag lấy từ metadata cache hoặc query distinct metadata, không đọc body. Cache full-list cũ (nếu còn consumer), list mới và by-slug cùng tag `blog`, key khác nhau và slug đi qua tham số cache. Admin create/update/delete ở `blog.ts`, invalidate sau write; giữ 404/409 hợp lý.

F3: validation chung trước `arrayBuffer()` và upload; giới hạn đề xuất của người lập kế hoạch: image 10 MiB, thumbnail 5 MiB, audio/video 50 MiB. MIME + extension phải khớp allowlist và kiểm tra signature server-side; giữ HEIC/HEIF được pipeline hiện tại hỗ trợ. Không nhận SVG/HTML/executable; `subType` chỉ enum `processed|raw|video`, music subtype do server quyết định. Multipart tổng có cap 60 MiB và giới hạn ingress thực tế: host có cap nhỏ hơn thì cap hiệu lực là giá trị nhỏ hơn, UI nhận 413 rõ ràng, không hứa upload 50 MiB trên host không hỗ trợ. MIME trống/sai trả 415, sai subtype 400, quá cỡ 413; lỗi upstream trả thông báo ổn định, log chi tiết chỉ server. Auth trước đọc body; validate tất cả part trước side effect để file thứ hai sai không làm file thứ nhất được upload.

F5–F6: GET detail chỉ đọc track published, unpublished/nonexistent → 404 không lộ dữ liệu. Thêm POST `/api/music/tracks/[id]/play` cho ghi lượt nghe, rate limit 10 request/phút/IP+track, 429 có `Retry-After`, same-origin check, increment atomic với điều kiện published. Giữ limiter in-memory per-instance; ghi giới hạn đa instance trong docs, không thêm shared store ở F7. Client chỉ POST một lần khi playback thật bắt đầu, không khi render/prefetch. Schema zod strict: duration finite ≥0, order integer ≥0, booleans đúng kiểu, URL HTTPS hợp lệ, PATCH không rỗng; chỉ P2025 →404, P2002→409, lỗi DB khác→500, JSON sai→400.

F8: đã chốt không JSX components, allowlist rỗng: reject mọi mdxJsxFlowElement/mdxJsxTextElement (kể cả HTML JSX/fragment), mdxjsEsm, mdxFlowExpression và mdxTextExpression trước compile EN/VI; kiểm URL scheme nguy hiểm. Grep legacy chỉ sanity check, không xin allowlist. Áp cùng AST policy cho admin write/public render, code fence JSX vẫn hợp lệ. Không chỉ regex/rehype-sanitize để chống server execution.

F4: thêm XFO DENY, CSP enforcing `frame-ancestors 'none'`, nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS production HTTPS max-age=31536000 (không tự bật preload/includeSubDomains). Kiểm tra response headers trước khi thêm HSTS vì Vercel có thể đã gửi cho domain nền tảng. CSP đầy đủ giữ report-only, script-src dùng sha256 hash của đúng bytes THEME_INIT_SCRIPT từ buildThemeInitScript; không sửa middleware, không nonce, không headers() trong layout, giữ static rendering. Hash theme không bao phủ inline Next 14/RSC: CSP đầy đủ report-only là giới hạn đã biết đã chốt, Task 20 không promote; giữ static rendering và enforcing frame-ancestors. Cloudinary image/media, ảnh CMS, API same-origin, font self-hosted, worker/blob nếu quan sát có dùng và WebGL phải hoạt động; Resend chỉ server. Không unsafe-eval production hay wildcard để dập report.

F9: bỏ mọi fallback `as any` trong layout; typed fallback dùng dữ liệu mặc định hiện có được trích từ content layer, không dummy `t/d/n/a/localhost`. DB outage không tạo metadata sai và không throw khi author thiếu; không biến outage thành cached successful dummy response. F10 dùng chức danh đã duyệt Frontend Software Engineer; nhập title/meta qua `/admin` ở Task 13 sau UI.

### 4.3 Phase 1b — F7 bắt buộc, không shared store

Bỏ SHA-256 client; RHF + zod POST password qua HTTPS, server verify bằng Node `crypto.scrypt` với salted hash env `ADMIN_PASSWORD_SCRYPT`, so sánh constant-time. Từ chối payload `passwordHash` cũ, không fallback `ADMIN_PASSWORD`. Ghi env/format và lệnh local một lần tạo hash trong `.env.example`/docs; không secrets trong repo/log.

Giữ limiter in-memory per-instance 5 lần sai/15 phút và session HMAC stateless 24 giờ với AUTH_SECRET/cookie hiện có. Không Redis/Upstash/store mới, schema change hay dependency mới. Docs ghi giới hạn: không cộng dồn đa instance/cold start; logout chỉ xoá cookie, token sao chép không revoke server trước expiry. Không test shared quota/revocation. Task 8b vô điều kiện, không hứa sửa hai giới hạn này.

### 4.4 Phase 2 — Performance không đổi giao diện

P1: giữ flow client LanguageContext: SSR dùng defaultLocale EN, sau mount áp dụng localStorage/browser detection hiện có; giữ cookie write khi switch. EN import tĩnh làm default/SSR dictionary; VI chỉ import() khi được chọn lúc mount hoặc switch. Race guard chống response đảo thứ tự; chỉ publish locale/dictionary sau load thành công, lỗi giữ dictionary/locale trước đó. Giữ t(...) và property access cùng dictionary, interpolation/fallback hiện có. Không cookies()/headers() trong layout, không router.refresh(), không initialDictionary prop từ server; giữ static rendering.

P2: chia registry theo consumer public/admin/music, public icons thường dùng direct named imports; brand/dynamic CMS icons lazy theo registry hữu hạn, giữ `isKnownIconName`, URL icons, alias và fallback. Đo initial/shared chunks trước/sau, không chỉ đổi barrel. P3: priority image hiện ngay từ SSR, skeleton không phủ ảnh; cover trang trí album bỏ priority và có `sizes="100vw"`. P4: dispose gọi forceContextLoss sau dispose resources, cleanup idempotent, hủy callbacks/RAF/observer/listener; remount/404/theme switch không mất renderer mới. Không redesign trong phase này.

### 4.5 Phase 3 — Nền tảng và hero prototype

Triển khai token/font/typography theo design direction dòng 31–58 và UI dòng 78–87, chưa nhân rộng sang sáu section. `globals.css` thêm namespace portfolio, root legacy giữ cho dark-only; font Be Vietnam Pro có `latin` + `vietnamese`, scope public portfolio, giữ font legacy cho vùng bị loại trừ và lightbox. Không thay font mono code block bằng font body. Button mới opt-in; focus ring theo direction, control boundary đo được ≥3:1, text ≥4.5:1 ở cả theme.

Navigation thêm `photos`/`blog` vào scroll-spy và ánh xạ vào mục cha Hobby theo href/children, không dựa label dịch; target theme/language/social ≥44×44. Footer bỏ bio lặp. Hero có text và CTA SSR hiện ngay, tên đầy đủ từ CMS, vai trò/ngữ cảnh chỉ từ field có thật, CTA dự án là link anchor native; CV vẫn mở modal. Black hole/scrim `absolute` trong hero, desktop lệch phải/mobile phía trên, không fixed theo trang. Giữ homepage StarryBackground3D qua SceneContainer sau hero, không Canvas root mới, ba lớp parallax mật độ/độ sáng thấp: scroll listener ghi ref, useFrame đọc ref; route khác giữ behavior. Starfield không hiện qua hero; khi bị hero che, off-screen hoặc tab ẩn phải pause loop (fixed wrapper không tự được IntersectionObserver coi là khuất). Hiện source dùng still trên `/`, light là gradient fallback; prototype thay riêng homepage bằng chấm Ink nhạt hoặc tắt, chốt ở Task 13. Section phủ Void 88–92%, đo contrast composite. Dùng scrollEffect sẵn có cho hero → About thu nhỏ/mờ, không pin hero; source hiện chỉ map camera theo toàn trang, nên giới hạn mapping theo hero và thêm wrapper transform/opacity qua ref, cleanup RAF/listener, không giả định prop tự fade. Không đợi WebGL ready mới hiện chữ; reduced motion dùng fallback tĩnh. Hero đọc locale giữ use client, tách HeroCanvas và HeroActions/CV islands.

**Cổng duyệt bắt buộc:** cung cấp bốn ảnh prototype đúng viewport + EN/VI, no-JS, keyboard và contrast; ghi phản hồi/phê duyệt vào plan/PR. Nếu chưa duyệt, dừng rollout Phase 4, không suy diễn timeout hay CI pass là approval. Shared foundation vẫn có thể ship PR Phase 3 sau checks, nhưng preview chưa duyệt không được gọi là hệ thiết kế cuối cùng.

### 4.6 Phase 4 — Từng section sau khi được duyệt

| Section / task | Hành vi đích |
|---|---|
| About / 14 | Hai cột desktop, một mobile; đoạn ngắn + facts hiện có. Không stats suy đoán, không bio lặp Hero/Footer; copy/facts đã duyệt §3, facts orbit-in cách 60 ms |
| Skills / 15 | Chòm sao theo nhóm; SVG stroke-dashoffset, hover/focus highlight; ul thật, SVG aria-hidden; <640px plain list; category rỗng ẩn, nhập theo content §4 |
| Projects / 16 | Hồ sơ dự án, full title wrap, ảnh thật hoặc không ảnh; bỏ rocket placeholder, giữ modal/link. Nhập 5 dự án content §5 gồm Zonenop Game/Portfolio mới; ba đầu featured; role/year ở description vì schema không field riêng; lensing CSS variables qua ref, không tilt |
| PhotoPreview / 17 | Dải 3–4 ảnh gọn, link gallery; parallax 8–24px qua ref, không carousel cao 1193px. Nếu còn dot control thì target ≥44px; lightbox giữ dark-only |
| BlogPreview / 18 | Hàng date/title/readTime, dùng list DTO; rỗng thì ẩn cả section; demo đã xác nhận; liệt kê slug và chat xác nhận trước xoá qua admin/blog, blog empty state theo copy, nav/Hobby data-driven ẩn link rỗng |
| Contact / 19 | Email và copy là hành động chính, form Hull đặc, error/loading/success rõ; giữ RHF/zod, honeypot, API. Bỏ ParticleField/barrel export rồi xoá file nếu không importer; signal rings pending/success/copy |

Tất cả section căn trái, heading sentence case một màu, bỏ eyebrow/one-word-gradient; nền Void bán đặc 88–92% sau hero, spacing theo direction thay padding/spacer thừa. P5 tách phần tương tác nặng thành module client islands, giữ phần còn lại nhẹ; section đọc t(...) hoặc CMS text theo locale vẫn use client, không props locale/dictionary từ server. Tách HeroCanvas (dynamic BlackHoleCanvas), HeroActions/CV modal, ProjectDialog, ContactForm, CopyEmailButton; dynamic import islands dưới fold khi phù hợp, bỏ whole-section Framer Motion wrappers. Chỉ section không render text phụ thuộc locale mới có thể thành server component. Giữ anchors `home/about/skills/projects/photos/blog/contact`; danh sách rỗng, 1/2/3 items, CMS blank, ảnh lỗi, title VI dài không làm hỏng bố cục.

Hai ảnh thiếu alt trên live là finding cần truy vết rendered DOM: source hiện có nhiều `alt` ở Skills/Projects/Photo/Footer nên không đoán hai vị trí. Mỗi ảnh nội dung phải có alt từ dữ liệu; ảnh trang trí dùng `alt=""` và không bị helper đổi thành `"Image"`. Task 17 và 20 xác định/fix đúng consumer, không viết alt giả chung.

### 4.7 Phase 5 và Phase 6

Phase 5 ghim hồi quy, đo contrast thực, so hiệu năng cùng điều kiện trước/sau, cập nhật design tokens trong `CLAUDE.md`, audit/architecture/deployment docs và PR. Không đợi Phase 5 mới kiểm tra hồi quy từng phase. Phase 6 chỉ ghi backlog chia `MusicPlayer.tsx`, `MusicContext.tsx`, `couple/page.tsx`, admin files >1000 dòng và Next 14→15/ESLint 8→9; trước upgrade phải chuyển `dynamic(...,{ssr:false})` khỏi server layout sang client wrapper. Backlog chưa thực hiện không chặn hoàn thành Phase 0–5.

Copy đã duyệt: `docs/superpowers/specs/2026-11-06-portfolio-content.md`. Checklist Task 13 site config/title/meta/hero sectionsContent; Task 14 bio/facts; Task 15 skills §4 (frontend/backend/tools, Quality + Tools gộp tools, design rỗng); Task 16 đủ 5 projects gồm Zonenop Game/Portfolio mới; Task 17–19 section copy. Nhập admin sau UI mỗi task; defaults ở en.ts/vi.ts; không phone/ngày sinh. Nav/Hobby data-driven: root layout lấy getPublishedNavLinks, nav-links.ts map children CMS, Navigation render props; Task 18 lọc blog link khi rỗng, giữ children khác.

Motion: Task 12 logo orbit-progress, underline layoutId, shared heading star ignition/orbit arc, footer one-shot shooting star, hover viền 150 ms/press 0.98. Task 13 CSS event horizon ≤1.2 s/CTA <1 s và starfield ba lớp sau hero; light chấm Ink nhạt hoặc tắt thuộc gate prototype. Task 14 facts orbit-in; Task 15 constellation; Task 16 lensing; Task 17 photo parallax; Task 18 future rows sao băng ngắn; Task 19 signal rings. Task 20 đo initial JS/frame rate và contrast composite.

## File Structure

Plan có danh sách file chính xác cho từng task và file mới. Các nhóm trách nhiệm: tooling/config; `blog.ts` + list mapper/policy MDX; upload validator/music schemas; headers/theme script; typed content fallback; locale loader; icon registries; image/WebGL lifecycle; token scope và public UI; section locale client nhẹ + heavy islands. Giữ `src/lib/content/*` là data layer, không thêm Prisma query trong UI.

## 5. Tiêu chí nghiệm thu theo phase

| Phase | Nghiệm thu ngoài bộ bốn lệnh Global Constraints |
|---|---|
| 0 | Local Vitest/Prisma dùng được; lint 0 error và 0 warning; CI lint blocking; dependency removal có grep evidence; watcher cũ bỏ |
| 1 core | Blog invalidate được sau admin write; list không có body EN/VI; invalid upload/music input bị chặn; GET không write/leak; MDX không execute AST bị cấm; fallback typed; headers đúng và report-only CSP đã smoke |
| 1b | Scrypt env, RHF/zod, reject passwordHash; giữ memory limiter/HMAC và docs hai giới hạn; không store/schema/dependency mới |
| 2 | Initial route EN không chứa VI dictionary chunk, shared icon graph nhỏ hơn; ảnh priority không bị che; album có sizes; context WebGL được release không regression UI |
| 3 | Be Vietnam Pro có dấu, scope không đổi excluded; nav Hobby đúng; targets ≥44px; SSR hero CTA hiện trong fold ở hai viewport; bốn ảnh + explicit approval ghi nhận trước Phase 4 |
| 4 | Sáu task riêng pass ma trận UI; không heading gradient/eyebrow/glass/glow trang trí; không rocket/cắt title/filter thừa; photo gọn, blog empty ẩn; Contact dùng được; heavy islands tách riêng, client JS đo cho `/` không tăng |
| 5 | Text ≥4.5:1, control boundary/focus ≥3:1 trên nền thực ở dark/light; alt đúng; keyboard/no-JS/reduced-motion/EN/VI pass; dark-only không đổi; docs và PR develop có evidence, copy đã duyệt nhập admin sau UI từng task |
| 6 | Chỉ inventory/dependency/order được ghi; khi thực hiện từng backlog item sau này phải lập task chi tiết và chạy đủ bốn checks, không gộp major upgrade vào overhaul |

## 6. Kiểm thử

Vitest node hiện tại `vitest.config.mts:8–10` phù hợp pure logic. Viết test trước cho `session-token`, `rate-limit`, `content-overrides`, `cloudinary-image-loader`, `seo`, upload validation, music schema và blog list mapper. Các task tích hợp dùng mock DB/Cloudinary, không side effect production. Cache/CSP/SSR và WebGL cần kiểm chứng production/browser bổ sung vì unit mock không chứng minh được hành vi runtime. UI-only không thêm test chỉ đếm class Tailwind.

## 7. Rủi ro

- CSP đầy đủ report-only là giới hạn đã chốt; Task 7/20 giữ static/ISR và XFO/frame-ancestors enforcing, không promote.
- Shared global CSS/font dễ làm dark-only đổi diện mạo; opt-in scope và screenshot trước/sau là điều kiện merge.
- Multipart parser/host limit có thể xảy ra trước validation; ingress cap + body cap cần cùng hoạt động, 413 không được biến thành generic 500.
- Query list làm đổi type của BlogList/preview/editor; giữ full editor API và audit mọi consumer trước bỏ API cũ.
- Mọi JSX bị từ chối theo quyết định; sanity grep phân biệt code fence, không nới policy hay script DB.
- DB outage/build environment hoặc chưa có approval làm phase blocked; ghi đúng trạng thái, không waive checks hoặc tự cấp phê duyệt.

## 8. Câu hỏi mở

Sáu câu hỏi trước đã chốt: không store F7, không JSX F8, bỏ ParticleField, blog demo, copy/F10 đã duyệt và CSP report-only. Không mở lại. Còn gate visual Task 13 (gồm light starfield) và xác nhận danh sách slug trong chat trước xoá demo qua admin/blog.

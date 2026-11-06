# Portfolio — Nội dung EN/VI đề xuất

Ngày: 06/11/2026. Người dùng giao cho Claude quyết định nội dung ("bạn sửa theo ý bạn"). Nguồn duy nhất: CV đang đăng trên site (`siteConfig.resumeUrl`, file `site-resume-huynh-nguyen-thach-frontend-enginee-…pdf`, 2 trang). Không thêm số liệu hay thành tích ngoài CV.

**Cách áp dụng:** nhập qua `/admin` (site config, sections, projects, skills) ở đúng task của plan, sau khi phần giao diện tương ứng đã xong. Không ghi DB bằng script. Xoá bài blog demo cần người dùng bấm xác nhận trong admin (hành động không hoàn tác).

**Không đưa lên site:** số điện thoại, ngày sinh (có trong CV nhưng là dữ liệu cá nhân, không cần cho trang).

**Giả định cần người dùng kiểm tra:** CV ghi ARIS Vietnam `03/2023 – 10/2026`. Nội dung dưới đây dùng "3 năm tại ARIS Vietnam" và không khẳng định đang còn làm hay đã nghỉ. Huy hiệu "Available for projects" giữ như hiện tại.

## 1. Site config

| Trường | EN | VI |
| --- | --- | --- |
| `title` / `titleVi` | Huynh Nguyen Thach — Frontend Software Engineer | Huỳnh Nguyễn Thạch — Frontend Software Engineer |
| `description` / `descriptionVi` (meta) | Frontend engineer building real-time React and TypeScript interfaces for industrial machines, plus full-stack side projects with WebSocket, Redis and PostgreSQL. | Frontend engineer làm giao diện real-time bằng React và TypeScript cho máy công nghiệp, cùng các dự án full-stack cá nhân với WebSocket, Redis và PostgreSQL. |
| `authorName` | Huynh Nguyen Thach | (dùng chung) |
| `authorTitle` / `authorTitleVi` | Frontend Software Engineer | Frontend Software Engineer |
| `authorLocation` / `authorLocationVi` | Ho Chi Minh City, Vietnam | TP. Hồ Chí Minh, Việt Nam |
| `authorBio` / `authorBioVi` (dùng ở About, không lặp ở Hero/Footer) | Xem mục 3 | Xem mục 3 |

Một chức danh duy nhất ở mọi nơi: **Frontend Software Engineer** (sửa lỗi F10: title và meta đang lệch nhau).

## 2. Hero

| Phần tử | EN | VI |
| --- | --- | --- |
| Tên (h1) | Huynh Nguyen Thach | Huỳnh Nguyễn Thạch |
| Vai trò | Frontend Software Engineer | Frontend Software Engineer |
| Một dòng ngữ cảnh | I build real-time interfaces that control industrial machines. | Tôi làm giao diện real-time để điều khiển máy công nghiệp. |
| Dòng phụ | 3 years at ARIS Vietnam · Ho Chi Minh City | 3 năm tại ARIS Vietnam · TP. Hồ Chí Minh |
| CTA chính | See projects | Xem dự án |
| CTA phụ | Read CV | Xem CV |

## 3. About

**Heading:** "About" / "Giới thiệu"

**Đoạn văn (EN):**
For the past three years I've built the frontend of Accretech, a web app that controls and monitors wafer-processing machines. That means live machine data over WebSocket, shared state across multi-step configuration flows, and screens generated from JSON schemas. Outside work I build full-stack projects end to end, most recently a real-time multiplayer game platform. I want to keep growing as a frontend engineer and own features from the UI down to the backend.

**Đoạn văn (VI):**
Ba năm qua tôi phát triển frontend cho Accretech, một ứng dụng web điều khiển và giám sát máy xử lý wafer: dữ liệu máy cập nhật trực tiếp qua WebSocket, state dùng chung cho các luồng cấu hình nhiều bước, và màn hình sinh ra từ JSON schema. Ngoài công việc, tôi tự làm các dự án full-stack từ đầu đến cuối, gần nhất là một nền tảng game nhiều người chơi real-time. Tôi muốn tiếp tục phát triển ở vai trò frontend và đảm nhận tính năng từ giao diện xuống tới backend.

**Facts (cột phải):**

| EN | VI |
| --- | --- |
| Experience — 3 years, ARIS Vietnam | Kinh nghiệm — 3 năm, ARIS Vietnam |
| Focus — Real-time UI, JSON-schema-driven screens, reusable widgets | Thế mạnh — UI real-time, màn hình từ JSON schema, widget tái sử dụng |
| Education — IT, Ho Chi Minh City University of Transport (2019–2023) | Học vấn — CNTT, ĐH Giao thông Vận tải TP.HCM (2019–2023) |
| Based in — Ho Chi Minh City | Nơi ở — TP. Hồ Chí Minh |

Stats hiện có trong `sectionsContent` (nếu còn số "clients"/"projects" không có nguồn) → bỏ, thay bằng facts trên.

## 4. Skills

**Heading:** "Skills" / "Kỹ năng". Bốn nhóm, đúng theo CV:

| Nhóm (category) | Kỹ năng |
| --- | --- |
| Frontend | React, Next.js, TypeScript, JavaScript (ES6+), HTML5, CSS, Tailwind CSS |
| Backend & data | Node.js, REST API, WebSocket, PostgreSQL, Prisma, Redis |
| Quality | Cypress, Vitest, Git, CI |
| Tools | Docker, Claude Code, Agile/Scrum |

Ghi chú mapping: category hiện có là `frontend/backend/tools/design`. Dùng `frontend`, `backend` (Backend & data), `tools` (gộp Quality + Tools nếu không thêm category mới), bỏ trống `design` để nhóm này tự ẩn. Bỏ WordPress/PHP và Responsive Web Design khỏi danh sách kỹ năng (CV mới không còn liệt kê; WordPress vẫn xuất hiện trong dự án KMJ). Trường `level` không hiển thị.

## 5. Projects

Thứ tự hiển thị trên trang chủ: 1–3 là `featured`. Vai trò và năm nằm ở đầu `description` vì schema không có trường riêng.

### 5.1 Accretech — Next Generation (featured)
- **Tags:** React, TypeScript, WebSocket, Context API, Cypress
- **description (EN):** ARIS Vietnam · 2023–2026 · Frontend developer. Web app that controls and monitors industrial wafer-processing machines in real time.
- **descriptionVi:** ARIS Vietnam · 2023–2026 · Frontend developer. Ứng dụng web điều khiển và giám sát máy xử lý wafer công nghiệp theo thời gian thực.
- **longDescription (EN):** Built and maintained production features in React and TypeScript. Streamed live machine status over WebSocket (WSS), managed shared state for live data and multi-step configuration with Context API and custom hooks, and built configuration screens generated from JSON schemas. Developed and documented 20+ reusable widgets for machine configuration and data visualization, refactored code for maintainability, and wrote Cypress tests for critical workflows.
- **longDescriptionVi:** Phát triển và bảo trì tính năng production bằng React và TypeScript. Hiển thị trạng thái máy trực tiếp qua WebSocket (WSS), quản lý state dùng chung cho dữ liệu live và luồng cấu hình nhiều bước bằng Context API và custom hook, dựng màn hình cấu hình sinh từ JSON schema. Phát triển và viết tài liệu cho hơn 20 widget tái sử dụng phục vụ cấu hình máy và trực quan hoá dữ liệu, refactor để dễ bảo trì, viết test Cypress cho các luồng quan trọng.
- Không có link công khai (dự án khách hàng).

### 5.2 Zonenop Game — real-time multiplayer platform (featured, mới)
- **Tags:** Next.js, TypeScript, Node.js, WebSocket, Redis, PostgreSQL, Docker
- **description (EN):** Personal project · Full-stack. Multiplayer rooms, chat, spectator mode, leaderboards and 8 board and card games.
- **descriptionVi:** Dự án cá nhân · Full-stack. Phòng chơi nhiều người, chat, chế độ xem, bảng xếp hạng và 8 game bài/cờ.
- **longDescription (EN):** Real-time gameplay over WebSocket with automatic reconnection that restores a player's seat after reloads or network drops. Server-authoritative design: each client receives only its own view, so hidden information never leaks. Redis compare-and-swap prevents races on concurrent moves and Redis pub/sub syncs rooms across instances. A shared game framework means a new game only needs a rule adapter and a table UI. AI-assisted code (Claude Code) kept in check with linting, Vitest unit and fuzz tests, and CI.
- **longDescriptionVi:** Gameplay real-time qua WebSocket, tự kết nối lại và khôi phục chỗ ngồi sau khi tải lại trang hoặc rớt mạng. Kiến trúc server-authoritative: mỗi client chỉ nhận phần trạng thái của mình nên thông tin ẩn không bị lộ. Redis compare-and-swap chống tranh chấp khi nhiều nước đi cùng lúc, Redis pub/sub đồng bộ phòng giữa các instance. Framework game dùng chung giúp thêm game mới chỉ cần rule adapter và giao diện bàn chơi. Code viết cùng AI (Claude Code) được kiểm soát bằng lint, Vitest unit/fuzz test và CI.
- **liveUrl:** https://zonenop-game.vercel.app/ · **githubUrl:** https://github.com/ThachHuynhIT/zonenop-game
- **image:** cần ảnh chụp màn hình thật (người dùng cung cấp hoặc chụp từ bản live); chưa có thì để trống, layout không dùng ảnh giữ chỗ.

### 5.3 Personal portfolio — 3D multi-experience platform (featured, mới)
- **Tags:** Next.js, TypeScript, React Three Fiber, Prisma, PostgreSQL, Cloudinary
- **description (EN):** Personal project · Full-stack. This site: bilingual portfolio with 3D scenes, an MDX blog, a photo gallery and its own CMS.
- **descriptionVi:** Dự án cá nhân · Full-stack. Chính trang này: portfolio song ngữ có cảnh 3D, blog MDX, thư viện ảnh và CMS riêng.
- **longDescription (EN):** Admin CMS with session-based authentication and content/media management on Prisma and PostgreSQL. Caching and tag revalidation keep public pages in sync with CMS edits. Lazy loading, reduced-motion support and WebGL error handling for performance and accessibility.
- **longDescriptionVi:** CMS quản trị có xác thực bằng session, quản lý nội dung và media trên Prisma và PostgreSQL. Cache và revalidate theo tag giữ trang công khai đồng bộ với CMS. Lazy loading, hỗ trợ reduced motion và xử lý lỗi WebGL cho hiệu năng và khả năng tiếp cận.
- **liveUrl:** https://portfolio-thach.vercel.app/ · **githubUrl:** https://github.com/ThachHuynhIT/portfolio

### 5.4 SUUTA — Front-end maintenance
- **Tags:** UI review, Frontend
- **description (EN):** ARIS Vietnam · 2023 · Frontend developer. Reviewed an existing interface for usability issues and inconsistent patterns, then shipped the fixes.
- **descriptionVi:** ARIS Vietnam · 2023 · Frontend developer. Rà soát giao diện có sẵn để tìm lỗi khả dụng và pattern không nhất quán, rồi triển khai bản sửa.

### 5.5 KMJ CMS Portal
- **Tags:** WordPress, PHP
- **description (EN):** ARIS Vietnam · 2023 · Developer. Built and maintained CMS features in WordPress and PHP, customizing themes and plugins.
- **descriptionVi:** ARIS Vietnam · 2023 · Developer. Xây dựng và bảo trì tính năng CMS bằng WordPress và PHP, tuỳ biến theme và plugin.

## 6. Các section khác

| Phần tử | EN | VI |
| --- | --- | --- |
| Heading Projects | Projects | Dự án |
| Link xem tất cả | All projects | Tất cả dự án |
| Heading Photos | Through my lens | Qua ống kính |
| Mô tả Photos | Photography is what I do away from the keyboard. | Chụp ảnh là việc tôi làm khi rời bàn phím. |
| Link Photos | Open the gallery | Mở thư viện ảnh |
| Heading Blog | Writing | Bài viết |
| Heading Contact | Let's talk | Liên hệ |
| Mô tả Contact | The fastest way to reach me is email. I usually reply within a day. | Cách nhanh nhất là email. Tôi thường trả lời trong vòng một ngày. |

"Usually reply within a day" là lời hứa cần người dùng xác nhận; nếu không chắc, bỏ câu thứ hai.

Contact form: nhãn "Name / Email / Subject / Message" ↔ "Tên / Email / Tiêu đề / Nội dung"; nút "Send message" ↔ "Gửi tin nhắn"; thành công "Message sent. I'll reply by email." ↔ "Đã gửi. Tôi sẽ trả lời qua email."; lỗi "Couldn't send your message. Check your connection and try again, or email me directly." ↔ "Chưa gửi được tin nhắn. Kiểm tra kết nối rồi thử lại, hoặc gửi email trực tiếp cho tôi."; nút copy "Copy email" → "Copied" ↔ "Sao chép email" → "Đã sao chép".

Footer: tên, link nhanh, social, "© 2026 Huynh Nguyen Thach". Không lặp bio.

## 7. Blog

Người dùng xác nhận các bài hiện có (11/2024, tutorial R3F/Framer Motion) là **demo**. Model `CmsBlogPost` không có cờ `published`, nên cách gỡ là xoá trong `/admin/blog`. Xoá là không hoàn tác → implementer liệt kê slug, người dùng xác nhận rồi mới xoá. Khi không còn bài, `BlogPreviewSection` ẩn hẳn và mục Blog trong nav/Hobby ẩn theo dữ liệu; trang `/blog` hiện trạng thái rỗng: "No posts yet." ↔ "Chưa có bài viết."

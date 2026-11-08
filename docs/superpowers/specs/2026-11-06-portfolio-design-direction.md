# Portfolio — Design Direction (frontend-design pass)

Ngày: 06/11/2026. Trạng thái: **đề xuất**, chưa được duyệt bằng prototype. Plan phải có cổng duyệt hero prototype (desktop + mobile, dark + light) trước khi nhân rộng sang các section.

Nguồn: review ngày 06/11/2026 (code, CI, site live https://portfolio-thach.vercel.app), `docs/HALLMARK_AUDIT.md`, nội dung CMS thật. Thay thế bản đề xuất cũ `docs/superpowers/plans/2026-10-26-portfolio-ui-update.md` (chưa được duyệt).

## 1. Đề bài

- **Chủ thể:** Huỳnh Nguyễn Thạch, Front-end Developer tại ARIS Vietnam (từ 07/2023), làm UI real-time cho hệ thống điều khiển máy xử lý wafer công nghiệp (Accretech), UI dựng từ JSON, component tái sử dụng. Ngoài ra chụp ảnh và nghe nhạc (Hobby).
- **Người xem:** nhà tuyển dụng và khách hàng (EN/VI), thường lướt nhanh trên điện thoại.
- **Việc chính của trang:** trong 10 giây cho thấy *làm gì, làm ở đâu, làm tốt đến đâu*, rồi dẫn tới dự án và liên hệ.

## 2. Quyết định đã chốt với người dùng

1. Giữ black hole WebGL làm điểm nhấn duy nhất của site.
2. Làm mới phần còn lại: bỏ gradient tím/cyan, glass, glow dùng tràn lan ở trang chủ.
3. Làm theo trình tự spec → plan theo phase; chưa sửa code ở bước này.
4. (06/11, bổ sung) Thêm animation cho các thành phần để trang sinh động hơn, theo phong cách vũ trụ — xem mục 8. Black hole vẫn là điểm nhấn chính; animation vũ trụ là lớp phụ, không cạnh tranh với nó.
5. (06/11) Nội dung EN/VI do Claude soạn từ CV: `docs/superpowers/specs/2026-11-06-portfolio-content.md`. Bỏ ParticleField ở Contact. Các bài blog hiện có là demo.

## 3. Chẩn đoán giao diện hiện tại (đã xem trên site live)

- Black hole bị `fixed` sau **toàn bộ trang** (`HeroSection.tsx`, wrapper `fixed inset-0`), nên Skills, Projects, Blog và Contact đều đặt card bán trong suốt lên vùng sáng của đĩa bồi tụ: chữ khó đọc, mắt không có chỗ nghỉ, và mất tác dụng "điểm nhấn".
- Mọi heading cùng một công thức: eyebrow chữ hoa giãn chữ + tiêu đề có **một từ** tô gradient tím→cyan ("Featured **Projects**", "Latest **Articles**", "Let's Work **Together**"). Đây là dấu hiệu template rõ nhất.
- Mọi thứ là card bo tròn giống hệt nhau. Project card dùng icon tên lửa làm ảnh giữ chỗ, tiêu đề bị cắt ("SUUTA – Front-end…").
- Skills có 4 tab lọc cho khoảng 10 kỹ năng: thừa thao tác.
- Bio ở Hero, About và Footer gần như lặp lại nhau. Title ghi "Front-end Web Developer", meta description ghi "Frontend Software Engineer".
- Mỗi section fade-up khi cuộn; hero trên mobile sau 3 giây vẫn đang mờ dần, CTA chưa hiện.
- Font `Inter` + `Space_Grotesk` chỉ nạp subset `latin` (`src/app/layout.tsx:24,29`), nên chữ tiếng Việt có dấu rơi về font fallback.
- Navigation: khi đang ở Photos/Blog, mục "Projects" vẫn sáng (scroll-spy chỉ biết các section có trong nav).
- Trang mobile cao khoảng 10.500 px.

## 4. Hệ token đề xuất

Ý tưởng: **"Đài quan sát"**. Black hole là vật thể duy nhất phát sáng; phần còn lại là không gian tối, chữ rõ, có kỷ luật như một bảng điều khiển thiết bị chính xác (gần với công việc thật của Thạch: UI điều khiển máy công nghiệp). Màu nhấn lấy từ chính đĩa bồi tụ trong render, không phải màu thương hiệu tùy ý.

### Màu

| Tên | Dark | Light | Vai trò |
| --- | --- | --- | --- |
| Void | `#05070D` | `#F5F6F8` | Nền trang |
| Hull | `#0C1018` | `#FFFFFF` | Bề mặt (form, khối dự án) — đặc, không trong suốt |
| Ink | `#ECE9E4` | `#10131A` | Chữ chính |
| Dust | `#9BA1AC` | `#4F5562` | Chữ phụ (phải ≥ 4.5:1 trên Void và Hull) |
| Accretion | `#F2B45A` | `#9A5B0B` | Màu nhấn duy nhất: CTA chính, link, focus ring, trạng thái active |
| Hairline | `rgba(236,233,228,0.12)` | `rgba(16,19,26,0.14)` | Viền, divider (control cần ≥ 3:1 → dùng bản đậm hơn cho viền input) |

Mọi cặp màu phải được đo lại khi triển khai; số trong bảng là điểm xuất phát, không phải đã đạt chuẩn. Không còn gradient chữ, `.glow-*`, `.glass` trên trang chủ (giữ class trong `globals.css` nếu route khác còn dùng).

### Chữ

- Một họ: **Be Vietnam Pro** (`next/font/google`, subsets `["latin", "vietnamese"]`), thiết kế bởi người Việt, đủ dấu, có nhiều weight. Lý do: site song ngữ EN/VI và chủ thể là dev Việt Nam; cũng sửa luôn lỗi subset hiện tại.
- Thang chữ (rem): 0.875 / 1 / 1.125 / 1.5 / 2.25 / 3.5 / 5.5 (hero, chỉ desktop). Body 1–1.125rem, line-height 1.6, tối đa ~68ch.
- Tên ở hero là phần typography duy nhất được "làm mạnh": weight 800, tracking âm nhẹ, màu Ink đặc (không gradient). Heading section weight 700, sentence case, không eyebrow.
- Không chữ hoa cho label, không monospace cho label nhỏ, không `→` gắn vào text nút.

### Bố cục

- Căn trái mọi section, kể cả hero. Một cột nội dung rộng tối đa ~1120px, lề 16px trên mobile.
- Black hole là một lớp `fixed` cấp trang trên `/`: giữ khung hero lệch phải trên desktop, phía trên tên trên mobile; khi cuộn thu nhỏ về cạnh phải (scale 0.62, opacity 0.42 dark / 0.24 light) và ở lại hết trang. Section dùng veil/scrim nhẹ, card vẫn rõ chữ. Reduced motion dùng glow tĩnh, không WebGL.

```
Desktop hero                          Mobile hero
+--------------------------------+    +----------------+
| nav                            |    | nav            |
|                                |    |   (black hole) |
| Huỳnh Nguyễn Thạch     ( O )   |    |      ( O )     |
| Front-end Developer   black    |    | Huỳnh Nguyễn   |
| ARIS Vietnam · HCMC    hole    |    | Thạch          |
| [Xem dự án] [CV]               |    | Front-end Dev  |
|                                |    | [Xem dự án]    |
+--------------------------------+    | [CV]           |
                                      +----------------+
```

## 5. Từng thành phần

| Thành phần | Hướng thay đổi |
| --- | --- |
| **Navigation** | Nền Void đặc khi đã cuộn, không pill gradient. Mục active dùng gạch chân Accretion. Scroll-spy: Photos/Blog làm sáng "Hobby" chứ không phải "Projects". Vùng bấm ≥ 44px trên mobile (theme, ngôn ngữ). Nút "Get in Touch" dùng Accretion đặc. |
| **Hero** | Tên đầy đủ (từ CMS), vai trò, một dòng ngữ cảnh (công ty, thành phố) lấy từ dữ liệu CMS hiện có, hai CTA. Bỏ đoạn bio dài (chuyển xuống About). Một khoảnh khắc chuyển động duy nhất khi tải trang: black hole sáng dần + chữ hiện; nội dung SSR phải nhìn thấy ngay khi chưa có JS; tôn trọng reduced motion. |
| **About** | Một đoạn ngắn + danh sách sự thật lấy từ CMS (kinh nghiệm, công ty, học vấn, nơi ở). Không bịa số liệu. Hai cột trên desktop (đoạn văn / sự thật), một cột trên mobile. |
| **Skills** | Bỏ tab lọc và card. Danh sách nhóm (Frontend / Backend / Tools…) dạng hàng chữ, icon nhỏ tùy chọn. Toàn bộ vừa một màn hình desktop. |
| **Projects** | Từ lưới card sang danh sách "hồ sơ dự án": tên đầy đủ (không cắt), bối cảnh/khách hàng, vai trò, stack, năm. Có ảnh thì hiện ảnh; không có ảnh thì không dùng icon tên lửa giữ chỗ. Dự án nổi bật (Accretech) chiếm hàng đầu rộng hơn. Giữ modal và link "Xem tất cả". |
| **Photo preview** | Giữ (là sở thích thật), nhưng thu nhỏ: dải 3–4 ảnh thay vì carousel cao 1.193px, link tới `/photography`. Nhắc: lightbox giữ dark-only. |
| **Blog preview** | Danh sách hàng: ngày, tiêu đề, thời gian đọc; không card. Ẩn cả section khi không có bài. Lưu ý nội dung: các bài hiện có (11/2024, tutorial R3F/Framer Motion) cần người dùng xác nhận là bài thật hay demo — không tự xoá/sửa CMS. |
| **Contact** | Email là hành động chính (to, có nút copy). Form đặt trên bề mặt Hull đặc, viền input ≥ 3:1, trạng thái lỗi/đang gửi/đã gửi rõ ràng. Bỏ hiệu ứng ParticleField nếu không còn phục vụ (đề xuất bỏ — một điểm nhấn duy nhất là black hole). |
| **Footer** | Bỏ đoạn bio lặp; còn tên, link nhanh, social (vùng bấm ≥ 44px), bản quyền. |
| **Button / UI chung** | Primary: nền Accretion, chữ Void (đo contrast). Secondary: viền Hairline đậm, chữ Ink. Focus ring Accretion 2px offset 2px ở cả hai theme. Một bán kính bo cho control (8px), bề mặt lớn bo nhỏ hơn hoặc không bo. |

## 6. Nguyên tắc

1. Một vật thể phát sáng: chỉ black hole được glow; không gì khác cạnh tranh.
2. Chữ phải đọc được trên lớp nền đang thực sự vẽ ra, ở cả dark và light.
3. Mọi nội dung từ CMS và locale; đổi copy CMS phải được người dùng duyệt trước khi ghi DB.
4. Chuyển động theo hệ "vũ trụ" ở mục 8: mỗi section có đúng một khoảnh khắc chuyển động khi xuất hiện, còn lại chỉ trả lời thao tác. Không fade-up đồng loạt cho mọi khối.
5. Tuân thủ `CLAUDE.md`: thêm `light:` cạnh class dark, không đụng route dark-only (`/admin`, `/couple`, `/music`) và lightbox.

## 7. Tự phản biện (đã chỉnh so với bản nháp đầu)

- Bản nháp đầu dùng nền gần đen + một accent cam sáng — đó là mặc định "near-black + một accent" của trang AI. Đã đổi: accent lấy từ màu thật của đĩa bồi tụ trong render, nền xanh-đen lạnh để tương phản với đĩa ấm, và giới hạn accent cho hành động/trạng thái thay vì trang trí.
- Bản nháp đầu dùng mono cho metadata dự án — bỏ, dùng cùng họ Be Vietnam Pro ở weight thấp.
- Bản nháp đầu đánh số 01/02/03 cho dự án — bỏ, vì danh sách dự án không phải trình tự.

## 8. Hệ chuyển động "vũ trụ" (bổ sung 06/11 theo yêu cầu người dùng)

Mục tiêu: trang sinh động hơn với hiệu ứng vũ trụ, nhưng mỗi hiệu ứng có một vai trò rõ, không trang trí tràn lan. Black hole vẫn là thứ sáng nhất trên màn hình.

### 8.1 Lớp nền

- **Lớp nền trang chủ:** chỉ một black hole WebGL fixed; không mount StarryBackground3D trên `/` (route khác giữ nguyên). Light theme có thể giữ chấm CSS. Renderer vẫn deferStart, camera scrollEffect theo toàn trang, tạm dừng khi tab ẩn.
- **Hero → About:** black hole di chuyển và thu nhỏ về khung companion ở cạnh phải rồi giữ nguyên; không biến mất, không pin hero.

### 8.2 Từng thành phần

| Thành phần | Hiệu ứng | Kích hoạt |
| --- | --- | --- |
| **Hero** | "Chân trời sự kiện": black hole bung sáng từ một điểm; tên gõ từng grapheme (≤ 1.6 s), caret tắt sau 1 s; vai trò, trạng thái, ngữ cảnh và CTA nối tiếp. Không blur chữ. Viết bằng CSS keyframes để chạy cả khi chưa hydrate; nội dung vẫn đọc được ở frame cuối khi không có JS. | Tải trang, một lần |
| **Navigation** | Vòng quỹ đạo mảnh quanh logo "TH" lấp đầy theo tiến độ cuộn trang. Gạch chân active trượt giữa các mục (Framer Motion `layoutId`). | Cuộn / chuyển section |
| **Heading section** | "Sao bừng sáng": một chấm Accretion nhỏ cạnh heading loé lên một lần, rồi một cung quỹ đạo mảnh vẽ dưới heading (`stroke-dashoffset`). | Vào viewport, một lần |
| **About** | Facts hiện lần lượt như các hành tinh vào quỹ đạo: dịch nhẹ theo cung (không thẳng đứng), cách nhau 60 ms. | Vào viewport, một lần |
| **Skills** | **Bản đồ chòm sao** (điểm nhớ thứ hai của trang): mỗi nhóm là một chòm sao, mỗi kỹ năng là một ngôi sao có nhãn, các đường nối vẽ dần khi vào viewport. Hover/focus một kỹ năng làm sao đó sáng lên cùng các đường nối. Mobile < 640px: danh sách có chấm sao, không vẽ đường. Markup thật là `<ul>` cho screen reader; SVG `aria-hidden`. | Vào viewport + hover/focus |
| **Projects** | "Thấu kính hấp dẫn": khi hover/focus một hồ sơ dự án, một vầng sáng radial mờ theo vị trí con trỏ (biến CSS cập nhật qua ref, không re-render), tiêu đề dịch 4px. Không tilt 3D. | Hover/focus |
| **Photo preview** | Ảnh trong dải trôi ở các độ sâu khác nhau khi cuộn (parallax 8–24px, transform qua ref). | Cuộn |
| **Blog preview** | Ẩn khi không có bài (bài hiện có là demo). Nếu sau này có bài: hàng trượt vào như sao băng ngắn (dịch ngang + vệt mờ), một lần. | Vào viewport |
| **Contact** | "Phát tín hiệu": khi đang gửi, nút gửi phát các vòng sóng đồng tâm; thành công thì vòng sóng lắng lại thành dấu xác nhận. Nút copy email phát một vòng sóng nhỏ. | Thao tác người dùng |
| **Footer** | Một sao băng vạch ngang footer một lần khi footer vào viewport. | Vào viewport, một lần |
| **Button / link** | Hover: viền sáng lên theo màu Accretion trong 150 ms; nhấn: scale 0.98. Không glow lan rộng. | Hover/nhấn |

### 8.3 Ràng buộc kỹ thuật

- Chỉ dùng Framer Motion (đã có) và CSS; không thêm thư viện (gsap sẽ bị gỡ ở Phase 0). Variants đặt trong `src/lib/animations.ts`, dùng `AnimatedSection` khi hợp.
- Chỉ animate `transform`, `opacity`, `clip-path` cho reveal một lần; không blur chữ hoặc animate layout. `stroke-dashoffset` chỉ dành cho hình trang trí; không animate layout.
- Không tạo `<Canvas>` R3F mới; homepage chỉ có black hole imperative; starfield ở route khác qua `SceneContainer`. Mọi vòng lặp dừng khi khuất màn hình hoặc tab ẩn.
- `prefers-reduced-motion`: tắt parallax, starfield trôi, vẽ đường và hero sequence; hiện trạng thái cuối ngay. Nội dung không bao giờ phụ thuộc animation để hiện ra.
- Ngân sách: cùng lúc chỉ một hiệu ứng lặp liên tục trong viewport ngoài black hole/starfield; 60 fps trên điện thoại tầm trung; không tăng đáng kể JS ban đầu của `/` (đo trước/sau).
- Hiệu ứng "một lần" dùng `viewport={{ once: true }}`; không chạy lại khi cuộn ngược.

### 8.4 Tự phản biện

- Rủi ro biến thành "trang nhiều hiệu ứng": giới hạn mỗi section một khoảnh khắc, và mọi hiệu ứng mang nghĩa (chòm sao = nhóm kỹ năng liên quan; sóng tín hiệu = đang gửi; quỹ đạo logo = tiến độ đọc).
- Đã cân nhắc và bỏ: con trỏ đuôi sao chổi (gây phân tâm, vô dụng trên cảm ứng), tilt 3D cho card (đã có và là dấu hiệu template), mưa sao băng liên tục (tốn pin, cạnh tranh với black hole).

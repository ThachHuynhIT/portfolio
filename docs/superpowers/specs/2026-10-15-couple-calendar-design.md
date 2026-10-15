# Lịch âm–dương & lịch đi làm cho trang `/couple` — Thiết kế

- **Ngày:** 2026-10-15
- **Branch:** `feature/couple-calendar` → PR vào `develop`
- **Trạng thái:** chờ duyệt

## 1. Mục tiêu

Thêm vào trang `/couple` một **lịch tháng gộp âm lịch + dương lịch**, hiển thị **lịch đi làm của cả hai người** để biết nhanh **ngày nào cả hai cùng nghỉ** (để hẹn nhau), kèm ngày lễ Việt Nam và các sự kiện của hai người (sinh nhật, ngày đặc biệt).

**Tiêu chí hoàn thành**

- Mở `/couple` → mục "Lịch của chúng mình" → thấy lịch tháng với ngày dương + ngày âm đúng (theo múi giờ Việt Nam, +7).
- Mỗi ngày thấy được mỗi người đi làm hay nghỉ; ngày cả hai cùng nghỉ được làm nổi bật; có dòng "Ngày cả hai cùng nghỉ tiếp theo".
- Admin cài lịch mỗi người (xoay vòng hoặc hành chính) và sửa riêng từng ngày trong `/admin/couple`.
- Sinh nhật / ngày đặc biệt nhập được theo âm lịch và tự quy ra ngày dương mỗi năm.

**Ngoài phạm vi (YAGNI):** ca kíp nhiều loại (ca ngày/ca đêm), giờ làm trong ngày, nhắc nhở/thông báo, xuất lịch (iCal), sửa lịch từ trang công khai, giao diện sáng (route `/couple` là dark-only).

## 2. Những gì người dùng đã chốt

| Câu hỏi | Lựa chọn |
|---|---|
| Lịch làm của ai | **Cả hai người**, mỗi người một lịch, cài trong `/admin/couple`, lưu DB; lịch làm nổi bật ngày cả hai cùng nghỉ |
| Kiểu lịch làm | **Xoay vòng** (làm N nghỉ M) + **Hành chính** (chọn thứ trong tuần) + **Sửa riêng từng ngày** |
| Lịch âm | Ngày âm trên từng ô + **mùng 1 / rằm** + **ngày lễ VN** + **sự kiện của hai người** + **sinh nhật/ngày đặc biệt theo âm lịch** |
| Tính âm lịch | Tự viết theo thuật toán **Hồ Ngọc Đức** (múi giờ +7), không dùng thư viện Trung Quốc (+8) |
| Kiểm thử | Thêm **Vitest** (devDependency) + script `npm test` |

## 3. Dữ liệu (Prisma, `prisma/schema.prisma`)

### 3.1 Model mới

```prisma
model CmsCoupleWorkSchedule {
  id           String        @id @default(cuid())
  coupleInfo   CmsCoupleInfo @relation(fields: [coupleInfoId], references: [id], onDelete: Cascade)
  coupleInfoId String        @default("singleton")
  person       Int           // 1 = person1, 2 = person2 (theo CmsCoupleInfo)
  enabled      Boolean       @default(true)
  type         String        // "rotation" | "office"
  startDate    String?       // rotation: "YYYY-MM-DD", ngày làm đầu tiên của chu kỳ
  workDays     Int?          // rotation: số ngày làm liên tiếp (>= 1)
  offDays      Int?          // rotation: số ngày nghỉ liên tiếp (>= 1)
  weekdays     Int[]         // office: thứ đi làm, 1 = Thứ Hai … 7 = Chủ Nhật

  @@unique([coupleInfoId, person])
  @@map("cms_couple_work_schedules")
}

model CmsCoupleWorkOverride {
  id           String        @id @default(cuid())
  coupleInfo   CmsCoupleInfo @relation(fields: [coupleInfoId], references: [id], onDelete: Cascade)
  coupleInfoId String        @default("singleton")
  person       Int           // 1 | 2
  date         String        // "YYYY-MM-DD"
  status       String        // "work" | "off"
  note         String?       // ví dụ "nghỉ phép", "đổi ca"

  @@unique([coupleInfoId, person, date])
  @@map("cms_couple_work_overrides")
}
```

`CmsCoupleInfo` thêm hai quan hệ `workSchedules` và `workOverrides`.

### 3.2 Cột mới cho dữ liệu sẵn có

`CmsCoupleBirthday` và `CmsCoupleSpecialDate` thêm:

```prisma
calendarType String @default("solar") // "solar" | "lunar"
```

Khi `calendarType = "lunar"`: phần **tháng–ngày** của `date` (`YYYY-MM-DD`) là **tháng–ngày âm lịch**; phần năm vẫn là năm gốc (năm sinh / năm diễn ra). Bản ghi cũ tự nhận `"solar"` — không cần chuyển đổi dữ liệu.

### 3.3 Áp schema

Repo không có `prisma/migrations` → schema được áp bằng `npx prisma db push`. Bước này chạy lên DB thật **sau khi merge**, do chủ repo chạy (hoặc Claude chạy khi được đồng ý); ghi rõ trong mô tả PR. Tất cả thay đổi đều là thêm mới (bảng mới, cột có default) nên không mất dữ liệu.

## 4. Logic thuần (không phụ thuộc React/DB, có test)

### 4.1 `src/lib/lunar.ts`

Cài đặt thuật toán Hồ Ngọc Đức với `timeZone = 7`.

- `solarToLunar(date: {y,m,d}) → { day, month, year, leap: boolean }`
- `lunarToSolar(lunar: {day, month, year, leap}) → {y,m,d} | null` — `null` nếu ngày không tồn tại (ví dụ ngày 30 của tháng thiếu, hoặc tháng nhuận không có năm đó).
- `lunarMonthLength(month, year, leap) → 29 | 30`
- `canChiYear(lunarYear)`, `canChiMonth(lunarMonth, lunarYear)`, `canChiDay(date)` → chuỗi tiếng Việt, ví dụ `"Bính Ngọ"`, `"Giáp Tý"`.
- Phạm vi hợp lệ: năm 1900–2199 (đủ dùng); ngoài phạm vi → ném lỗi rõ ràng.

### 4.2 `src/lib/vn-holidays.ts`

`getHolidays(date) → { name: string; kind: "lunar" | "solar" }[]`

- **Âm lịch:** Tết Nguyên Đán (1/1, 2/1, 3/1), Rằm tháng Giêng (15/1), Giỗ Tổ Hùng Vương (10/3), Phật Đản (15/4), Tết Đoan Ngọ (5/5), Vu Lan (15/7), Tết Trung Thu (15/8), Ông Công Ông Táo (23/12), Giao Thừa (ngày cuối tháng 12 âm — 29 hoặc 30). Chỉ áp cho tháng **không nhuận**.
- **Dương lịch:** Tết Dương lịch (1/1), Valentine (14/2), Quốc tế Phụ nữ (8/3), Giải phóng miền Nam (30/4), Quốc tế Lao động (1/5), Quốc khánh (2/9), Phụ nữ Việt Nam (20/10), Nhà giáo Việt Nam (20/11), Giáng Sinh (24/12, 25/12).
- Mùng 1 và rằm **không** nằm trong danh sách ngày lễ; giao diện tự đánh dấu dựa vào `solarToLunar`.

### 4.3 `src/lib/work-schedule.ts`

```ts
type WorkSchedule =
  | { type: "rotation"; enabled: boolean; startDate: string; workDays: number; offDays: number }
  | { type: "office"; enabled: boolean; weekdays: number[] };
type WorkOverride = { date: string; status: "work" | "off"; note?: string };

getWorkStatus(schedule, overrides, date) → { status: "work" | "off" | "none"; overridden: boolean; note?: string }
nextBothOff(s1, o1, s2, o2, from: string, maxDays = 366) → string | null
```

- **Ưu tiên:** ngày sửa riêng > lịch chung. Lịch tắt (`enabled = false`) hoặc chưa có → `"none"` (không vẽ vạch, không tính vào "cùng nghỉ" — trừ khi ngày đó có sửa riêng).
- **Xoay vòng:** `k = mod(daysBetween(startDate, date), workDays + offDays)`; `k < workDays` → làm. Dùng `mod` dương để ngày **trước** `startDate` vẫn đúng chu kỳ.
- **Hành chính:** thứ của ngày (1 = Thứ Hai … 7 = Chủ Nhật) có trong `weekdays` → làm.
- **Cùng nghỉ:** cả hai đều `"off"`. Nếu một người `"none"` thì không coi là cùng nghỉ.
- Mọi phép tính ngày dùng ngày lịch thuần (`YYYY-MM-DD` → số ngày từ mốc, theo UTC) để tránh lệch múi giờ / giờ mùa hè.

### 4.4 Quy đổi sự kiện âm lịch

`src/lib/couple-events.ts`: `occurrenceInYear(event, solarYear)` → ngày dương của sự kiện trong năm đó; `nextOccurrence(event, from)` dùng cho đếm ngược.

- Sự kiện âm lịch ngày 30 mà tháng âm năm đó chỉ có 29 ngày → lấy ngày 29.
- Tháng nhuận: dùng lần xuất hiện **không nhuận** của tháng đó.
- Một tháng âm có thể rơi vào hai năm dương (tháng 11–12 âm ↔ tháng 1–2 dương): `occurrenceInYear` tìm theo năm âm trùng hoặc liền trước sao cho kết quả rơi vào năm dương cần tìm.

## 5. Giao diện `/couple`

Thêm `SectionId` mới `"calendar"` ("Lịch của chúng mình", icon `calendar`) vào `SECTIONS`, `SECTION_COMPONENTS` và `BottomNav` trong `src/app/couple/page.tsx`. Component lịch đặt ở file riêng `src/components/couple/CoupleCalendar.tsx` (page.tsx đã 1.100+ dòng); style trong `couple.module.css` hoặc module CSS riêng `CoupleCalendar.module.css`.

- **Đầu trang:** tháng dương ("Tháng 10, 2026"); dưới là tháng âm + năm can chi ("Tháng 8 – 9 âm · năm Bính Ngọ"); nút ‹ ›, nút **Hôm nay**.
- **Dòng tóm tắt:** "Ngày cả hai cùng nghỉ tiếp theo: Thứ 7, 18/10 (còn 3 ngày)" — ẩn nếu chưa cài lịch hoặc không tìm thấy trong 366 ngày.
- **Lưới:** 7 cột, **bắt đầu Thứ Hai**; hiện đủ 6 hàng tuần (ngày tháng trước/sau mờ đi).
- **Ô ngày:**
  - Ngày dương (to) + ngày âm (nhỏ); mùng 1 ghi "1/9"; mùng 1 & rằm có màu nhấn.
  - Hai vạch ở đáy ô, màu riêng mỗi người (người 1 hồng, người 2 xanh): **đặc = làm**, **rỗng = nghỉ**, không vạch = chưa cài lịch; chấm nhỏ = ngày sửa riêng.
  - Cả hai cùng nghỉ → nền sáng nhẹ + tim nhỏ.
  - Ngày lễ → chấm màu; sinh nhật 🎂, ngày đặc biệt dùng emoji của sự kiện.
  - Hôm nay → viền sáng.
- **Bảng chi tiết** (bấm một ngày, mặc định là hôm nay) dưới lưới: ngày dương đầy đủ, ngày âm + can chi ngày, ngày lễ, sự kiện, trạng thái từng người kèm ghi chú (dùng tên `person1`/`person2`).
- **Chú thích màu** dưới lưới.
- **Mobile (375px):** ô ~44px chỉ hiện ngày dương, ngày âm, vạch, emoji; tên ngày lễ chỉ trong bảng chi tiết. Không có thanh cuộn ngang.
- **Truy cập:** ô ngày là `button` có `aria-label` đầy đủ ("Thứ Bảy 18 tháng 10, ngày 27 tháng 8 âm, cả hai cùng nghỉ"); điều hướng tháng bằng nút có nhãn.
- **Dark-only** (route `/couple` thuộc `EXCLUDED_ROUTE_PREFIXES`) — không thêm `light:`.

**Sections sẵn có:** `BirthdaySection` và `SpecialDatesSection` dùng `nextOccurrence` cho sự kiện âm lịch và hiện thêm "(15/8 âm lịch)". Ngày hiển thị là ngày dương sắp tới.

## 6. Admin `/admin/couple`

- Tab mới **"Lịch làm"**:
  - Hai thẻ (người 1, người 2): công tắc bật/tắt; chọn kiểu **Xoay vòng** (ngày bắt đầu, số ngày làm, số ngày nghỉ) / **Hành chính** (tick Thứ 2 … CN); dải **xem trước 14 ngày** dùng `getWorkStatus`.
  - **Ngày sửa riêng:** danh sách (ngày, người, làm/nghỉ, ghi chú) — thêm, xoá; sắp xếp theo ngày, mặc định chỉ hiện từ hôm nay trở đi kèm nút "Hiện ngày đã qua".
- Form sinh nhật / ngày đặc biệt: thêm chọn **Dương lịch / Âm lịch**; khi âm lịch, nhãn ô ngày đổi thành "Ngày âm (năm gốc)" và hiện ngày dương tương ứng năm nay để đối chiếu.
- Tab "Lịch làm" là form mới nên dùng `react-hook-form` + `zod` theo CLAUDE.md (các tab admin couple hiện có dùng `useState` thuần; phần thêm vào form sinh nhật/ngày đặc biệt giữ kiểu sẵn có của form đó, không viết lại). Ràng buộc: `workDays`, `offDays` là số nguyên 1–30; rotation bắt buộc `startDate`; office cần ít nhất 1 thứ; override không trùng (người, ngày).

## 7. API

- `GET /api/couple` (công khai): trả thêm `workSchedules: WorkSchedule & { person }[]` (chỉ bản ghi `enabled`) và `workOverrides` (tất cả); `birthdays`/`specialDates` trả thêm `calendarType`.
- `GET/PUT /api/admin/couple/work-schedules` — đọc / ghi lịch của cả hai người (upsert theo `person`).
- `POST /api/admin/couple/work-overrides` — thêm (upsert theo người + ngày); `DELETE /api/admin/couple/work-overrides/[id]` — xoá.
- Route admin gọi `requireAdminSession()`, kiểm tra body bằng zod, gọi `revalidateTag("couple")` sau khi ghi (tag của `getPublishedCoupleData` trong `src/lib/content/couple.ts`).
- Đọc/ghi qua `src/lib/content/couple.ts` (quy ước repo: không gọi Prisma trực tiếp trong route).

## 8. Kiểm thử

**Vitest** (devDependency), `npm test` → `vitest run`; cấu hình alias `@/*` → `./src/*`. Chỉ test logic thuần:

- `lunar.test.ts`
  - Tết: 2024-02-10, 2025-01-29, 2026-02-17 ↔ 1/1 âm.
  - **Tết 1985 = 1985-01-21** (lịch Việt; lịch Trung Quốc là 20/2) — xác nhận dùng múi giờ +7.
  - Năm 2025 có **tháng 6 nhuận**; một ngày trong tháng nhuận trả `leap: true`.
  - `lunarToSolar(solarToLunar(x)) === x` cho mọi ngày trong 2024–2026.
  - Can chi: năm 2026 = "Bính Ngọ"; 2024 = "Giáp Thìn".
- `work-schedule.test.ts` — làm 1 nghỉ 2 trước/sau/đúng `startDate`; hành chính T2–T6; override ghi đè cả hai chiều; lịch tắt → `"none"`; `nextBothOff` tìm đúng và trả `null` khi không có.
- `couple-events.test.ts` — sinh nhật âm 15/8 → ngày dương đúng cho 2025, 2026; ngày 30 rơi vào tháng thiếu → 29; tháng 12 âm rơi sang năm dương sau.
- `vn-holidays.test.ts` — Trung Thu 2026, Giao Thừa (tháng 12 thiếu/đủ), 30/4.

**Thủ công trên trình duyệt:** `/couple` ở 375px và desktop (không tràn ngang, ô đọc được), chuyển tháng, chọn ngày, dữ liệu từ admin hiển thị đúng; `/admin/couple` lưu/xoá được. Chạy `npx tsc --noEmit -p .` và `npm run lint`.

## 9. Rủi ro & lưu ý

- **`prisma db push` lên DB thật** sau merge — bắt buộc trước khi deploy code mới, nếu không `/api/couple` lỗi vì thiếu bảng/cột. Ghi trong PR, kèm thứ tự: push schema → deploy.
- **Thuật toán âm lịch:** sai một ngày là lỗi khó thấy → dựa vào test với các mốc đã biết ở mục 8.
- **Dữ liệu override tăng dần theo thời gian:** trả hết ở `/api/couple` là chấp nhận được (vài trăm dòng/năm); nếu cần sau này mới lọc theo khoảng ngày.

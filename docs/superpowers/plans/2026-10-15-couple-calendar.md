# Couple Calendar (Lịch âm–dương & lịch đi làm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a combined lunar + solar month calendar to `/couple` that shows both partners' work schedules (rotation / office / per-day overrides), highlights days both are off, and supports lunar-dated birthdays/special dates — all editable in `/admin/couple`.

**Architecture:** Pure, framework-free date logic in `src/lib/` (`ymd`, `lunar`, `vn-holidays`, `work-schedule`, `couple-events`) covered by Vitest. Two new Prisma models + a `calendarType` column, read/written only through `src/lib/content/couple.ts`; public data rides on the existing `/api/couple` payload, admin writes go through new `/api/admin/couple/work-*` routes. The UI is a new `CoupleCalendar` client component mounted as a new section of the existing `/couple` page, plus a new "Lịch làm" admin tab component.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Prisma 7 (Postgres), Framer Motion, CSS Modules, react-hook-form + zod 4, Vitest 3.

**Spec:** `docs/superpowers/specs/2026-10-15-couple-calendar-design.md`

## Global Constraints

- Lunar math: Hồ Ngọc Đức algorithm with **timeZone = 7**; valid years **1900–2199**, outside → throw `RangeError`.
- Dates in data and between modules are `"YYYY-MM-DD"` strings; day arithmetic goes through `src/lib/ymd.ts` (UTC day index), never local `Date` math.
- Weekday numbering everywhere: **1 = Thứ Hai … 7 = Chủ Nhật**; calendar grid starts on Monday.
- `person` is `1 | 2`, mapping to `CoupleData.person1` / `person2`.
- `calendarType` is `"solar" | "lunar"`, default `"solar"`; for lunar entries the month–day of `date` is lunar, the year is the original year.
- Work status values: `"work" | "off" | "none"`; override `status` is `"work" | "off"`.
- `/couple` and `/admin` are dark-only (`EXCLUDED_ROUTE_PREFIXES`) — **no `light:` classes** in any file this plan touches.
- All Three.js rules irrelevant here; all new client components start with `"use client"`.
- New admin form ("Lịch làm" tab) uses `react-hook-form` + `zod` + `@hookform/resolvers/zod` (`import { z } from "zod"`).
- Admin API routes call `requireAdminSession()` first and `revalidateTag("couple")` after every write; DB access only via `src/lib/content/couple.ts`.
- Vitest pinned: `vitest@3.2.4`. Test script: `"test": "vitest run"`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Schema is applied with `npx prisma db push` — **do not run it against the real DB during implementation**; only `npx prisma validate` and `npx prisma generate`.

## Review Focus

1. **Lunar day 30 in a 29-day month / leap months** — a lunar birthday on "30/12" must still appear (on day 29, the last day of the month) in years where lunar month 12 is short, and a date inside a leap month must never be reported as the regular month. Pinned in Task 2 (`lunarToSolar` returns `null` for day 30 of a 29-day month) and Task 5 (`occurrenceInYear` clamps to 29).
2. **Rotation dates before `startDate`** — a negative day offset must still follow the cycle (naive `%` gives negative indices). Pinned in Task 4 (`"2026-10-14"` with start `"2026-10-15"`, 1-on-2-off → off).
3. **Lunar month 11/12 crossing into the next solar year** — e.g. a birthday on 15/12 âm lands in January/February of the following solar year. Pinned in Task 5.
4. **Timezone drift** — a visitor whose browser is UTC−X must not see dates shifted by one. Pinned by design (all `ymd` math in UTC day indices) and in Task 1 (`addDays` across DST-sensitive dates `2026-03-29`, `2026-10-25`).
5. **One partner without a schedule** — "next both off" must not claim a date when someone's status is `"none"`, and the summary line must hide. Pinned in Task 4 (`nextBothOff` returns `null` when one schedule is disabled).

---

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.mts` (create) | Vitest config with `@/` alias |
| `src/lib/ymd.ts` (create) | `"YYYY-MM-DD"` parse/format, UTC day index, add/diff days, ISO weekday |
| `src/lib/lunar.ts` (create) | Solar↔lunar conversion (Hồ Ngọc Đức, +7), month length, can chi |
| `src/lib/vn-holidays.ts` (create) | Vietnamese lunar + solar holidays for a date |
| `src/lib/work-schedule.ts` (create) | Work status per date, next day both are off |
| `src/lib/couple-events.ts` (create) | Solar occurrence of solar/lunar yearly events |
| `src/lib/*.test.ts` (create) | Vitest unit tests next to each module |
| `prisma/schema.prisma` (modify) | 2 new models, `calendarType` columns, relations |
| `src/lib/types.ts` (modify) | `CalendarType`, `CoupleWorkSchedule`, `CoupleWorkOverride`, extend `CoupleData` |
| `src/lib/content/couple.ts` (modify) | Map/read/write schedules, overrides, calendarType |
| `src/app/api/admin/couple/route.ts` (modify) | Pass `calendarType` through create |
| `src/app/api/admin/couple/work-schedules/route.ts` (create) | GET/PUT both schedules |
| `src/app/api/admin/couple/work-overrides/route.ts` (create) | POST (upsert) override |
| `src/app/api/admin/couple/work-overrides/[id]/route.ts` (create) | DELETE override |
| `src/components/couple/CoupleCalendar.tsx` (create) | Month calendar UI + day detail panel |
| `src/components/couple/CoupleCalendar.module.css` (create) | Calendar styles |
| `src/app/couple/page.tsx` (modify) | New `calendar` section; lunar-aware birthdays/special dates |
| `src/components/admin/couple/WorkScheduleTab.tsx` (create) | Admin "Lịch làm" tab (RHF + zod) |
| `src/app/admin/couple/page.tsx` (modify) | New tab, calendarType selects in birthday/date forms |
| `src/app/api/couple/route.ts` (modify) | Empty fallback includes new arrays |

---

### Task 1: Vitest setup + `ymd` date helpers

**Files:**
- Modify: `package.json` (devDependency + `test` script)
- Create: `vitest.config.mts`
- Create: `src/lib/ymd.ts`
- Test: `src/lib/ymd.test.ts`

**Interfaces:**
- Produces:
  - `type Ymd = { y: number; m: number; d: number }`
  - `parseYmd(s: string): Ymd` (throws `Error` on bad format)
  - `formatYmd(v: Ymd): string`
  - `dayIndex(s: string): number` — days since 1970-01-01 (UTC)
  - `fromDayIndex(n: number): string`
  - `addDays(s: string, n: number): string`
  - `daysBetween(a: string, b: string): number` — `dayIndex(b) - dayIndex(a)`
  - `isoWeekday(s: string): number` — 1 = Monday … 7 = Sunday
  - `todayYmd(now?: Date): string` — local calendar date of `now`

- [ ] **Step 1: Install Vitest and add the script**

```bash
npm install -D vitest@3.2.4
```

Then in `package.json` `"scripts"` add after `"lint"`:

```json
    "test": "vitest run",
```

- [ ] **Step 2: Create `vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Write the failing test `src/lib/ymd.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { addDays, dayIndex, daysBetween, formatYmd, fromDayIndex, isoWeekday, parseYmd, todayYmd } from "./ymd";

describe("ymd", () => {
  it("parses and formats", () => {
    expect(parseYmd("2026-02-07")).toEqual({ y: 2026, m: 2, d: 7 });
    expect(formatYmd({ y: 2026, m: 2, d: 7 })).toBe("2026-02-07");
    expect(() => parseYmd("2026-2-7x")).toThrow();
  });

  it("round-trips day indices", () => {
    expect(dayIndex("1970-01-01")).toBe(0);
    expect(fromDayIndex(dayIndex("2026-10-15"))).toBe("2026-10-15");
  });

  it("adds days across month/year and DST-sensitive dates", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-15", "2026-10-12")).toBe(-3);
  });

  it("uses Monday = 1 … Sunday = 7", () => {
    expect(isoWeekday("2026-10-12")).toBe(1); // Monday
    expect(isoWeekday("2026-10-18")).toBe(7); // Sunday
  });

  it("formats today from local calendar fields", () => {
    expect(todayYmd(new Date(2026, 9, 15, 23, 59))).toBe("2026-10-15");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/lib/ymd.test.ts`
Expected: FAIL — `Failed to resolve import "./ymd"`

- [ ] **Step 5: Implement `src/lib/ymd.ts`**

```ts
// Calendar-date helpers for "YYYY-MM-DD" strings. All arithmetic runs on UTC
// day indices so results never shift with the viewer's timezone or DST.

export type Ymd = { y: number; m: number; d: number };

const MS_PER_DAY = 86_400_000;
const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseYmd(s: string): Ymd {
  const match = YMD_RE.exec(s);
  if (!match) throw new Error(`Invalid date "${s}", expected YYYY-MM-DD`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function formatYmd({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function dayIndex(s: string): number {
  const { y, m, d } = parseYmd(s);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromDayIndex(n: number): string {
  const date = new Date(n * MS_PER_DAY);
  return formatYmd({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() });
}

export function addDays(s: string, n: number): string {
  return fromDayIndex(dayIndex(s) + n);
}

export function daysBetween(a: string, b: string): number {
  return dayIndex(b) - dayIndex(a);
}

/** 1 = Monday … 7 = Sunday. 1970-01-01 was a Thursday (4). */
export function isoWeekday(s: string): number {
  return ((((dayIndex(s) + 3) % 7) + 7) % 7) + 1;
}

export function todayYmd(now: Date = new Date()): string {
  return formatYmd({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/ymd.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.mts src/lib/ymd.ts src/lib/ymd.test.ts
git commit -m "test: add Vitest and timezone-safe YYYY-MM-DD helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lunar calendar conversion (`lunar.ts`)

**Files:**
- Create: `src/lib/lunar.ts`
- Test: `src/lib/lunar.test.ts`

**Interfaces:**
- Consumes: `parseYmd`, `formatYmd` from `src/lib/ymd.ts` (tests also use `addDays`)
- Produces:
  - `type LunarDate = { day: number; month: number; year: number; leap: boolean }`
  - `solarToLunar(date: string): LunarDate`
  - `lunarToSolar(lunar: LunarDate): string | null` — `null` if that lunar date does not exist
  - `lunarMonthLength(month: number, year: number, leap: boolean): 29 | 30 | null`
  - `canChiYear(lunarYear: number): string`
  - `canChiMonth(lunarMonth: number, lunarYear: number): string`
  - `canChiDay(date: string): string`

- [ ] **Step 1: Write the failing test `src/lib/lunar.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { addDays } from "./ymd";
import { canChiDay, canChiMonth, canChiYear, lunarMonthLength, lunarToSolar, solarToLunar } from "./lunar";

describe("solarToLunar", () => {
  it.each([
    ["2024-02-10", 2024],
    ["2025-01-29", 2025],
    ["2026-02-17", 2026],
  ])("Tết %s is 1/1/%i", (solar, year) => {
    expect(solarToLunar(solar)).toEqual({ day: 1, month: 1, year, leap: false });
  });

  it("uses the Vietnamese (+7) timezone: Tết 1985 is 1985-01-21", () => {
    expect(solarToLunar("1985-01-21")).toEqual({ day: 1, month: 1, year: 1985, leap: false });
  });

  it("detects the leap 6th month of 2025", () => {
    const inLeap = solarToLunar("2025-07-30");
    expect(inLeap.month).toBe(6);
    expect(inLeap.leap).toBe(true);
    expect(solarToLunar("2025-06-30").leap).toBe(false);
  });

  it("puts the last days of lunar month 12 in the previous lunar year", () => {
    const eve = solarToLunar("2026-02-16");
    expect(eve).toMatchObject({ month: 12, year: 2025, leap: false });
  });

  it("throws outside 1900–2199", () => {
    expect(() => solarToLunar("1899-12-31")).toThrow(RangeError);
  });
});

describe("lunarToSolar", () => {
  it("round-trips every day of 2024–2026", () => {
    let d = "2024-01-01";
    while (d <= "2026-12-31") {
      expect(lunarToSolar(solarToLunar(d))).toBe(d);
      d = addDays(d, 1);
    }
  });

  it("returns null for a leap flag on a non-leap month", () => {
    expect(lunarToSolar({ day: 1, month: 5, year: 2025, leap: true })).toBeNull();
  });

  it("returns null for day 30 of a 29-day month", () => {
    const year = 2026;
    const shortMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(
      (m) => lunarMonthLength(m, year, false) === 29
    )!;
    expect(lunarToSolar({ day: 30, month: shortMonth, year, leap: false })).toBeNull();
    expect(lunarToSolar({ day: 29, month: shortMonth, year, leap: false })).not.toBeNull();
  });
});

describe("can chi", () => {
  it("names years", () => {
    expect(canChiYear(2026)).toBe("Bính Ngọ");
    expect(canChiYear(2024)).toBe("Giáp Thìn");
  });
  it("names the first lunar month as a Dần month", () => {
    expect(canChiMonth(1, 2026)).toBe("Canh Dần");
  });
  it("names days with a 60-day cycle", () => {
    const a = canChiDay("2026-10-15");
    expect(canChiDay(addDays("2026-10-15", 60))).toBe(a);
    expect(canChiDay(addDays("2026-10-15", 1))).not.toBe(a);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lunar.test.ts`
Expected: FAIL — `Failed to resolve import "./lunar"`

- [ ] **Step 3: Implement `src/lib/lunar.ts`**

```ts
// Vietnamese lunar calendar (âm lịch) conversion — Hồ Ngọc Đức's algorithm
// (https://www.informatik.uni-leipzig.de/~duc/amlich/) computed for UTC+7.
// Chinese libraries use UTC+8 and occasionally disagree by a day or a month
// (e.g. Tết 1985), so don't swap this for one.

import { formatYmd, parseYmd } from "./ymd";

export type LunarDate = { day: number; month: number; year: number; leap: boolean };

const TIME_ZONE = 7;
const MIN_YEAR = 1900;
const MAX_YEAR = 2199;
const INT = Math.floor;

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

function jdToDate(jd: number): string {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);
  return formatYmd({ y: year, m: month, d: day });
}

function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + C1 - deltat;
}

function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return L;
}

function getSunLongitude(dayNumber: number): number {
  return INT((sunLongitude(dayNumber - 0.5 - TIME_ZONE / 24) / Math.PI) * 6);
}

function getNewMoonDay(k: number): number {
  return INT(newMoon(k) + 0.5 + TIME_ZONE / 24);
}

function getLunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k);
  if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
  return nm;
}

function getLeapMonthOffset(a11: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

function assertYear(year: number) {
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`Lunar calendar supports ${MIN_YEAR}–${MAX_YEAR}, got ${year}`);
  }
}

export function solarToLunar(date: string): LunarDate {
  const { y: yy, m: mm, d: dd } = parseYmd(date);
  assertYear(yy);
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k);
  let a11 = getLunarMonth11(yy);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let leap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) leap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

/** Julian day number of the first day of the given lunar month, or null if it doesn't exist. */
function lunarMonthStart(month: number, year: number, leap: boolean): number | null {
  assertYear(year);
  let a11: number;
  let b11: number;
  if (month < 11) {
    a11 = getLunarMonth11(year - 1);
    b11 = getLunarMonth11(year);
  } else {
    a11 = getLunarMonth11(year);
    b11 = getLunarMonth11(year + 1);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = month - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) return null;
    if (leap || off >= leapOff) off += 1;
  } else if (leap) {
    return null;
  }
  return getNewMoonDay(k + off);
}

export function lunarMonthLength(month: number, year: number, leap: boolean): 29 | 30 | null {
  const start = lunarMonthStart(month, year, leap);
  if (start === null) return null;
  // The next month starts at the next new moon after `start`.
  const k = INT((start + 15 - 2415021.076998695) / 29.530588853);
  let next = getNewMoonDay(k);
  if (next <= start) next = getNewMoonDay(k + 1);
  return next - start === 29 ? 29 : 30;
}

export function lunarToSolar({ day, month, year, leap }: LunarDate): string | null {
  const start = lunarMonthStart(month, year, leap);
  if (start === null) return null;
  const length = lunarMonthLength(month, year, leap);
  if (length === null || day < 1 || day > length) return null;
  return jdToDate(start + day - 1);
}

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export function canChiYear(lunarYear: number): string {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}

export function canChiMonth(lunarMonth: number, lunarYear: number): string {
  return `${CAN[(lunarYear * 12 + lunarMonth + 3) % 10]} ${CHI[(lunarMonth + 1) % 12]}`;
}

export function canChiDay(date: string): string {
  const { y, m, d } = parseYmd(date);
  const jd = jdFromDate(d, m, y);
  return `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lunar.test.ts`
Expected: PASS. If a known-date assertion fails, compare against https://www.informatik.uni-leipzig.de/~duc/amlich/ for that date before touching the algorithm — the expected values in the test are the source of truth only if they match that reference.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lunar.ts src/lib/lunar.test.ts
git commit -m "feat(calendar): Vietnamese lunar calendar conversion (UTC+7)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Vietnamese holidays (`vn-holidays.ts`)

**Files:**
- Create: `src/lib/vn-holidays.ts`
- Test: `src/lib/vn-holidays.test.ts`

**Interfaces:**
- Consumes: `solarToLunar`, `lunarMonthLength` (Task 2); `parseYmd` (Task 1)
- Produces:
  - `type Holiday = { name: string; kind: "lunar" | "solar" }`
  - `getHolidays(date: string): Holiday[]`

- [ ] **Step 1: Write the failing test `src/lib/vn-holidays.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { getHolidays } from "./vn-holidays";

const names = (d: string) => getHolidays(d).map((h) => h.name);

describe("getHolidays", () => {
  it("finds lunar holidays", () => {
    expect(names("2026-02-17")).toContain("Tết Nguyên Đán");
    expect(names("2026-09-25")).toContain("Tết Trung Thu"); // 15/8 âm 2026
  });

  it("finds Giao thừa on the last day of lunar month 12", () => {
    expect(names("2026-02-16")).toContain("Giao Thừa");
    expect(names("2026-02-15")).not.toContain("Giao Thừa");
  });

  it("finds solar holidays", () => {
    expect(getHolidays("2026-04-30")).toEqual([{ name: "Giải phóng miền Nam", kind: "solar" }]);
    expect(names("2026-02-14")).toContain("Valentine");
  });

  it("returns an empty list on ordinary days", () => {
    expect(getHolidays("2026-10-13")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/vn-holidays.test.ts`
Expected: FAIL — `Failed to resolve import "./vn-holidays"`

- [ ] **Step 3: Implement `src/lib/vn-holidays.ts`**

```ts
import { lunarMonthLength, solarToLunar } from "./lunar";
import { parseYmd } from "./ymd";

export type Holiday = { name: string; kind: "lunar" | "solar" };

// "month-day" keys. Lunar ones apply to non-leap months only.
const LUNAR_HOLIDAYS: Record<string, string> = {
  "1-1": "Tết Nguyên Đán",
  "1-2": "Tết Nguyên Đán",
  "1-3": "Tết Nguyên Đán",
  "1-15": "Rằm tháng Giêng",
  "3-10": "Giỗ Tổ Hùng Vương",
  "4-15": "Phật Đản",
  "5-5": "Tết Đoan Ngọ",
  "7-15": "Vu Lan",
  "8-15": "Tết Trung Thu",
  "12-23": "Ông Công Ông Táo",
};

const SOLAR_HOLIDAYS: Record<string, string> = {
  "1-1": "Tết Dương lịch",
  "2-14": "Valentine",
  "3-8": "Quốc tế Phụ nữ",
  "4-30": "Giải phóng miền Nam",
  "5-1": "Quốc tế Lao động",
  "9-2": "Quốc khánh",
  "10-20": "Phụ nữ Việt Nam",
  "11-20": "Nhà giáo Việt Nam",
  "12-24": "Giáng Sinh",
  "12-25": "Giáng Sinh",
};

export function getHolidays(date: string): Holiday[] {
  const result: Holiday[] = [];
  const lunar = solarToLunar(date);
  if (!lunar.leap) {
    const lunarName = LUNAR_HOLIDAYS[`${lunar.month}-${lunar.day}`];
    if (lunarName) result.push({ name: lunarName, kind: "lunar" });
    if (lunar.month === 12 && lunar.day === lunarMonthLength(12, lunar.year, false)) {
      result.push({ name: "Giao Thừa", kind: "lunar" });
    }
  }
  const { m, d } = parseYmd(date);
  const solarName = SOLAR_HOLIDAYS[`${m}-${d}`];
  if (solarName) result.push({ name: solarName, kind: "solar" });
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/vn-holidays.test.ts`
Expected: PASS (4 tests). If the Trung Thu or Giao Thừa dates are off by one, re-derive them with `solarToLunar` in a quick `node`-free check inside the test (`console.log(solarToLunar("2026-09-25"))`) and fix the **test date**, not the table — Task 2 already pins the algorithm.

- [ ] **Step 5: Commit**

```bash
git add src/lib/vn-holidays.ts src/lib/vn-holidays.test.ts
git commit -m "feat(calendar): Vietnamese lunar and solar holidays

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Work schedule logic (`work-schedule.ts`)

**Files:**
- Create: `src/lib/work-schedule.ts`
- Test: `src/lib/work-schedule.test.ts`

**Interfaces:**
- Consumes: `daysBetween`, `isoWeekday`, `addDays` (Task 1)
- Produces:
  - `type WorkSchedule = { type: "rotation"; enabled: boolean; startDate: string; workDays: number; offDays: number } | { type: "office"; enabled: boolean; weekdays: number[] }`
  - `type WorkOverride = { date: string; status: "work" | "off"; note?: string }`
  - `type WorkStatus = { status: "work" | "off" | "none"; overridden: boolean; note?: string }`
  - `getWorkStatus(schedule: WorkSchedule | null | undefined, overrides: WorkOverride[], date: string): WorkStatus`
  - `isBothOff(a: WorkStatus, b: WorkStatus): boolean`
  - `nextBothOff(s1, o1, s2, o2, from: string, maxDays?: number): string | null`

- [ ] **Step 1: Write the failing test `src/lib/work-schedule.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { getWorkStatus, isBothOff, nextBothOff, type WorkSchedule } from "./work-schedule";

const oneOnTwoOff: WorkSchedule = { type: "rotation", enabled: true, startDate: "2026-10-15", workDays: 1, offDays: 2 };
const office: WorkSchedule = { type: "office", enabled: true, weekdays: [1, 2, 3, 4, 5] };

describe("getWorkStatus — rotation", () => {
  it.each([
    ["2026-10-15", "work"],
    ["2026-10-16", "off"],
    ["2026-10-17", "off"],
    ["2026-10-18", "work"],
    ["2026-10-14", "off"], // before startDate still follows the cycle
    ["2026-10-12", "work"],
  ])("%s → %s", (date, status) => {
    expect(getWorkStatus(oneOnTwoOff, [], date).status).toBe(status);
  });
});

describe("getWorkStatus — office", () => {
  it("works Monday–Friday", () => {
    expect(getWorkStatus(office, [], "2026-10-16").status).toBe("work"); // Fri
    expect(getWorkStatus(office, [], "2026-10-17").status).toBe("off"); // Sat
  });
});

describe("overrides and disabled schedules", () => {
  it("lets an override win in both directions", () => {
    const overrides = [
      { date: "2026-10-16", status: "work" as const, note: "tăng ca" },
      { date: "2026-10-15", status: "off" as const, note: "nghỉ phép" },
    ];
    expect(getWorkStatus(oneOnTwoOff, overrides, "2026-10-16")).toEqual({ status: "work", overridden: true, note: "tăng ca" });
    expect(getWorkStatus(oneOnTwoOff, overrides, "2026-10-15")).toEqual({ status: "off", overridden: true, note: "nghỉ phép" });
  });

  it("returns none for missing or disabled schedules, unless overridden", () => {
    expect(getWorkStatus(null, [], "2026-10-15").status).toBe("none");
    expect(getWorkStatus({ ...office, enabled: false }, [], "2026-10-15").status).toBe("none");
    expect(getWorkStatus(null, [{ date: "2026-10-15", status: "off" }], "2026-10-15").status).toBe("off");
  });
});

describe("both off", () => {
  it("requires both partners off", () => {
    expect(isBothOff({ status: "off", overridden: false }, { status: "off", overridden: false })).toBe(true);
    expect(isBothOff({ status: "off", overridden: false }, { status: "none", overridden: false })).toBe(false);
  });

  it("finds the next shared day off", () => {
    // Office is off Sat 17/10; rotation is off 16 & 17/10 → first shared day is 17/10.
    expect(nextBothOff(oneOnTwoOff, [], office, [], "2026-10-15")).toBe("2026-10-17");
  });

  it("returns null when a partner has no schedule", () => {
    expect(nextBothOff(oneOnTwoOff, [], null, [], "2026-10-15")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/work-schedule.test.ts`
Expected: FAIL — `Failed to resolve import "./work-schedule"`

- [ ] **Step 3: Implement `src/lib/work-schedule.ts`**

```ts
import { addDays, daysBetween, isoWeekday } from "./ymd";

export type WorkSchedule =
  | { type: "rotation"; enabled: boolean; startDate: string; workDays: number; offDays: number }
  | { type: "office"; enabled: boolean; weekdays: number[] };

export type WorkOverride = { date: string; status: "work" | "off"; note?: string };

export type WorkStatus = { status: "work" | "off" | "none"; overridden: boolean; note?: string };

/** A per-day override always wins; a missing/disabled schedule yields "none". */
export function getWorkStatus(
  schedule: WorkSchedule | null | undefined,
  overrides: WorkOverride[],
  date: string
): WorkStatus {
  const override = overrides.find((o) => o.date === date);
  if (override) return { status: override.status, overridden: true, note: override.note };
  if (!schedule || !schedule.enabled) return { status: "none", overridden: false };

  if (schedule.type === "office") {
    return { status: schedule.weekdays.includes(isoWeekday(date)) ? "work" : "off", overridden: false };
  }

  const cycle = schedule.workDays + schedule.offDays;
  // Positive modulo so days before startDate still follow the cycle.
  const position = ((daysBetween(schedule.startDate, date) % cycle) + cycle) % cycle;
  return { status: position < schedule.workDays ? "work" : "off", overridden: false };
}

export function isBothOff(a: WorkStatus, b: WorkStatus): boolean {
  return a.status === "off" && b.status === "off";
}

export function nextBothOff(
  s1: WorkSchedule | null | undefined,
  o1: WorkOverride[],
  s2: WorkSchedule | null | undefined,
  o2: WorkOverride[],
  from: string,
  maxDays = 366
): string | null {
  for (let i = 0; i < maxDays; i++) {
    const date = addDays(from, i);
    if (isBothOff(getWorkStatus(s1, o1, date), getWorkStatus(s2, o2, date))) return date;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/work-schedule.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/work-schedule.ts src/lib/work-schedule.test.ts
git commit -m "feat(calendar): work schedule status (rotation/office/overrides)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Yearly events in solar or lunar (`couple-events.ts`)

**Files:**
- Create: `src/lib/couple-events.ts`
- Test: `src/lib/couple-events.test.ts`

**Interfaces:**
- Consumes: `lunarToSolar`, `lunarMonthLength` (Task 2); `parseYmd`, `formatYmd`, `daysBetween` (Task 1)
- Produces:
  - `type CalendarType = "solar" | "lunar"` (the single definition; `src/lib/types.ts` re-exports it in Task 6)
  - `type YearlyEvent = { date: string; calendarType?: CalendarType }`
  - `occurrencesInYear(event: YearlyEvent, solarYear: number): string[]` — sorted; an early lunar month-12 date can occur twice in one solar year (January and December)
  - `occurrenceInYear(event: YearlyEvent, solarYear: number): string | null` — first of the above
  - `nextOccurrence(event: YearlyEvent, from: string): string`
  - `lunarLabel(event: YearlyEvent): string | null` — `"15/8 âm lịch"` for lunar events, `null` otherwise

- [ ] **Step 1: Write the failing test `src/lib/couple-events.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { solarToLunar } from "./lunar";
import { lunarLabel, nextOccurrence, occurrenceInYear, occurrencesInYear } from "./couple-events";

describe("occurrenceInYear", () => {
  it("keeps solar month-day", () => {
    expect(occurrenceInYear({ date: "2001-03-08" }, 2026)).toBe("2026-03-08");
  });

  it("maps a lunar 15/8 birthday to the right solar day each year", () => {
    const y2026 = occurrenceInYear({ date: "1970-08-15", calendarType: "lunar" }, 2026)!;
    const y2025 = occurrenceInYear({ date: "1970-08-15", calendarType: "lunar" }, 2025)!;
    expect(solarToLunar(y2026)).toMatchObject({ day: 15, month: 8, leap: false });
    expect(solarToLunar(y2025)).toMatchObject({ day: 15, month: 8, leap: false });
    expect(y2026.startsWith("2026-")).toBe(true);
  });

  it("clamps day 30 to 29 in a short lunar month", () => {
    const result = occurrenceInYear({ date: "1990-12-30", calendarType: "lunar" }, 2026)!;
    const lunar = solarToLunar(result);
    expect(lunar.month).toBe(12);
    expect([29, 30]).toContain(lunar.day);
  });

  it("finds a lunar month-12 event in the following solar year", () => {
    // 15/12 âm of lunar year 2025 falls in early 2026.
    const result = occurrenceInYear({ date: "2000-12-15", calendarType: "lunar" }, 2026)!;
    expect(result.startsWith("2026-0")).toBe(true);
    expect(solarToLunar(result)).toMatchObject({ day: 15, month: 12 });
  });

  it("returns every occurrence when a lunar date falls twice in one solar year", () => {
    // Lunar month 12 starts between ~21/12 and ~20/1, so 1/12 âm sometimes lands
    // in both January and December of the same solar year. Scan for one.
    const event = { date: "2000-12-01", calendarType: "lunar" as const };
    const twice = Array.from({ length: 60 }, (_, i) => 2000 + i)
      .map((y) => occurrencesInYear(event, y))
      .find((list) => list.length === 2);
    expect(twice).toBeDefined();
    expect(twice![0] < twice![1]).toBe(true);
  });

  it("maps 29/2 to 28/2 in non-leap years", () => {
    expect(occurrenceInYear({ date: "2000-02-29" }, 2026)).toBe("2026-02-28");
  });
});

describe("nextOccurrence", () => {
  it("returns today when the event is today", () => {
    expect(nextOccurrence({ date: "2000-10-15" }, "2026-10-15")).toBe("2026-10-15");
  });
  it("rolls over to next year once passed", () => {
    expect(nextOccurrence({ date: "2000-10-14" }, "2026-10-15")).toBe("2027-10-14");
  });
});

describe("lunarLabel", () => {
  it("labels lunar events only", () => {
    expect(lunarLabel({ date: "1970-08-15", calendarType: "lunar" })).toBe("15/8 âm lịch");
    expect(lunarLabel({ date: "1970-08-15" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/couple-events.test.ts`
Expected: FAIL — `Failed to resolve import "./couple-events"`

- [ ] **Step 3: Implement `src/lib/couple-events.ts`**

```ts
import { lunarMonthLength, lunarToSolar } from "./lunar";
import { formatYmd, parseYmd } from "./ymd";

export type CalendarType = "solar" | "lunar";
export type YearlyEvent = { date: string; calendarType?: CalendarType };

function lunarInLunarYear(month: number, day: number, lunarYear: number): string | null {
  const length = lunarMonthLength(month, lunarYear, false);
  if (length === null) return null;
  return lunarToSolar({ day: Math.min(day, length), month, year: lunarYear, leap: false });
}

/** Every solar date ("YYYY-MM-DD", sorted) on which a yearly event falls within `solarYear`. */
export function occurrencesInYear(event: YearlyEvent, solarYear: number): string[] {
  const { m, d } = parseYmd(event.date);
  if (event.calendarType !== "lunar") {
    // 29/2 in a non-leap year → 28/2.
    const lastDay = new Date(Date.UTC(solarYear, m, 0)).getUTCDate();
    return [formatYmd({ y: solarYear, m, d: Math.min(d, lastDay) })];
  }
  // A lunar month-day lands in this solar year from lunar year solarYear (most
  // months, plus late months 11–12 in December) or solarYear - 1 (late months
  // spilling into January/February) — occasionally both.
  return [solarYear - 1, solarYear]
    .map((lunarYear) => lunarInLunarYear(m, d, lunarYear))
    .filter((s): s is string => s !== null && s.startsWith(`${solarYear}-`))
    .sort();
}

export function occurrenceInYear(event: YearlyEvent, solarYear: number): string | null {
  return occurrencesInYear(event, solarYear)[0] ?? null;
}

export function nextOccurrence(event: YearlyEvent, from: string): string {
  const { y } = parseYmd(from);
  for (const year of [y, y + 1, y + 2]) {
    const date = occurrencesInYear(event, year).find((s) => s >= from);
    if (date) return date;
  }
  throw new Error(`No occurrence found for ${event.date} after ${from}`);
}

export function lunarLabel(event: YearlyEvent): string | null {
  if (event.calendarType !== "lunar") return null;
  const { m, d } = parseYmd(event.date);
  return `${d}/${m} âm lịch`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/couple-events.test.ts`
Expected: PASS. Then run the whole suite: `npm test` → all files PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/couple-events.ts src/lib/couple-events.test.ts
git commit -m "feat(calendar): yearly solar/lunar event occurrences

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Schema, types and content layer

**Files:**
- Modify: `prisma/schema.prisma` (models `CmsCoupleInfo`, `CmsCoupleBirthday`, `CmsCoupleSpecialDate`; add 2 models after `CmsCoupleSpecialDate`)
- Modify: `src/lib/types.ts:360-424` (`CoupleBirthday`, `CoupleSpecialDate`, `CoupleData`)
- Modify: `src/lib/content/couple.ts` (mappers, `getCoupleData`, new functions)
- Modify: `src/app/api/couple/route.ts` (fallback payload)
- Modify: `src/app/couple/page.tsx:16-40` (`DEFAULT_COUPLE_DATA` gets the two new arrays)
- Modify: `src/app/api/admin/couple/route.ts:93-110` (pass `calendarType` on create)

**Interfaces:**
- Consumes: `WorkSchedule`, `WorkOverride` (Task 4); `CalendarType` (Task 5)
- Produces (in `src/lib/types.ts`):
  - `export type { CalendarType }` (re-exported from `src/lib/couple-events.ts`)
  - `CoupleBirthday.calendarType?: CalendarType`, `CoupleSpecialDate.calendarType?: CalendarType`
  - `export type CoupleWorkSchedule = WorkSchedule & { person: 1 | 2 }`
  - `export interface CoupleWorkOverride { id: string; person: 1 | 2; date: string; status: "work" | "off"; note?: string }`
  - `CoupleData.workSchedules: CoupleWorkSchedule[]`, `CoupleData.workOverrides: CoupleWorkOverride[]`
- Produces (in `src/lib/content/couple.ts`):
  - `getWorkSchedules(): Promise<CoupleWorkSchedule[]>`
  - `saveWorkSchedules(items: CoupleWorkSchedule[]): Promise<CoupleWorkSchedule[]>`
  - `upsertWorkOverride(input: Omit<CoupleWorkOverride, "id">): Promise<CoupleWorkOverride>`
  - `deleteWorkOverride(id: string): Promise<boolean>`

- [ ] **Step 1: Edit `prisma/schema.prisma`**

In `model CmsCoupleInfo`, after `favorites    CmsCoupleFavorite[]` add:

```prisma
  workSchedules CmsCoupleWorkSchedule[]
  workOverrides CmsCoupleWorkOverride[]
```

In both `model CmsCoupleBirthday` and `model CmsCoupleSpecialDate`, after the `date String` line add:

```prisma
  calendarType String        @default("solar") // "solar" | "lunar"; lunar = month-day of `date` is lunar
```

After `model CmsCoupleSpecialDate { … }` add:

```prisma
model CmsCoupleWorkSchedule {
  id           String        @id @default(cuid())
  coupleInfo   CmsCoupleInfo @relation(fields: [coupleInfoId], references: [id], onDelete: Cascade)
  coupleInfoId String        @default("singleton")
  person       Int // 1 | 2
  enabled      Boolean       @default(true)
  type         String // "rotation" | "office"
  startDate    String? // rotation: first work day, "YYYY-MM-DD"
  workDays     Int?
  offDays      Int?
  weekdays     Int[] // office: 1 = Monday … 7 = Sunday

  @@unique([coupleInfoId, person])
  @@map("cms_couple_work_schedules")
}

model CmsCoupleWorkOverride {
  id           String        @id @default(cuid())
  coupleInfo   CmsCoupleInfo @relation(fields: [coupleInfoId], references: [id], onDelete: Cascade)
  coupleInfoId String        @default("singleton")
  person       Int // 1 | 2
  date         String // "YYYY-MM-DD"
  status       String // "work" | "off"
  note         String?

  @@unique([coupleInfoId, person, date])
  @@map("cms_couple_work_overrides")
}
```

- [ ] **Step 2: Validate and regenerate the client**

Run: `npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid` and `Generated Prisma Client … to ./src/generated/prisma`.
**Do not run `prisma db push`** (see Global Constraints).

- [ ] **Step 3: Extend `src/lib/types.ts`**

At the top of the file add (`CalendarType` is defined once, in `couple-events.ts`, and re-exported here):

```ts
import type { WorkSchedule } from "@/lib/work-schedule";
import type { CalendarType } from "@/lib/couple-events";

export type { CalendarType };
```

Change `CoupleBirthday` and `CoupleSpecialDate` to include, after `date: string;`:

```ts
  calendarType?: CalendarType;
```

Before `export interface CoupleData` add:

```ts
export type CoupleWorkSchedule = WorkSchedule & { person: 1 | 2 };

export interface CoupleWorkOverride {
  id: string;
  person: 1 | 2;
  date: string;
  status: "work" | "off";
  note?: string;
}
```

In `CoupleData`, after `favorites: CoupleFavorite[];` add:

```ts
  workSchedules: CoupleWorkSchedule[];
  workOverrides: CoupleWorkOverride[];
```

- [ ] **Step 4: Run the type check to see every place that now needs the new fields**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"`
Expected: errors in `src/lib/content/couple.ts`, `src/app/api/couple/route.ts`, `src/app/couple/page.tsx` (missing `workSchedules`/`workOverrides`). These are fixed in the next steps.

- [ ] **Step 5: Update `src/lib/content/couple.ts`**

Add to the `@/lib/types` import: `CalendarType, CoupleWorkSchedule, CoupleWorkOverride`. Add to the `@/generated/prisma` import: `CmsCoupleWorkSchedule, CmsCoupleWorkOverride`.

Replace `toBirthday` and `toSpecialDate`:

```ts
const toCalendarType = (v: string): CalendarType => (v === "lunar" ? "lunar" : "solar");

const toBirthday = (r: CmsCoupleBirthday): CoupleBirthday => ({
  id: r.id,
  name: r.name,
  date: r.date,
  calendarType: toCalendarType(r.calendarType),
  emoji: r.emoji,
  zodiac: r.zodiac,
  published: r.published,
});

const toSpecialDate = (r: CmsCoupleSpecialDate): CoupleSpecialDate => ({
  id: r.id,
  name: r.name,
  date: r.date,
  calendarType: toCalendarType(r.calendarType),
  emoji: r.emoji,
  published: r.published,
});
```

Add after `toFavorite`:

```ts
const toPerson = (n: number): 1 | 2 => (n === 2 ? 2 : 1);

const toWorkSchedule = (r: CmsCoupleWorkSchedule): CoupleWorkSchedule =>
  r.type === "rotation"
    ? {
        person: toPerson(r.person),
        type: "rotation",
        enabled: r.enabled,
        startDate: r.startDate ?? "1970-01-01",
        workDays: r.workDays ?? 1,
        offDays: r.offDays ?? 1,
      }
    : { person: toPerson(r.person), type: "office", enabled: r.enabled, weekdays: r.weekdays };

const toWorkOverride = (r: CmsCoupleWorkOverride): CoupleWorkOverride => ({
  id: r.id,
  person: toPerson(r.person),
  date: r.date,
  status: r.status === "work" ? "work" : "off",
  note: r.note ?? undefined,
});
```

In `getCoupleData`, extend the `Promise.all` destructuring with `workSchedules, workOverrides` and add the two queries at the end of the array:

```ts
    db.cmsCoupleWorkSchedule.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { person: "asc" } }),
    db.cmsCoupleWorkOverride.findMany({ where: { coupleInfoId: SINGLETON_ID }, orderBy: { date: "asc" } }),
```

and in the returned object, after `favorites: favorites.map(toFavorite),`:

```ts
    workSchedules: workSchedules.map(toWorkSchedule),
    workOverrides: workOverrides.map(toWorkOverride),
```

In `getPublishedCoupleData`, keep `workSchedules` as-is (disabled ones are already handled as `"none"` by `getWorkStatus`) — no change needed since it spreads `...data`.

At the end of the file add:

```ts
// ---------------------------------------------------------------------------
// Work schedules (one row per person) and per-day overrides
// ---------------------------------------------------------------------------

export async function getWorkSchedules(): Promise<CoupleWorkSchedule[]> {
  const rows = await db.cmsCoupleWorkSchedule.findMany({
    where: { coupleInfoId: SINGLETON_ID },
    orderBy: { person: "asc" },
  });
  return rows.map(toWorkSchedule);
}

export async function saveWorkSchedules(items: CoupleWorkSchedule[]): Promise<CoupleWorkSchedule[]> {
  await ensureCoupleInfo();
  await db.$transaction(
    items.map((item) => {
      const data =
        item.type === "rotation"
          ? { enabled: item.enabled, type: "rotation", startDate: item.startDate, workDays: item.workDays, offDays: item.offDays, weekdays: [] }
          : { enabled: item.enabled, type: "office", startDate: null, workDays: null, offDays: null, weekdays: item.weekdays };
      return db.cmsCoupleWorkSchedule.upsert({
        where: { coupleInfoId_person: { coupleInfoId: SINGLETON_ID, person: item.person } },
        create: { coupleInfoId: SINGLETON_ID, person: item.person, ...data },
        update: data,
      });
    })
  );
  return getWorkSchedules();
}

export async function upsertWorkOverride(input: Omit<CoupleWorkOverride, "id">): Promise<CoupleWorkOverride> {
  await ensureCoupleInfo();
  const data = { status: input.status, note: input.note || null };
  const row = await db.cmsCoupleWorkOverride.upsert({
    where: { coupleInfoId_person_date: { coupleInfoId: SINGLETON_ID, person: input.person, date: input.date } },
    create: { coupleInfoId: SINGLETON_ID, person: input.person, date: input.date, ...data },
    update: data,
  });
  return toWorkOverride(row);
}

export async function deleteWorkOverride(id: string): Promise<boolean> {
  try {
    await db.cmsCoupleWorkOverride.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 6: Fix the fallbacks**

In `src/app/api/couple/route.ts`, in the 500 fallback object after `favorites: [],` add:

```ts
        workSchedules: [],
        workOverrides: [],
```

In `src/app/couple/page.tsx`, in `DEFAULT_COUPLE_DATA` after the `favorites` array add:

```ts
  workSchedules: [],
  workOverrides: [],
```

- [ ] **Step 7: Pass `calendarType` when creating birthdays / special dates**

In `src/app/api/admin/couple/route.ts`, in `case "birthdays":` and `case "specialDates":` add to the object passed to `createBirthday` / `createSpecialDate`, after the `date:` line:

```ts
          calendarType: body.calendarType === "lunar" ? "lunar" : "solar",
```

(PUT already forwards every body field to `updateBirthday`/`updateSpecialDate`, so edits carry `calendarType` without changes.)

- [ ] **Step 8: Type check and tests**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"` → no output.
Run: `npm test` → all PASS.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma src/lib/types.ts src/lib/content/couple.ts src/app/api/couple/route.ts src/app/couple/page.tsx src/app/api/admin/couple/route.ts
git commit -m "feat(couple): schema and content layer for work schedules and lunar dates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Admin API routes for schedules and overrides

**Files:**
- Create: `src/app/api/admin/couple/work-schedules/route.ts`
- Create: `src/app/api/admin/couple/work-overrides/route.ts`
- Create: `src/app/api/admin/couple/work-overrides/[id]/route.ts`
- Create: `src/lib/couple-schedule-schema.ts` (zod schemas shared by API + admin form)
- Test: `src/lib/couple-schedule-schema.test.ts`

**Interfaces:**
- Consumes: `getWorkSchedules`, `saveWorkSchedules`, `upsertWorkOverride`, `deleteWorkOverride` (Task 6)
- Produces:
  - `workScheduleSchema` (zod) parsing to `CoupleWorkSchedule`
  - `workSchedulesBodySchema = z.object({ schedules: z.array(workScheduleSchema).max(2) })`
  - `workOverrideSchema` (zod) parsing to `Omit<CoupleWorkOverride, "id">`
  - HTTP: `GET /api/admin/couple/work-schedules` → `CoupleWorkSchedule[]`; `PUT` body `{ schedules }` → `CoupleWorkSchedule[]`; `POST /api/admin/couple/work-overrides` body override → `CoupleWorkOverride`; `DELETE /api/admin/couple/work-overrides/[id]` → `{ success: true }`

- [ ] **Step 1: Write the failing test `src/lib/couple-schedule-schema.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { workOverrideSchema, workScheduleSchema } from "./couple-schedule-schema";

describe("workScheduleSchema", () => {
  it("accepts a rotation", () => {
    const parsed = workScheduleSchema.parse({ person: 1, type: "rotation", enabled: true, startDate: "2026-10-15", workDays: 1, offDays: 2 });
    expect(parsed).toMatchObject({ type: "rotation", workDays: 1 });
  });
  it("rejects zero-length cycles and bad dates", () => {
    expect(workScheduleSchema.safeParse({ person: 1, type: "rotation", enabled: true, startDate: "2026-10-15", workDays: 0, offDays: 2 }).success).toBe(false);
    expect(workScheduleSchema.safeParse({ person: 1, type: "rotation", enabled: true, startDate: "15/10/2026", workDays: 1, offDays: 2 }).success).toBe(false);
  });
  it("requires at least one weekday for office", () => {
    expect(workScheduleSchema.safeParse({ person: 2, type: "office", enabled: true, weekdays: [] }).success).toBe(false);
    expect(workScheduleSchema.safeParse({ person: 2, type: "office", enabled: true, weekdays: [1, 8] }).success).toBe(false);
  });
});

describe("workOverrideSchema", () => {
  it("accepts a valid override and trims the note", () => {
    expect(workOverrideSchema.parse({ person: 2, date: "2026-10-20", status: "off", note: " nghỉ phép " })).toEqual({
      person: 2, date: "2026-10-20", status: "off", note: "nghỉ phép",
    });
  });
  it("rejects person 3", () => {
    expect(workOverrideSchema.safeParse({ person: 3, date: "2026-10-20", status: "off" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/couple-schedule-schema.test.ts`
Expected: FAIL — `Failed to resolve import "./couple-schedule-schema"`

- [ ] **Step 3: Implement `src/lib/couple-schedule-schema.ts`**

```ts
import { z } from "zod";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng YYYY-MM-DD");
const person = z.union([z.literal(1), z.literal(2)]);

export const workScheduleSchema = z.discriminatedUnion("type", [
  z.object({
    person,
    type: z.literal("rotation"),
    enabled: z.boolean(),
    startDate: ymd,
    workDays: z.number().int().min(1, "Ít nhất 1 ngày").max(30),
    offDays: z.number().int().min(1, "Ít nhất 1 ngày").max(30),
  }),
  z.object({
    person,
    type: z.literal("office"),
    enabled: z.boolean(),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1, "Chọn ít nhất 1 thứ"),
  }),
]);

export const workSchedulesBodySchema = z.object({ schedules: z.array(workScheduleSchema).max(2) });

export const workOverrideSchema = z.object({
  person,
  date: ymd,
  status: z.enum(["work", "off"]),
  note: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/couple-schedule-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Create `src/app/api/admin/couple/work-schedules/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getWorkSchedules, saveWorkSchedules } from "@/lib/content/couple";
import { workSchedulesBodySchema } from "@/lib/couple-schedule-schema";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(await getWorkSchedules());
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const parsed = workSchedulesBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  try {
    const saved = await saveWorkSchedules(parsed.data.schedules);
    revalidateTag("couple");
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[PUT /api/admin/couple/work-schedules] Error:", error);
    return NextResponse.json({ error: "Failed to save schedules" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Create `src/app/api/admin/couple/work-overrides/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { upsertWorkOverride } from "@/lib/content/couple";
import { workOverrideSchema } from "@/lib/couple-schedule-schema";

export async function POST(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const parsed = workOverrideSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  try {
    const saved = await upsertWorkOverride(parsed.data);
    revalidateTag("couple");
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[POST /api/admin/couple/work-overrides] Error:", error);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
}
```

- [ ] **Step 7: Create `src/app/api/admin/couple/work-overrides/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteWorkOverride } from "@/lib/content/couple";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const deleted = await deleteWorkOverride(params.id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateTag("couple");
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 8: Type check, lint, tests**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"` → no output.
Run: `npx eslint src/app/api/admin/couple src/lib/couple-schedule-schema.ts` → no errors.
Run: `npm test` → all PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/couple-schedule-schema.ts src/lib/couple-schedule-schema.test.ts src/app/api/admin/couple/work-schedules src/app/api/admin/couple/work-overrides
git commit -m "feat(couple): admin API for work schedules and day overrides

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `CoupleCalendar` component on `/couple`

**Files:**
- Create: `src/components/couple/CoupleCalendar.tsx`
- Create: `src/components/couple/CoupleCalendar.module.css`
- Create: `src/lib/calendar-grid.ts` (pure month-grid builder)
- Test: `src/lib/calendar-grid.test.ts`
- Modify: `src/app/couple/page.tsx` (`SectionId`, `SECTIONS`, `SECTION_COMPONENTS`, new `CalendarSection`)

**Interfaces:**
- Consumes: `solarToLunar`, `canChiYear`, `canChiDay` (Task 2); `getHolidays` (Task 3); `getWorkStatus`, `isBothOff`, `nextBothOff` (Task 4); `occurrencesInYear` (Task 5); `addDays`, `daysBetween`, `isoWeekday`, `parseYmd`, `formatYmd`, `todayYmd` (Task 1); `CoupleData` (Task 6)
- Produces:
  - `buildMonthGrid(year: number, month: number): { date: string; inMonth: boolean }[]` — always 42 cells, Monday-first
  - `default export function CoupleCalendar({ data }: { data: CoupleData })`

- [ ] **Step 1: Write the failing test `src/lib/calendar-grid.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildMonthGrid } from "./calendar-grid";

describe("buildMonthGrid", () => {
  it("builds 42 Monday-first cells for October 2026", () => {
    const grid = buildMonthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ date: "2026-09-28", inMonth: false }); // Monday before 1/10 (Thu)
    expect(grid[3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it("starts on the 1st when the month begins on Monday", () => {
    expect(buildMonthGrid(2026, 6)[0]).toEqual({ date: "2026-06-01", inMonth: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/calendar-grid.test.ts`
Expected: FAIL — `Failed to resolve import "./calendar-grid"`

- [ ] **Step 3: Implement `src/lib/calendar-grid.ts`**

```ts
import { addDays, formatYmd, isoWeekday } from "./ymd";

export type GridCell = { date: string; inMonth: boolean };

/** 6 weeks × 7 days, Monday-first, padded with the neighbouring months. */
export function buildMonthGrid(year: number, month: number): GridCell[] {
  const first = formatYmd({ y: year, m: month, d: 1 });
  const start = addDays(first, -(isoWeekday(first) - 1));
  const prefix = first.slice(0, 8); // "YYYY-MM-"
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i);
    return { date, inMonth: date.startsWith(prefix) };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/calendar-grid.test.ts`
Expected: PASS

- [ ] **Step 5: Create `src/components/couple/CoupleCalendar.module.css`**

```css
.calendar { display: flex; flex-direction: column; gap: 1rem; }

.header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.monthTitle { font-size: 1.25rem; font-weight: 700; color: #fff; }
.lunarTitle { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
.navGroup { display: flex; gap: 0.375rem; }
.navButton {
  min-width: 2.25rem; height: 2.25rem; padding: 0 0.75rem; border-radius: 9999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85); font-size: 0.8rem; cursor: pointer;
}
.navButton:hover { background: rgba(255, 255, 255, 0.12); }

.summary {
  padding: 0.75rem 1rem; border-radius: 1rem; font-size: 0.875rem; color: #fff;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(56, 189, 248, 0.12));
  border: 1px solid rgba(244, 114, 182, 0.25);
}

.weekdays, .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.25rem; }
.weekday { text-align: center; font-size: 0.7rem; color: rgba(255, 255, 255, 0.45); padding-bottom: 0.25rem; }

.cell {
  position: relative; aspect-ratio: 1 / 1.15; min-width: 0; padding: 0.3rem 0.25rem 0.5rem;
  border-radius: 0.75rem; background: rgba(255, 255, 255, 0.03); border: 1px solid transparent;
  display: flex; flex-direction: column; align-items: flex-start; color: #fff; cursor: pointer; text-align: left;
}
.cell:hover { background: rgba(255, 255, 255, 0.07); }
.outside { opacity: 0.35; }
.today { border-color: rgba(244, 114, 182, 0.8); }
.selected { background: rgba(244, 114, 182, 0.18); }
.bothOff { background: linear-gradient(160deg, rgba(244, 114, 182, 0.22), rgba(56, 189, 248, 0.16)); }

.solarDay { font-size: 0.95rem; font-weight: 700; line-height: 1; }
.lunarDay { font-size: 0.6rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.15rem; }
.lunarAccent { color: #f9a8d4; font-weight: 600; }
.markers { position: absolute; top: 0.25rem; right: 0.25rem; font-size: 0.6rem; line-height: 1; display: flex; gap: 1px; }
.holidayDot { width: 0.35rem; height: 0.35rem; border-radius: 9999px; background: #facc15; display: inline-block; }
.heart { position: absolute; bottom: 0.55rem; right: 0.3rem; font-size: 0.6rem; }

.bars { position: absolute; left: 0.3rem; right: 0.3rem; bottom: 0.25rem; display: flex; gap: 0.2rem; }
.bar { flex: 1; height: 0.2rem; border-radius: 9999px; }
.barWork1 { background: #f472b6; }
.barOff1 { border: 1px solid #f472b6; }
.barWork2 { background: #38bdf8; }
.barOff2 { border: 1px solid #38bdf8; }
.barNone { visibility: hidden; }
.overrideDot { position: absolute; bottom: 0.55rem; left: 0.3rem; width: 0.25rem; height: 0.25rem; border-radius: 9999px; background: #fff; }

.legend { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.7rem; color: rgba(255, 255, 255, 0.55); }
.legendItem { display: inline-flex; align-items: center; gap: 0.35rem; }
.legendSwatch { width: 1rem; height: 0.25rem; border-radius: 9999px; display: inline-block; }

.detail {
  padding: 1rem; border-radius: 1rem; background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; display: flex; flex-direction: column; gap: 0.4rem;
}
.detailTitle { font-weight: 700; }
.detailMuted { font-size: 0.8rem; color: rgba(255, 255, 255, 0.55); }
.detailRow { font-size: 0.85rem; }

@media (max-width: 480px) {
  .weekdays, .grid { gap: 0.15rem; }
  .cell { padding: 0.2rem 0.15rem 0.45rem; border-radius: 0.5rem; }
  .solarDay { font-size: 0.85rem; }
  .monthTitle { font-size: 1.05rem; }
}
```

- [ ] **Step 6: Create `src/components/couple/CoupleCalendar.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { buildMonthGrid } from "@/lib/calendar-grid";
import { occurrencesInYear } from "@/lib/couple-events";
import { canChiDay, canChiYear, solarToLunar } from "@/lib/lunar";
import { getHolidays } from "@/lib/vn-holidays";
import { getWorkStatus, isBothOff, nextBothOff, type WorkStatus } from "@/lib/work-schedule";
import { daysBetween, isoWeekday, parseYmd, todayYmd } from "@/lib/ymd";
import type { CoupleData } from "@/lib/types";
import styles from "./CoupleCalendar.module.css";

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_LONG = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

function statusText(s: WorkStatus): string {
  if (s.status === "none") return "chưa có lịch";
  const base = s.status === "work" ? "đi làm" : "nghỉ";
  return s.note ? `${base} (${s.note})` : base;
}

export default function CoupleCalendar({ data }: { data: CoupleData }) {
  const today = todayYmd();
  const [view, setView] = useState(() => {
    const { y, m } = parseYmd(today);
    return { y, m };
  });
  const [selected, setSelected] = useState(today);

  const s1 = data.workSchedules.find((s) => s.person === 1) ?? null;
  const s2 = data.workSchedules.find((s) => s.person === 2) ?? null;
  const o1 = useMemo(() => data.workOverrides.filter((o) => o.person === 1), [data.workOverrides]);
  const o2 = useMemo(() => data.workOverrides.filter((o) => o.person === 2), [data.workOverrides]);

  const grid = useMemo(() => buildMonthGrid(view.y, view.m), [view]);

  // Birthdays/special dates keyed by the solar date they fall on in the visible years.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { emoji: string; name: string }[]>();
    const years = new Set(grid.map((c) => parseYmd(c.date).y));
    const all = [
      ...data.birthdays.map((b) => ({ ...b, name: `Sinh nhật ${b.name}` })),
      ...data.specialDates,
    ];
    for (const year of years) {
      for (const ev of all) {
        for (const date of occurrencesInYear(ev, year)) {
          map.set(date, [...(map.get(date) ?? []), { emoji: ev.emoji, name: ev.name }]);
        }
      }
    }
    return map;
  }, [grid, data.birthdays, data.specialDates]);

  const nextOff = useMemo(() => nextBothOff(s1, o1, s2, o2, today), [s1, o1, s2, o2, today]);

  const firstLunar = solarToLunar(grid.find((c) => c.inMonth)!.date);
  const lastLunar = solarToLunar([...grid].reverse().find((c) => c.inMonth)!.date);
  const lunarMonths =
    firstLunar.month === lastLunar.month ? `Tháng ${firstLunar.month} âm` : `Tháng ${firstLunar.month} – ${lastLunar.month} âm`;

  const shiftMonth = (delta: number) =>
    setView(({ y, m }) => {
      const index = y * 12 + (m - 1) + delta;
      return { y: Math.floor(index / 12), m: (index % 12) + 1 };
    });

  const goToday = () => {
    const { y, m } = parseYmd(today);
    setView({ y, m });
    setSelected(today);
  };

  const sel = parseYmd(selected);
  const selLunar = solarToLunar(selected);
  const selStatus1 = getWorkStatus(s1, o1, selected);
  const selStatus2 = getWorkStatus(s2, o2, selected);
  const selHolidays = getHolidays(selected);
  const selEvents = eventsByDate.get(selected) ?? [];

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <div>
          <div className={styles.monthTitle}>Tháng {view.m}, {view.y}</div>
          <div className={styles.lunarTitle}>
            {lunarMonths} · năm {canChiYear(lastLunar.year)}
          </div>
        </div>
        <div className={styles.navGroup}>
          <button type="button" className={styles.navButton} onClick={() => shiftMonth(-1)} aria-label="Tháng trước">
            <Icon name="chevronLeft" size={16} />
          </button>
          <button type="button" className={styles.navButton} onClick={goToday}>Hôm nay</button>
          <button type="button" className={styles.navButton} onClick={() => shiftMonth(1)} aria-label="Tháng sau">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>

      {nextOff && (
        <div className={styles.summary}>
          💕 Ngày cả hai cùng nghỉ tiếp theo: <strong>{WEEKDAY_LONG[isoWeekday(nextOff) - 1]}, {parseYmd(nextOff).d}/{parseYmd(nextOff).m}</strong>
          {" "}({daysBetween(today, nextOff) === 0 ? "hôm nay" : `còn ${daysBetween(today, nextOff)} ngày`})
        </div>
      )}

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} className={styles.weekday}>{w}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {grid.map(({ date, inMonth }) => {
          const { d } = parseYmd(date);
          const lunar = solarToLunar(date);
          const st1 = getWorkStatus(s1, o1, date);
          const st2 = getWorkStatus(s2, o2, date);
          const bothOff = isBothOff(st1, st2);
          const holidays = getHolidays(date);
          const events = eventsByDate.get(date) ?? [];
          const accent = !lunar.leap && (lunar.day === 1 || lunar.day === 15);
          const lunarText = lunar.day === 1 ? `${lunar.day}/${lunar.month}${lunar.leap ? "N" : ""}` : `${lunar.day}`;
          const label = [
            `${WEEKDAY_LONG[isoWeekday(date) - 1]} ${d} tháng ${parseYmd(date).m}`,
            `ngày ${lunar.day} tháng ${lunar.month}${lunar.leap ? " nhuận" : ""} âm`,
            bothOff ? "cả hai cùng nghỉ" : "",
            ...holidays.map((h) => h.name),
            ...events.map((e) => e.name),
          ].filter(Boolean).join(", ");
          const className = [
            styles.cell,
            inMonth ? "" : styles.outside,
            date === today ? styles.today : "",
            bothOff ? styles.bothOff : "",
            date === selected ? styles.selected : "",
          ].filter(Boolean).join(" ");

          return (
            <button key={date} type="button" aria-label={label} aria-pressed={date === selected} className={className} onClick={() => setSelected(date)}>
              <span className={styles.solarDay}>{d}</span>
              <span className={`${styles.lunarDay} ${accent ? styles.lunarAccent : ""}`}>{lunarText}</span>
              <span className={styles.markers} aria-hidden="true">
                {holidays.length > 0 && <span className={styles.holidayDot} />}
                {events.slice(0, 2).map((e) => <span key={e.name}>{e.emoji}</span>)}
              </span>
              {bothOff && <span className={styles.heart} aria-hidden="true">💗</span>}
              {(st1.overridden || st2.overridden) && <span className={styles.overrideDot} aria-hidden="true" />}
              <span className={styles.bars} aria-hidden="true">
                <span className={`${styles.bar} ${st1.status === "none" ? styles.barNone : st1.status === "work" ? styles.barWork1 : styles.barOff1}`} />
                <span className={`${styles.bar} ${st2.status === "none" ? styles.barNone : st2.status === "work" ? styles.barWork2 : styles.barOff2}`} />
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.barWork1}`} /> {data.person1} đi làm</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.barWork2}`} /> {data.person2} đi làm</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.barOff1}`} /> viền = nghỉ</span>
        <span className={styles.legendItem}>💗 cả hai cùng nghỉ</span>
        <span className={styles.legendItem}><span className={styles.holidayDot} /> ngày lễ</span>
      </div>

      <div className={styles.detail} aria-live="polite">
        <div className={styles.detailTitle}>
          {WEEKDAY_LONG[isoWeekday(selected) - 1]}, {sel.d}/{sel.m}/{sel.y}
        </div>
        <div className={styles.detailMuted}>
          Âm lịch: {selLunar.day}/{selLunar.month}{selLunar.leap ? " (nhuận)" : ""} · ngày {canChiDay(selected)} · năm {canChiYear(selLunar.year)}
        </div>
        {selHolidays.map((h) => <div key={h.name} className={styles.detailRow}>🎌 {h.name}</div>)}
        {selEvents.map((e) => <div key={e.name} className={styles.detailRow}>{e.emoji} {e.name}</div>)}
        <div className={styles.detailRow}>{data.person1}: {statusText(selStatus1)}</div>
        <div className={styles.detailRow}>{data.person2}: {statusText(selStatus2)}</div>
        {isBothOff(selStatus1, selStatus2) && <div className={styles.detailRow}>💕 Cả hai cùng nghỉ — hẹn nhau thôi!</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Wire it into `src/app/couple/page.tsx`**

Add import near the other imports:

```tsx
import CoupleCalendar from "@/components/couple/CoupleCalendar";
```

Add `| "calendar"` to `type SectionId` (after `"specialDates"`), and in `SECTIONS` after the `specialDates` entry:

```tsx
  { id: "calendar", icon: "calendar", title: "Lịch của chúng mình", subtitle: "Âm – dương & lịch đi làm" },
```

Add the section component after `SpecialDatesSection`:

```tsx
// ============================================================
// 🗓️ CALENDAR SECTION
// ============================================================
function CalendarSection() {
  const { data } = useCouple();
  return (
    <section className={styles.section}>
      <SectionHeader icon="calendar" title="Lịch của chúng mình" subtitle="Âm – dương & lịch đi làm" />
      <CoupleCalendar data={data} />
    </section>
  );
}
```

In `SECTION_COMPONENTS` add `calendar: CalendarSection,`.

- [ ] **Step 8: Type check, lint, tests**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"` → no output.
Run: `npx eslint src/components/couple src/app/couple src/lib/calendar-grid.ts` → no errors.
Run: `npm test` → all PASS.

- [ ] **Step 9: Verify in the browser**

Start the dev server (`.claude/launch.json` with `npx next dev -p 3123`; delete only that file afterwards — never `rm -rf .claude`). Open `/couple` → "Lịch của chúng mình". Check at 375×812 and desktop:
- 7 columns, no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`).
- 1/1 âm of 2026 shows on 17/2/2026 (navigate to February 2026); "Tháng 12 – 1 âm" header in Feb 2026.
- With no schedules in the DB, no bars render and the summary line is hidden.
- Clicking a day updates the detail panel.

- [ ] **Step 10: Commit**

```bash
git add src/lib/calendar-grid.ts src/lib/calendar-grid.test.ts src/components/couple src/app/couple/page.tsx
git commit -m "feat(couple): lunar-solar calendar with both partners' work schedules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Lunar-aware birthdays and special dates on `/couple`

**Files:**
- Modify: `src/app/couple/page.tsx:202-239` (helpers), `:665-748` (`BirthdaySection`, `SpecialDatesSection`)

**Interfaces:**
- Consumes: `nextOccurrence`, `lunarLabel` (Task 5); `todayYmd`, `parseYmd`, `daysBetween` (Task 1); `CoupleBirthday.calendarType`, `CoupleSpecialDate.calendarType` (Task 6)

- [ ] **Step 1: Replace `getCountdown` in `src/app/couple/page.tsx`**

Add imports:

```tsx
import { lunarLabel, nextOccurrence } from "@/lib/couple-events";
import { daysBetween, parseYmd, todayYmd } from "@/lib/ymd";
import type { CalendarType } from "@/lib/types";
```

Replace the body of `getCountdown(targetDateStr: string)` with a version that takes the event:

```tsx
function getCountdown(event: { date: string; calendarType?: CalendarType }) {
  const now = new Date();
  const next = parseYmd(nextOccurrence(event, todayYmd(now)));
  const targetDate = new Date(next.y, next.m - 1, next.d);
  const diff = targetDate.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  return { days, hours, minutes, isPast: diff < 0, nextDate: next };
}
```

Replace `getSpecialDateCountdown(dateStr: string)` with:

```tsx
function getSpecialDateCountdown(event: { date: string; calendarType?: CalendarType }) {
  const today = todayYmd();
  // Lunar special dates repeat yearly by lunar date; solar ones stay one-off milestones.
  const target = event.calendarType === "lunar" ? nextOccurrence(event, today) : event.date;
  const days = daysBetween(today, target);
  if (days > 0) return `Còn ${days} ngày`;
  if (days === 0) return "Hôm nay! 🎉";
  return "Đã qua rồi 💫";
}
```

Delete the now-unused `parseLocalDate` and `startOfDay` helpers if nothing else references them (check with `grep -n "parseLocalDate\|startOfDay" src/app/couple/page.tsx`).

- [ ] **Step 2: Update `BirthdaySection`**

Change `const countdown = getCountdown(person.date);` to `const countdown = getCountdown(person);` and replace the date line block:

```tsx
              <div className={styles.birthdayDate}>
                {new Date(countdown.nextDate.y, countdown.nextDate.m - 1, countdown.nextDate.d).toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "long",
                })}
                {lunarLabel(person) && <span> ({lunarLabel(person)})</span>}
              </div>
```

- [ ] **Step 3: Update `SpecialDatesSection`**

Replace the date + countdown block:

```tsx
              <div className={styles.specialDateDate}>
                {item.calendarType === "lunar"
                  ? lunarLabel(item)
                  : new Date(`${item.date}T00:00:00`).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
              </div>
              <div className={styles.specialDateCountdown}>
                {getSpecialDateCountdown(item)}
              </div>
```

- [ ] **Step 4: Type check and lint**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"` → no output.
Run: `npx eslint src/app/couple/page.tsx` → no errors.

- [ ] **Step 5: Verify in the browser**

On `/couple` → "Sinh nhật": solar birthdays show the same date and countdown as before this change (compare one against `develop`). "Ngày đặc biệt": solar dates unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/app/couple/page.tsx
git commit -m "feat(couple): count down lunar birthdays and special dates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Admin — calendar type on birthday / special-date forms

**Files:**
- Modify: `src/app/admin/couple/page.tsx` (`birthdayForm`/`dateForm` state at `:91-107`, open/edit handlers at `:392-470`, modal fields at `:1640-1760`)

**Interfaces:**
- Consumes: `CalendarType` (Task 6); `occurrenceInYear` (Task 5); `todayYmd`, `parseYmd` (Task 1)

- [ ] **Step 1: Add `calendarType` to both form states**

In the `birthdayForm` and `dateForm` initial `useState({...})` objects, and in `openCreateBirthday`, `openCreateDate` resets, add:

```ts
    calendarType: "solar" as CalendarType,
```

In `openEditBirthday` / `openEditDate` add:

```ts
      calendarType: item.calendarType ?? "solar",
```

Add imports at the top:

```ts
import type { CalendarType } from "@/lib/types";
import { occurrenceInYear } from "@/lib/couple-events";
import { parseYmd, todayYmd } from "@/lib/ymd";
```

(`handleSaveBirthday` / `handleSaveDate` already spread the form into the payload, so `calendarType` is sent.)

- [ ] **Step 2: Add a small shared field component at the bottom of the file**

```tsx
function CalendarTypeField({
  id,
  value,
  date,
  onChange,
}: {
  id: string;
  value: CalendarType;
  date: string;
  onChange: (v: CalendarType) => void;
}) {
  const thisYear = parseYmd(todayYmd()).y;
  let preview: string | null = null;
  if (value === "lunar" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const solar = occurrenceInYear({ date, calendarType: "lunar" }, thisYear);
    preview = solar ? `Năm nay rơi vào ${parseYmd(solar).d}/${parseYmd(solar).m}/${thisYear} dương lịch` : null;
  }
  return (
    <FormField label="Loại lịch" id={id} helper={value === "lunar" ? preview ?? "Ngày – tháng nhập ở trên là ngày âm lịch" : undefined}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as CalendarType)}
        className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50"
      >
        <option value="solar">Dương lịch</option>
        <option value="lunar">Âm lịch (lặp lại mỗi năm)</option>
      </select>
    </FormField>
  );
}
```

- [ ] **Step 3: Render it in both modals**

In the birthday modal, directly after the `bdayDate` `FormField`:

```tsx
        <CalendarTypeField
          id="bdayCalendarType"
          value={birthdayForm.calendarType}
          date={birthdayForm.date}
          onChange={(calendarType) => setBirthdayForm({ ...birthdayForm, calendarType })}
        />
```

In the special-date modal, directly after the grid `div` containing `dateVal`:

```tsx
        <CalendarTypeField
          id="dateCalendarType"
          value={dateForm.calendarType}
          date={dateForm.date}
          onChange={(calendarType) => setDateForm({ ...dateForm, calendarType })}
        />
```

Change both date `FormField` labels to reflect the type, e.g. for birthdays:

```tsx
        <FormField label={birthdayForm.calendarType === "lunar" ? "Ngày âm (năm gốc)" : t.admin.photography.fieldDate} id="bdayDate" required>
```

(and the same with `dateForm.calendarType` for `dateVal`).

- [ ] **Step 4: Type check and lint**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"` → no output.
Run: `npx eslint src/app/admin/couple/page.tsx` → the file already has pre-existing `no-explicit-any` errors (`catch (err: any)`); confirm every reported line is outside the code this task added (`CalendarTypeField` and the `calendarType` lines).

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/couple/page.tsx
git commit -m "feat(admin): choose solar or lunar for couple birthdays and special dates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Admin — "Lịch làm" tab

**Files:**
- Create: `src/components/admin/couple/WorkScheduleTab.tsx`
- Modify: `src/app/admin/couple/page.tsx` (`TabId`, tab button, tab body)

**Interfaces:**
- Consumes: `workScheduleSchema`, `workOverrideSchema` (Task 7); `getWorkStatus` (Task 4); `addDays`, `todayYmd`, `parseYmd`, `isoWeekday` (Task 1); `CoupleData`, `CoupleWorkSchedule`, `CoupleWorkOverride` (Task 6); HTTP routes (Task 7)
- Produces: `default export function WorkScheduleTab({ data, onChanged }: { data: CoupleData; onChanged: () => Promise<void> })`

- [ ] **Step 1: Create `src/components/admin/couple/WorkScheduleTab.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/admin/FormField";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { workOverrideSchema } from "@/lib/couple-schedule-schema";
import { getWorkStatus, type WorkSchedule } from "@/lib/work-schedule";
import { addDays, isoWeekday, parseYmd, todayYmd } from "@/lib/ymd";
import type { CoupleData, CoupleWorkOverride } from "@/lib/types";

const inputClass =
  "w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50";
const WEEKDAYS = [
  { value: 1, label: "T2" }, { value: 2, label: "T3" }, { value: 3, label: "T4" }, { value: 4, label: "T5" },
  { value: 5, label: "T6" }, { value: 6, label: "T7" }, { value: 7, label: "CN" },
];

// The form edits one flat record per person; it's converted to the API's
// discriminated union on submit so switching type never loses typed values.
const personFormSchema = z
  .object({
    enabled: z.boolean(),
    type: z.enum(["rotation", "office"]),
    startDate: z.string(),
    workDays: z.number().int().min(1, "Ít nhất 1").max(30),
    offDays: z.number().int().min(1, "Ít nhất 1").max(30),
    weekdays: z.array(z.number().int().min(1).max(7)),
  })
  .superRefine((v, ctx) => {
    if (v.type === "rotation" && !/^\d{4}-\d{2}-\d{2}$/.test(v.startDate)) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Chọn ngày bắt đầu" });
    }
    if (v.type === "office" && v.weekdays.length === 0) {
      ctx.addIssue({ code: "custom", path: ["weekdays"], message: "Chọn ít nhất 1 thứ" });
    }
  });
const formSchema = z.object({ p1: personFormSchema, p2: personFormSchema });
type FormValues = z.infer<typeof formSchema>;
type PersonForm = FormValues["p1"];

function toPersonForm(data: CoupleData, person: 1 | 2): PersonForm {
  const s = data.workSchedules.find((x) => x.person === person);
  return {
    enabled: s?.enabled ?? false,
    type: s?.type ?? "office",
    startDate: s?.type === "rotation" ? s.startDate : todayYmd(),
    workDays: s?.type === "rotation" ? s.workDays : 1,
    offDays: s?.type === "rotation" ? s.offDays : 2,
    weekdays: s?.type === "office" ? s.weekdays : [1, 2, 3, 4, 5],
  };
}

function toSchedule(v: PersonForm): WorkSchedule {
  return v.type === "rotation"
    ? { type: "rotation", enabled: v.enabled, startDate: v.startDate, workDays: v.workDays, offDays: v.offDays }
    : { type: "office", enabled: v.enabled, weekdays: [...v.weekdays].sort((a, b) => a - b) };
}

function Preview({ control, name, overrides }: { control: Control<FormValues>; name: "p1" | "p2"; overrides: CoupleWorkOverride[] }) {
  const value = useWatch({ control, name });
  const parsed = personFormSchema.safeParse(value);
  if (!parsed.success) return null;
  const schedule = toSchedule(parsed.data);
  const today = todayYmd();
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
      {Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, i);
        const st = getWorkStatus(schedule, overrides, date);
        const { d } = parseYmd(date);
        return (
          <div
            key={date}
            title={date}
            className={`shrink-0 w-9 rounded-lg py-1 text-center text-[10px] border ${
              st.status === "work" ? "bg-pink-500/25 border-pink-400/40 text-pink-100" : st.status === "off" ? "border-white/15 text-slate-300" : "border-white/5 text-slate-600"
            }`}
          >
            <div>{WEEKDAYS[isoWeekday(date) - 1].label}</div>
            <div className="font-bold">{d}</div>
            <div>{st.status === "work" ? "Làm" : st.status === "off" ? "Nghỉ" : "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function WorkScheduleTab({ data, onChanged }: { data: CoupleData; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { p1: toPersonForm(data, 1), p2: toPersonForm(data, 2) },
  });

  const onSubmit = async (values: FormValues) => {
    const schedules = ([1, 2] as const).map((person) => ({ person, ...toSchedule(values[person === 1 ? "p1" : "p2"]) }));
    const res = await fetch("/api/admin/couple/work-schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedules }),
    });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error || "Lưu lịch làm thất bại");
      return;
    }
    toast.success("Đã lưu lịch làm");
    await onChanged();
  };

  const names = { p1: data.person1, p2: data.person2 } as const;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(["p1", "p2"] as const).map((key) => {
            const type = watch(`${key}.type`);
            const weekdays = watch(`${key}.weekdays`);
            const errors = formState.errors[key];
            const person = key === "p1" ? 1 : 2;
            return (
              <div key={key} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{names[key]}</h3>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" {...register(`${key}.enabled`)} /> Bật lịch
                  </label>
                </div>
                <FormField label="Kiểu lịch" id={`${key}-type`}>
                  <select id={`${key}-type`} {...register(`${key}.type`)} className={inputClass}>
                    <option value="office">Hành chính (theo thứ trong tuần)</option>
                    <option value="rotation">Xoay vòng (làm N nghỉ M)</option>
                  </select>
                </FormField>
                {type === "rotation" ? (
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Ngày làm đầu tiên" id={`${key}-start`} error={errors?.startDate?.message}>
                      <input id={`${key}-start`} type="date" {...register(`${key}.startDate`)} className={inputClass} />
                    </FormField>
                    <FormField label="Số ngày làm" id={`${key}-work`} error={errors?.workDays?.message}>
                      <input id={`${key}-work`} type="number" min={1} max={30} {...register(`${key}.workDays`, { valueAsNumber: true })} className={inputClass} />
                    </FormField>
                    <FormField label="Số ngày nghỉ" id={`${key}-off`} error={errors?.offDays?.message}>
                      <input id={`${key}-off`} type="number" min={1} max={30} {...register(`${key}.offDays`, { valueAsNumber: true })} className={inputClass} />
                    </FormField>
                  </div>
                ) : (
                  <FormField label="Các thứ đi làm" id={`${key}-weekdays`} error={errors?.weekdays?.message}>
                    <div id={`${key}-weekdays`} className="flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((w) => {
                        const on = weekdays.includes(w.value);
                        return (
                          <button
                            key={w.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              setValue(`${key}.weekdays`, on ? weekdays.filter((x) => x !== w.value) : [...weekdays, w.value], { shouldValidate: true })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs border ${on ? "bg-pink-500/30 border-pink-400/50 text-white" : "border-white/10 text-slate-400"}`}
                          >
                            {w.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}
                <div>
                  <div className="text-xs text-slate-500 mb-1">14 ngày tới</div>
                  <Preview control={control} name={key} overrides={data.workOverrides.filter((o) => o.person === person)} />
                </div>
              </div>
            );
          })}
        </div>
        <button type="submit" disabled={formState.isSubmitting} className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-sm font-semibold disabled:opacity-50">
          {formState.isSubmitting ? "Đang lưu…" : "Lưu lịch làm"}
        </button>
      </form>

      <OverridesPanel data={data} onChanged={onChanged} />
    </div>
  );
}

// The schema trims/drops the note (a transform), so input and output types differ.
type OverrideInput = z.input<typeof workOverrideSchema>;
type OverrideOutput = z.output<typeof workOverrideSchema>;

function OverridesPanel({ data, onChanged }: { data: CoupleData; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const [showPast, setShowPast] = useState(false);
  const today = todayYmd();
  const { register, handleSubmit, reset, formState } = useForm<OverrideInput, unknown, OverrideOutput>({
    resolver: zodResolver(workOverrideSchema),
    defaultValues: { person: 1, date: today, status: "off", note: "" },
  });

  const list = data.workOverrides.filter((o) => showPast || o.date >= today);

  const onAdd = async (values: OverrideOutput) => {
    const res = await fetch("/api/admin/couple/work-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error || "Không lưu được ngày sửa riêng");
      return;
    }
    toast.success("Đã lưu ngày sửa riêng");
    reset({ ...values, note: "" });
    await onChanged();
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/admin/couple/work-overrides/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xoá được");
      return;
    }
    await onChanged();
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Ngày sửa riêng</h3>
        <label className="inline-flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Hiện ngày đã qua
        </label>
      </div>
      <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
        <FormField label="Người" id="ov-person">
          <select id="ov-person" {...register("person", { setValueAs: (v) => Number(v) })} className={inputClass}>
            <option value={1}>{data.person1}</option>
            <option value={2}>{data.person2}</option>
          </select>
        </FormField>
        <FormField label="Ngày" id="ov-date" error={formState.errors.date?.message}>
          <input id="ov-date" type="date" {...register("date")} className={inputClass} />
        </FormField>
        <FormField label="Trạng thái" id="ov-status">
          <select id="ov-status" {...register("status")} className={inputClass}>
            <option value="off">Nghỉ</option>
            <option value="work">Đi làm</option>
          </select>
        </FormField>
        <FormField label="Ghi chú" id="ov-note" error={formState.errors.note?.message}>
          <input id="ov-note" placeholder="nghỉ phép, đổi ca…" {...register("note")} className={inputClass} />
        </FormField>
        <button type="submit" disabled={formState.isSubmitting} className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white">
          Thêm
        </button>
      </form>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có ngày sửa riêng.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {list.map((o) => (
            <li key={o.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-200">
                {parseYmd(o.date).d}/{parseYmd(o.date).m}/{parseYmd(o.date).y} · {o.person === 1 ? data.person1 : data.person2} ·{" "}
                {o.status === "work" ? "đi làm" : "nghỉ"}
                {o.note ? ` (${o.note})` : ""}
              </span>
              <button type="button" onClick={() => onDelete(o.id)} aria-label="Xoá" className="text-slate-500 hover:text-red-400">
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the tab to `src/app/admin/couple/page.tsx`**

Import:

```tsx
import WorkScheduleTab from "@/components/admin/couple/WorkScheduleTab";
```

Add `| "workSchedule"` to `type TabId`. Insert this button before the `info` tab button:

```tsx
        <button
          onClick={() => setActiveTab("workSchedule")}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "workSchedule"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span className="inline-flex items-center gap-1"><Icon name="calendar" size={13} /> Lịch làm</span>
        </button>
```

In the tab-body ternary chain, before the branch that renders `activeTab === "info"`, add:

```tsx
      ) : activeTab === "workSchedule" && data ? (
        <WorkScheduleTab key={JSON.stringify(data.workSchedules)} data={data} onChanged={() => fetchData(false)} />
```

(`key` remounts the form with fresh defaults after a save. Confirm `fetchData` returns a Promise; if it is declared `async`, it does.)

- [ ] **Step 3: Type check and lint**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "^\.next/"` → no output.
Run: `npx eslint src/components/admin/couple src/app/admin/couple/page.tsx` → no errors in the new file; `page.tsx` errors only on lines not touched by this plan.

- [ ] **Step 4: Verify in the browser (read-only against the real DB)**

Open `/admin/couple` → "Lịch làm" after logging in. Without saving: switching a card between "Hành chính" and "Xoay vòng" swaps the fields, and the 14-day preview updates as you type (e.g. rotation 1/2 from today shows Làm, Nghỉ, Nghỉ, Làm…). Submitting with "Số ngày làm" = 0 shows "Ít nhất 1" and sends no request (check the Network panel). **Do not click Save** unless the schema has been pushed (see Task 12).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/couple/WorkScheduleTab.tsx src/app/admin/couple/page.tsx
git commit -m "feat(admin): work schedule tab with rotation/office and day overrides

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Final verification and PR

**Files:** none new.

- [ ] **Step 1: Full checks**

```bash
npm test
npx tsc --noEmit -p .
npm run lint
```

Expected: tests PASS; `tsc` has no errors outside stale `.next/types` of removed routes; lint shows no errors in files created by this plan (pre-existing `no-explicit-any` in `src/app/layout.tsx` and `src/app/admin/couple/page.tsx` may remain).

- [ ] **Step 2: Push the branch and open the PR into `develop`**

```bash
git push -u origin feature/couple-calendar
```

```bash
gh pr create --base develop --head feature/couple-calendar --title "feat(couple): lunar-solar calendar and work schedules" --body-file -
```

PR body must include, before the test plan:

```markdown
## ⚠️ Deploy order
This adds 2 tables and a `calendarType` column (default `"solar"`, no data migration).
1. `npx prisma db push` against the production database
2. then deploy this branch
Deploying first makes `/api/couple` fail on the missing tables.
```

and end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 3: Bind the PR in the app** (`mcp__ccd_pr__get_status`, then `bind_pr` if not bound) and report the link.

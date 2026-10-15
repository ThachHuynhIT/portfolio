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

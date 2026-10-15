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

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

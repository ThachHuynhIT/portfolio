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

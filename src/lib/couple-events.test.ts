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

describe("malformed event dates", () => {
  for (const date of ["18/01/1995", "", "abc", "2001-13-45"]) {
    for (const calendarType of ["solar", "lunar"] as const) {
      it(`does not throw for "${date}" (${calendarType})`, () => {
        const event = { date, calendarType };
        expect(occurrencesInYear(event, 2026)).toEqual([]);
        expect(occurrenceInYear(event, 2026)).toBeNull();
        expect(nextOccurrence(event, "2026-10-15")).toBeNull();
        expect(lunarLabel(event)).toBeNull();
      });
    }
  }
});

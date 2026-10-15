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

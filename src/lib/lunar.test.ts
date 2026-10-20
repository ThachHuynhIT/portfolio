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

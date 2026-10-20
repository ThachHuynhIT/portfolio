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

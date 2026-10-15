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

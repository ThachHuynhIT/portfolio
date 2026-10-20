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

import { describe, expect, it } from "vitest";
import { buildMonthGrid } from "./calendar-grid";

describe("buildMonthGrid", () => {
  it("builds 42 Monday-first cells for October 2026", () => {
    const grid = buildMonthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ date: "2026-09-28", inMonth: false }); // Monday before 1/10 (Thu)
    expect(grid[3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it("starts on the 1st when the month begins on Monday", () => {
    expect(buildMonthGrid(2026, 6)[0]).toEqual({ date: "2026-06-01", inMonth: true });
  });
});

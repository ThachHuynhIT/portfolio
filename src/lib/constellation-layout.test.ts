import { describe, expect, it } from "vitest";
import { layoutConstellation } from "./constellation-layout";

describe("layoutConstellation", () => {
  it("edges_connect_neighbouring_rows_and_adjacent_columns", () => {
    for (let count = 2; count <= 30; count++) {
      const { nodes, edges } = layoutConstellation(Array.from({ length: count }, (_, i) => ({ id: String(i) })));
      for (const [from, to] of edges) {
        const a = nodes.findIndex((node) => node.id === from);
        const b = nodes.findIndex((node) => node.id === to);
        const rowA = Math.floor(a / 2);
        const rowB = Math.floor(b / 2);
        expect(Math.abs(rowB - rowA)).toBeLessThanOrEqual(1);
        if (rowA === rowB) expect(Math.abs(nodes[b].x - nodes[a].x)).toBe(50);
        else expect(nodes[b].x).toBe(nodes[a].x);
      }
    }
  });
  it("adds_small_vertical_jitter_between_columns", () => {
    const { nodes } = layoutConstellation([{ id: "a" }, { id: "b" }]);
    expect(nodes[0].y).not.toBe(nodes[1].y);
    expect(Math.abs(nodes[0].y - nodes[1].y)).toBeLessThanOrEqual(8);
  });
  it("empty", () => expect(layoutConstellation([])).toEqual({ nodes: [], edges: [] }));
  it("singleton", () => {
    const result = layoutConstellation([{ id: "a" }]);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toEqual([]);
  });
  it("deterministic_and_bounded", () => {
    const skills = Array.from({ length: 30 }, (_, i) => ({ id: String(i) }));
    const result = layoutConstellation(skills);
    expect(result).toEqual(layoutConstellation(skills));
    for (const node of result.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(100);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(100);
    }
  });
  it("edges_join_distinct_existing_ids", () => {
    const result = layoutConstellation([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const ids = result.nodes.map((node) => node.id);
    expect(result.edges.length).toBeGreaterThan(0);
    for (const [a, b] of result.edges) {
      expect(a).not.toBe(b);
      expect(ids).toContain(a);
      expect(ids).toContain(b);
    }
  });
});

/** Two roomy columns, traversed in serpentine order with stable vertical jitter. */
export function layoutConstellation(skills: readonly { id: string }[]): {
  nodes: { id: string; x: number; y: number }[];
  edges: [string, string][];
} {
  const unique = [...new Map(skills.map((skill) => [skill.id, skill])).values()];
  const columns = Math.max(1, Math.min(2, unique.length));
  const rows = Math.ceil(unique.length / columns);
  const nodes = unique.map(({ id }, i) => {
    const row = Math.floor(i / columns);
    const column = row % 2 === 0 ? i % columns : columns - 1 - i % columns;
    return {
      id,
      x: columns === 1 ? 50 : 25 + column * 50,
      y: (rows === 1 ? 50 : 15 + row * 70 / (rows - 1)) + (columns === 1 ? 0 : [-4, 4][column] / rows),
    };
  });
  const edges: [string, string][] = nodes.slice(1).map((node, i) => [nodes[i].id, node.id]);
  return { nodes, edges };
}

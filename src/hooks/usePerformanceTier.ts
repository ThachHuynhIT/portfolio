"use client";

import { useEffect, useState } from "react";

export type PerformanceTier = "high" | "low";

/**
 * Rough heuristic used to scale back decorative 3D scene complexity
 * (particle counts, antialiasing) on touch devices and low-core-count
 * hardware, where multiple concurrent WebGL canvases are most costly.
 */
export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>("high");

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isLowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
    setTier(isCoarsePointer || isLowCore ? "low" : "high");
  }, []);

  return tier;
}

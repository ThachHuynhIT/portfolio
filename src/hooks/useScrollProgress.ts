"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Tracks normalized page scroll progress (0 at the top, 1 at the bottom) in
 * a mutable ref instead of React state — read every frame inside a R3F
 * `useFrame` loop, this never triggers a re-render (same pattern as
 * `mousePositionRef` in HeroSection: high-frequency values live in a ref,
 * not state).
 */
export function useScrollProgressRef() {
  const progressRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      progressRef.current =
        scrollable > 0
          ? THREE.MathUtils.clamp(window.scrollY / scrollable, 0, 1)
          : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return progressRef;
}

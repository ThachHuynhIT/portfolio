"use client";

import { useEffect, useRef } from "react";
import { BlackHoleEngine, type EngineStats } from "./engine";

export interface BlackHoleCanvasProps {
  className?: string;
  /** Drag-to-orbit / scroll-to-zoom. Off for decorative/background use. */
  interactive?: boolean;
  /** Multiplies the final render color. */
  brightness?: number;
  /** Multiplies the particle sprites' color independently of `brightness`. */
  particleBrightness?: number;
  /** Tints the final render color (hex). */
  tint?: string;
  /** Ties the camera to page scroll instead of drag/wheel: eases from the
   * default equatorial view toward near-overhead + zoomed out across the
   * full scrollable page (0 at the top, 1 at the very bottom — not this
   * element's own position, so it works whether the element is fixed or
   * scrolls with the page). Off by default. */
  scrollEffect?: boolean;
  onStats?: (s: EngineStats) => void;
  onReady?: () => void;
  onInteract?: () => void;
}

/**
 * Mounts the raymarched Schwarzschild black hole (src/components/3d/blackhole)
 * on its own canvas + THREE.WebGLRenderer — NOT an R3F scene, so it does not
 * go through SceneContainer (that wrapper is for the react-three-fiber
 * <Canvas> pipeline only; this engine manages its own imperative Three.js
 * renderer and animation loop, same as it does in the source project).
 *
 * Sizes itself against its parent element via ResizeObserver, so it works
 * both fullscreen (404 page) and as a section-scoped background (Hero).
 */
export default function BlackHoleCanvas({
  className,
  interactive = true,
  brightness,
  particleBrightness,
  tint,
  scrollEffect = false,
  onStats,
  onReady,
  onInteract,
}: BlackHoleCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    let engine: BlackHoleEngine | null = null;
    try {
      if (!BlackHoleEngine.isSupported()) return;
      engine = new BlackHoleEngine(canvas, {
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        container: mount,
        interactive,
        brightness,
        particleBrightness,
        tint,
        onStats,
        onReady,
        onInteract,
      });
    } catch (err) {
      console.error("3D scene failed to render, falling back to static background:", err);
    }

    // Scroll-driven camera: rAF-throttled, mutates the engine + DOM directly
    // instead of going through React state (same rationale as the
    // mousePositionRef pattern elsewhere — this fires on every scroll tick).
    // Camera progress spans the ENTIRE scrollable page (completes exactly at
    // the bottom), so the tilt/zoom plays out gradually all the way to the
    // footer instead of finishing after one screen of scrolling.
    let rafPending = false;
    let onScroll: (() => void) | null = null;
    if (scrollEffect && engine) {
      const updateProgress = () => {
        rafPending = false;
        const viewportH = Math.max(window.innerHeight, 1);
        const maxScroll = Math.max(document.documentElement.scrollHeight - viewportH, 1);
        const cameraProgress = window.scrollY / maxScroll;
        engine?.setScrollProgress(cameraProgress);
      };
      onScroll = () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(updateProgress);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      updateProgress();
    }

    return () => {
      if (onScroll) window.removeEventListener("scroll", onScroll);
      engine?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine owns its own lifecycle; re-mounting on every callback identity change would restart the sim
  }, [interactive, brightness, particleBrightness, tint, scrollEffect]);

  return (
    <div ref={mountRef} className={className} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

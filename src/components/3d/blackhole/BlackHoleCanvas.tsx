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
   * scrolls with the page). Off by default. The simulation keeps running at
   * every scroll position. */
  scrollEffect?: boolean;
  /** Decorative use: don't build the renderer during page load. Waits for
   * the browser to go idle after `load` (and, on low-power devices, for the
   * first scroll/touch/key or a few seconds), then fades the canvas in —
   * keeps engine setup + shader compile off the hydration critical path. */
  deferStart?: boolean;
  onStats?: (s: EngineStats) => void;
  onReady?: () => void;
  onInteract?: () => void;
}

// Set once any deferred instance has started: later remounts (theme switch,
// client navigation back home) skip the "wait for engagement" phase.
let deferredWarm = false;

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
  deferStart = false,
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
    let disposed = false;
    let rafPending = false;
    let onScroll: (() => void) | null = null;
    const cancelDeferred: Array<() => void> = [];

    const start = () => {
      if (disposed || engine) return;
      cancelDeferred.forEach((cancel) => cancel());
      if (deferStart) deferredWarm = true;
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
          onReady: () => {
            if (deferStart) mount.style.opacity = "1";
            onReady?.();
          },
          onInteract,
        });
      } catch (err) {
        console.error("3D scene failed to render, falling back to static background:", err);
      }
      if (scrollEffect) attachScroll();
    };

    // Scroll-driven camera: rAF-throttled, mutates the engine + DOM directly
    // instead of going through React state (same rationale as the
    // mousePositionRef pattern elsewhere — this fires on every scroll tick).
    // Camera progress spans the ENTIRE scrollable page (completes exactly at
    // the bottom), so the tilt/zoom plays out gradually all the way to the
    // footer instead of finishing after one screen of scrolling.
    const attachScroll = () => {
      if (!engine) return;
      const updateProgress = () => {
        rafPending = false;
        const viewportH = Math.max(window.innerHeight, 1);
        const maxScroll = Math.max(document.documentElement.scrollHeight - viewportH, 1);
        const cameraProgress = window.scrollY / maxScroll;
        // The black hole is the page-wide background, so it keeps animating
        // past the Hero too (no setIdle) — freezing it there made it look
        // like it stuttered, moving only while scrolling. The engine's
        // adaptive resolution + low-power fps cap keep the cost in check.
        engine?.setScrollProgress(cameraProgress);
      };
      onScroll = () => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(updateProgress);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      updateProgress();
    };

    if (!deferStart) {
      start();
    } else {
      mount.style.opacity = "0";
      const lowPower =
        window.matchMedia("(pointer: coarse)").matches ||
        window.innerWidth < 768 ||
        (navigator.hardwareConcurrency ?? 8) <= 4;
      const whenIdle = () => {
        if (typeof window.requestIdleCallback === "function") {
          const id = window.requestIdleCallback(start, { timeout: 2000 });
          cancelDeferred.push(() => window.cancelIdleCallback(id));
        } else {
          const id = setTimeout(start, 200);
          cancelDeferred.push(() => clearTimeout(id));
        }
      };
      const afterLoad = () => {
        if (!lowPower || deferredWarm) return whenIdle();
        // Phones: start on the first sign of engagement, or once things have
        // been quiet for a while anyway.
        const id = window.setTimeout(whenIdle, 3500);
        cancelDeferred.push(() => window.clearTimeout(id));
        const events = ["scroll", "touchstart", "pointerdown", "keydown"] as const;
        const onEngage = () => whenIdle();
        events.forEach((e) => window.addEventListener(e, onEngage, { once: true, passive: true }));
        cancelDeferred.push(() => events.forEach((e) => window.removeEventListener(e, onEngage)));
      };
      if (document.readyState === "complete") afterLoad();
      else {
        window.addEventListener("load", afterLoad, { once: true });
        cancelDeferred.push(() => window.removeEventListener("load", afterLoad));
      }
    }

    return () => {
      disposed = true;
      cancelDeferred.forEach((cancel) => cancel());
      if (onScroll) window.removeEventListener("scroll", onScroll);
      engine?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine owns its own lifecycle; re-mounting on every callback identity change would restart the sim
  }, [interactive, brightness, particleBrightness, tint, scrollEffect, deferStart]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={deferStart ? { transition: "opacity 1.2s ease-out" } : undefined}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

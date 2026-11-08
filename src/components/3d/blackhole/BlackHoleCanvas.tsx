"use client";

import { useEffect, useRef } from "react";
import { BlackHoleEngine, type EngineStats } from "./engine";
import { mapScrollProgress } from "@/lib/motion-math";

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
  /** The portfolio hero completes its camera movement within its own section. */
  scrollScope?: "page" | "hero";
  /** Decorative use: don't build the renderer during page load. Waits for
   * the browser to go idle after `load` (and, on low-power devices, for the
   * first scroll/touch/key or a few seconds), then fades the canvas in —
   * keeps engine setup + shader compile off the hydration critical path. */
  deferStart?: boolean;
  onStats?: (s: EngineStats) => void;
  onReady?: () => void;
  onUnavailable?: () => void;
  onInteract?: () => void;
}

// Set once any deferred instance has started: later remounts (theme switch,
// client navigation back home) skip the "wait for engagement" phase.
let deferredWarm = false;

const CANVAS_CLASS = "block h-full w-full touch-none";

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
  scrollScope = "page",
  deferStart = false,
  onStats,
  onReady,
  onUnavailable,
  onInteract,
}: BlackHoleCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // A fresh <canvas> per effect run: engine.dispose() calls
    // forceContextLoss(), and getContext() on that same element would hand
    // the next engine (theme switch changes brightness -> effect re-runs;
    // StrictMode double-mount) the already-lost context. Only the old
    // renderer's context is released; no extra renderer is created.
    const canvas = document.createElement("canvas");
    canvas.className = CANVAS_CLASS;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    mount.appendChild(canvas);

    let engine: BlackHoleEngine | null = null;
    let disposed = false;
    // Set on the first start() attempt so a second queued deferred callback
    // (idle + engagement can both fire) never builds another renderer, even
    // when the first attempt failed and left `engine` null.
    let started = false;
    // Pending scroll rAF id (0 = none), kept so cleanup can cancel it and a
    // queued update never touches a disposed engine.
    let scrollRaf = 0;
    let onScroll: (() => void) | null = null;
    const cancelDeferred: Array<() => void> = [];
    const runCancelDeferred = () => {
      cancelDeferred.splice(0).forEach((cancel) => cancel());
    };

    const start = () => {
      if (disposed || started) return;
      started = true;
      runCancelDeferred();
      if (deferStart) deferredWarm = true;
      try {
        if (!BlackHoleEngine.isSupported()) { onUnavailable?.(); return; }
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
        onUnavailable?.();
        console.error("3D scene failed to render, falling back to static background:", err);
      }
      if (scrollEffect) attachScroll();
    };

    // Ref/RAF-driven camera. Existing page consumers keep their mapping;
    // the homepage explicitly opts into its section's range.
    const attachScroll = () => {
      if (!engine) return;
      const updateProgress = () => {
        scrollRaf = 0;
        if (disposed) return;
        const viewportH = Math.max(window.innerHeight, 1);
        const maxScroll = Math.max(document.documentElement.scrollHeight - viewportH, 1);
        const hero = scrollScope === "hero" ? mount.closest("section") : null;
        const rect = hero?.getBoundingClientRect();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const cameraProgress = reduced ? 0 : rect
          ? mapScrollProgress(-rect.top, rect.height)
          : mapScrollProgress(window.scrollY, maxScroll);
        engine?.setScrollProgress(cameraProgress);
      };
      onScroll = () => {
        if (scrollRaf || disposed) return;
        scrollRaf = requestAnimationFrame(updateProgress);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
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
        if (disposed || started) return;
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
      // Same order as engine.dispose(): mark disposed, cancel everything
      // queued (deferred starts, scroll rAF, listeners), then free the engine.
      disposed = true;
      runCancelDeferred();
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
      if (onScroll) window.removeEventListener("scroll", onScroll);
      if (onScroll) window.removeEventListener("resize", onScroll);
      onScroll = null;
      engine?.dispose();
      engine = null;
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine owns its own lifecycle; re-mounting on every callback identity change would restart the sim
  }, [interactive, brightness, particleBrightness, tint, scrollEffect, scrollScope, deferStart]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={deferStart ? { transition: "opacity 1.2s ease-out" } : undefined}
      aria-hidden="true"
    />
  );
}

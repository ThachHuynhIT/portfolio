"use client";

import { useEffect, useRef } from "react";
import { BlackHoleEngine, type EngineStats } from "./engine";

export interface BlackHoleCanvasProps {
  className?: string;
  /** Drag-to-orbit / scroll-to-zoom. Off for decorative/background use. */
  interactive?: boolean;
  /** Multiplies the final render color. */
  brightness?: number;
  /** Tints the final render color (hex). */
  tint?: string;
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
  tint,
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
        tint,
        onStats,
        onReady,
        onInteract,
      });
    } catch (err) {
      console.error("3D scene failed to render, falling back to static background:", err);
    }

    return () => engine?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine owns its own lifecycle; re-mounting on every callback identity change would restart the sim
  }, [interactive, brightness, tint]);

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

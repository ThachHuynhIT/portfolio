"use client";

import { Canvas } from "@react-three/fiber";
import { Component, Suspense, ReactNode, RefObject, useEffect, useRef, useState } from "react";

interface SceneContainerProps {
  fallback?: ReactNode;
  /** Explicit occlusion gate for fixed scenes hidden behind the homepage hero. */
  paused?: boolean;
  children: ReactNode;
  className?: string;
  /**
   * Set true only for the primary interactive centerpiece scene (e.g. Hero).
   * Decorative/background scenes default to false to skip antialiasing and
   * cap DPR lower, since multiple such canvases can run concurrently.
   */
  highQuality?: boolean;
  /**
   * Render a single frame (R3F `frameloop="demand"`) instead of animating —
   * for a background that is mostly hidden behind other content.
   */
  still?: boolean;
}

const STATIC_FALLBACK = (
  <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
);

/**
 * Swallows WebGL/canvas rendering errors so a GPU/driver failure degrades to
 * a static background instead of taking down the page.
 */
class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D scene failed to render, falling back to static background:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Pauses the Canvas render loop while the browser tab is in the background,
 * so decorative/always-mounted scenes (e.g. the site-wide starry background)
 * stop competing for GPU/CPU budget when the user isn't looking at the tab.
 */
function useIsTabVisible() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
}

/**
 * Pauses the render loop while the canvas is scrolled out of view — a
 * section-scoped scene (e.g. Contact particles) otherwise keeps rendering
 * after the visitor scrolls back up.
 */
function useIsInView(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled]);

  return inView;
}

/**
 * Wrapper component for React Three Fiber scenes
 * Handles canvas setup, performance settings, and loading states
 */
export default function SceneContainer({
  children,
  className = "",
  highQuality = false,
  still = false,
  paused = false,
  fallback = STATIC_FALLBACK,
}: SceneContainerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isTabVisible = useIsTabVisible();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useIsInView(containerRef, prefersReducedMotion === false);

  if (prefersReducedMotion !== false) {
    return <div className={`absolute inset-0 ${className}`}>{fallback}</div>;
  }

  return (
    <div ref={containerRef} className={`absolute inset-0 ${className}`}>
      <SceneErrorBoundary fallback={fallback}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={highQuality ? [1, 2] : [1, 1.5]}
          frameloop={paused || !isTabVisible || !isInView ? "never" : still ? "demand" : "always"}
          gl={{
            antialias: highQuality,
            alpha: true,
            powerPreference: highQuality ? "high-performance" : "low-power",
          }}
          // Skip the per-program info-log readback (a sync wait on shader
          // compile) outside dev.
          onCreated={({ gl }) => {
            gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
          }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}

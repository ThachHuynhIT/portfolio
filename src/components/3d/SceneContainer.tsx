"use client";

import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Component, Suspense, ReactNode, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface SceneContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * Set true only for the primary interactive centerpiece scene (e.g. Hero).
   * Decorative/background scenes default to false to skip antialiasing and
   * cap DPR lower, since multiple such canvases can run concurrently.
   */
  highQuality?: boolean;
}

const STATIC_FALLBACK = (
  <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
);

/**
 * Swallows WebGL/canvas rendering errors so a GPU/driver failure degrades to
 * a static background instead of taking down the page.
 */
class SceneErrorBoundary extends Component<
  { children: ReactNode },
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
      return STATIC_FALLBACK;
    }
    return this.props.children;
  }
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
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
}

/**
 * Wrapper component for React Three Fiber scenes
 * Handles canvas setup, performance settings, and loading states
 */
export default function SceneContainer({
  children,
  className = "",
  highQuality = false,
}: SceneContainerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isTabVisible = useIsTabVisible();

  if (prefersReducedMotion) {
    return <div className={`absolute inset-0 ${className}`}>{STATIC_FALLBACK}</div>;
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={highQuality ? [1, 2] : [1, 1.5]}
          frameloop={isTabVisible ? "always" : "never"}
          gl={{
            antialias: highQuality,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            {children}
            <Preload all />
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}

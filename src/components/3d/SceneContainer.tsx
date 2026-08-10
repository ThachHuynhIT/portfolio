"use client";

import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Component, Suspense, ReactNode, useEffect, useState } from "react";

interface SceneContainerProps {
  children: ReactNode;
  className?: string;
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

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
 * Wrapper component for React Three Fiber scenes
 * Handles canvas setup, performance settings, and loading states
 */
export default function SceneContainer({
  children,
  className = "",
}: SceneContainerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={`absolute inset-0 ${className}`}>{STATIC_FALLBACK}</div>;
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
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

"use client";

import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Suspense, ReactNode } from "react";

interface SceneContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for React Three Fiber scenes
 * Handles canvas setup, performance settings, and loading states
 */
export default function SceneContainer({
  children,
  className = "",
}: SceneContainerProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
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
    </div>
  );
}

"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import SceneContainer from "./SceneContainer";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";

/**
 * Nebula Dust & Star Clusters layer
 */
function CosmicParticles({ count = 1200 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Cylindrical / spherical spread across space
      const radius = 5 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      // Subtle cyan to violet to silver-white palette
      const seed = Math.random();
      if (seed < 0.4) {
        // Soft violet
        col[i * 3] = 0.65;
        col[i * 3 + 1] = 0.45;
        col[i * 3 + 2] = 0.95;
      } else if (seed < 0.75) {
        // Soft cyan
        col[i * 3] = 0.3;
        col[i * 3 + 1] = 0.8;
        col[i * 3 + 2] = 0.95;
      } else {
        // Diamond white
        col[i * 3] = 0.95;
        col[i * 3 + 1] = 0.95;
        col[i * 3 + 2] = 1.0;
      }
    }

    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow, majestic rotation
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.012;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.006) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * StarryBackground3D - Complete 3D Starry Sky background without any bulky shapes.
 * Provides a stunning deep-space aesthetic that runs seamlessly across the portfolio.
 */
export default function StarryBackground3D() {
  // This canvas is mounted globally on every non-admin route, so on
  // touch/low-core devices we halve the point counts to keep it cheap
  // even while other decorative canvases run concurrently on the same page.
  const performanceTier = usePerformanceTier();
  const isLowTier = performanceTier === "low";

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#030014]">
      {/* Deep cosmic gradient overlays to ensure high contrast for typography */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/60 via-[#040118]/80 to-[#02000d] pointer-events-none z-10" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-purple-900/10 blur-[150px] pointer-events-none z-10 rounded-full" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-cyan-900/10 blur-[160px] pointer-events-none z-10 rounded-full" />

      <SceneContainer className="w-full h-full">
        {/* Distant stars field with subtle natural twinkle */}
        <Stars
          radius={100}
          depth={50}
          count={isLowTier ? 2500 : 5000}
          factor={4}
          saturation={0}
          fade
          speed={0.8}
        />
        {/* Floating cosmic dust & colored stellar particles */}
        <CosmicParticles count={isLowTier ? 750 : 1500} />
      </SceneContainer>
    </div>
  );
}

"use client";

import { Stars } from "@react-three/drei";
import SceneContainer from "./SceneContainer";
import WarpTunnel from "./WarpTunnel";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useScrollProgressRef } from "@/hooks/useScrollProgress";

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

  // Mutable ref updated on scroll (never a React state) — WarpTunnel reads
  // it every frame inside useFrame, same high-frequency-value pattern as
  // HeroSection's mousePositionRef.
  const scrollProgressRef = useScrollProgressRef();

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
        {/* Rotating 3D particle tunnel — spins faster the further you
            scroll, and accelerates into hyperspace-style light streaks
            once you approach the bottom of the page. */}
        <WarpTunnel scrollProgressRef={scrollProgressRef} count={isLowTier ? 280 : 550} />
      </SceneContainer>
    </div>
  );
}

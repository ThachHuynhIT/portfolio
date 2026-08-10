"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleFieldProps {
  count?: number;
  color?: string;
  size?: number;
  spread?: number;
}

/**
 * Subtle animated particle field for background effects
 */
export default function ParticleField({
  count = 1000,
  color = "#8b5cf6",
  size = 0.02,
  spread = 20,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return pos;
  }, [count, spread]);

  const velocities = useMemo(() => {
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return vel;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const positionAttribute = pointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const positions = positionAttribute.array as Float32Array;

      for (let i = 0; i < count; i++) {
        // Add slight wave motion
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] +=
          Math.sin(state.clock.elapsedTime + i * 0.1) * 0.001;
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        // Boundary check - wrap around
        const halfSpread = spread / 2;
        if (Math.abs(positions[i * 3]) > halfSpread) {
          positions[i * 3] = -positions[i * 3];
        }
        if (Math.abs(positions[i * 3 + 1]) > halfSpread) {
          positions[i * 3 + 1] = -positions[i * 3 + 1];
        }
        if (Math.abs(positions[i * 3 + 2]) > halfSpread) {
          positions[i * 3 + 2] = -positions[i * 3 + 2];
        }
      }

      positionAttribute.needsUpdate = true;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

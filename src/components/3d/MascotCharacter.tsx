"use client";

import { MutableRefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MascotCharacterProps {
  /**
   * Mutable ref holding the cursor's direction relative to the widget,
   * normalized to roughly [-1, 1] on each axis. Updated from a
   * window-level pointermove listener (see MascotWidget) so the mascot
   * reacts to the cursor anywhere on the page, not just over its own
   * small canvas. Read inside useFrame only — never drives React state.
   */
  pointerRef: MutableRefObject<{ x: number; y: number }>;
}

const PURPLE = "#8b5cf6";
const CYAN = "#06b6d4";

/**
 * A small procedural character (no external model/asset) for the floating
 * mascot widget. Kept to primitives + basic materials on purpose.
 */
export default function MascotCharacter({ pointerRef }: MascotCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const nextBlinkAtRef = useRef(2 + Math.random() * 2);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const { x: pointerX, y: pointerY } = pointerRef.current;

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.6) * 0.12;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15 + pointerX * 0.15;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, pointerX * 0.08, 0.05);
    }

    if (headRef.current) {
      const targetY = THREE.MathUtils.clamp(pointerX * 0.7, -0.7, 0.7);
      const targetX = THREE.MathUtils.clamp(pointerY * 0.4, -0.4, 0.4);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, 0.1);
    }

    if (eyeLeftRef.current && eyeRightRef.current) {
      nextBlinkAtRef.current -= delta;
      const blinking = nextBlinkAtRef.current < 0.12;
      const scaleY = blinking ? 0.1 : 1;
      eyeLeftRef.current.scale.y = scaleY;
      eyeRightRef.current.scale.y = scaleY;
      if (nextBlinkAtRef.current < 0) {
        nextBlinkAtRef.current = 2.5 + Math.random() * 2.5;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} />

      {/* body */}
      <mesh position={[0, -0.55, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color={PURPLE} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* head */}
      <group ref={headRef} position={[0, 0.35, 0]}>
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color={PURPLE} roughness={0.35} metalness={0.1} />
        </mesh>

        <mesh ref={eyeLeftRef} position={[-0.22, 0.05, 0.5]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.22, 0.05, 0.5]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>

        {/* antenna */}
        <mesh position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* accent ring */}
      <mesh rotation={[Math.PI / 2.3, 0, 0]} position={[0, -0.1, 0]}>
        <torusGeometry args={[0.72, 0.035, 12, 48]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

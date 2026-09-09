"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface Hero3DSceneProps {
  mousePosition: { x: number; y: number };
  theme?: "light" | "dark";
}

/**
 * Floating Geometric Sphere - Main 3D centerpiece for the hero section
 */
function FloatingGeometry({ mousePosition }: Hero3DSceneProps) {
  const meshRef = useRef<THREE.Group>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth rotation based on mouse position
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        mousePosition.y * 0.3,
        0.05
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        mousePosition.x * 0.3 + state.clock.elapsedTime * 0.1,
        0.05
      );
    }

    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      innerMeshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={meshRef}>
        {/* Outer distorted sphere.
            Kept low-metalness/emissive: a highly metallic PBR material with
            no environment map to reflect renders as a flat gray/near-black
            blob (only direct-light specular shows) — invisible against the
            old dark-only background but glaring as an opaque gray disc once
            the page could also be light. Leaning on diffuse color + a bit of
            emissive keeps the sphere reading as vivid purple in both themes. */}
        <mesh scale={2.5}>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color="#8b5cf6"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.4}
            metalness={0.15}
            emissive="#8b5cf6"
            emissiveIntensity={0.25}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Inner glowing core */}
        <mesh ref={innerMeshRef} scale={1.2}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.5}
            metalness={1}
            roughness={0.1}
            wireframe
          />
        </mesh>

        {/* Center point light */}
        <pointLight color="#8b5cf6" intensity={2} distance={5} />
      </group>
    </Float>
  );
}

/**
 * Orbiting particles around the main geometry
 */
function OrbitingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 500;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 3;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Gradient colors from purple to cyan
      const t = Math.random();
      col[i * 3] = 0.55 + t * 0.15; // R
      col[i * 3 + 1] = 0.36 - t * 0.1; // G
      col[i * 3 + 2] = 0.96 - t * 0.2; // B
    }

    return [pos, col];
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Background grid effect
 */
function BackgroundGrid({ theme = "dark" }: { theme?: "light" | "dark" }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshBasicMaterial
        color={theme === "light" ? "#c4bfe0" : "#1a1a2e"}
        wireframe
        transparent
        opacity={theme === "light" ? 0.25 : 0.15}
      />
    </mesh>
  );
}

/**
 * Scene lighting setup
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#ffffff"
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[10, -5, 5]} intensity={0.5} color="#06b6d4" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#fafafa"
      />
    </>
  );
}

/**
 * Main Hero 3D Scene Component
 */
export default function Hero3DScene({ mousePosition, theme = "dark" }: Hero3DSceneProps) {
  return (
    <>
      <Lighting />
      <fog attach="fog" args={[theme === "light" ? "#faf9fc" : "#050505", 8, 30]} />
      <BackgroundGrid theme={theme} />
      <FloatingGeometry mousePosition={mousePosition} />
      <OrbitingParticles />
    </>
  );
}

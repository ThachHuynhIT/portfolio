"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface WarpTunnelProps {
  /** 0 (top of page) .. 1 (bottom of page), updated every frame from a ref. */
  scrollProgressRef: React.MutableRefObject<number>;
  count?: number;
}

// Must stay roughly in sync with SceneContainer's <Canvas camera position>.
const CAMERA_Z = 8;
const TUNNEL_DEPTH = 34;
const MAX_RADIUS = 4.6;
const MIN_RADIUS = 0.6;

interface Particle {
  angle: number;
  radius: number;
  z: number;
  speed: number;
  colorMix: number;
}

function randomParticle(): Particle {
  return {
    angle: Math.random() * Math.PI * 2,
    radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
    z: -Math.random() * TUNNEL_DEPTH,
    speed: 0.5 + Math.random() * 0.9,
    colorMix: Math.random(),
  };
}

/**
 * A rotating "tunnel" of glowing particles used as the site-wide 3D
 * background's centerpiece. It behaves in two linked ways as the visitor
 * scrolls the page:
 *
 * 1. The whole tunnel spins gradually faster the further down the page you
 *    scroll (a steady, ambient rotation increase — not tied to warp).
 * 2. Once you approach the very bottom of the page, a `warp` factor ramps
 *    up (smoothstepped over the final ~18% of scroll) that accelerates the
 *    particles toward the camera and stretches them into long streaks —
 *    a hyperspace / "traveling through space at high speed" effect — while
 *    also punching in the camera FOV slightly for extra drama.
 *
 * All state lives in refs/instance attributes and is mutated in `useFrame`
 * only, so this never triggers a React re-render.
 */
export default function WarpTunnel({ scrollProgressRef, count = 550 }: WarpTunnelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorNear = useMemo(() => new THREE.Color("#a78bfa"), []);
  const colorFar = useMemo(() => new THREE.Color("#e0f2fe"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const rotationAccum = useRef(0);
  const baseFov = useRef(50);
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      baseFov.current = camera.fov;
    }
  }, [camera]);

  const particles = useMemo<Particle[]>(
    () => new Array(count).fill(0).map(randomParticle),
    [count]
  );

  useFrame((_state, rawDelta) => {
    // Clamp delta so a dropped frame / tab-refocus can't fling particles
    // across the whole tunnel in one jump.
    const delta = Math.min(rawDelta, 1 / 30);
    const scrollP = scrollProgressRef.current;

    // Warp only ramps up across the final stretch of the page.
    const warpRaw = THREE.MathUtils.clamp((scrollP - 0.82) / 0.18, 0, 1);
    const warp = warpRaw * warpRaw * (3 - 2 * warpRaw); // smoothstep

    // The tunnel spins gradually faster the further down the page you are,
    // then spins hardest once warp kicks in near the bottom.
    const rotSpeed = 0.06 + scrollP * 0.55 + warp * 1.7;
    rotationAccum.current += rotSpeed * delta;

    if (groupRef.current) {
      groupRef.current.rotation.z = rotationAccum.current;
      groupRef.current.rotation.x = Math.sin(scrollP * Math.PI) * 0.12;
    }

    // Subtle camera punch-in for extra "acceleration" feel during warp.
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = baseFov.current - warp * 12;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
      camera.updateProjectionMatrix();
    }

    const travelSpeed = 1.3 + warp * 26;
    const extraStretch = warp * 55;

    const mesh = meshRef.current;
    if (mesh) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z += travelSpeed * p.speed * delta;

        if (p.z > CAMERA_Z + 1) {
          const fresh = randomParticle();
          p.angle = fresh.angle;
          p.radius = fresh.radius;
          p.speed = fresh.speed;
          p.colorMix = fresh.colorMix;
          p.z = -TUNNEL_DEPTH;
        }

        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;

        dummy.position.set(x, y, p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1 + extraStretch * p.speed);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.copy(colorNear).lerp(colorFar, p.colorMix);
        mesh.setColorAt(i, tmpColor);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }

      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + warp * 0.55;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.018, 0.018, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}

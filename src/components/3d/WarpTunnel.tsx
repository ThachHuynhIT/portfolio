"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface WarpTunnelProps {
  /** 0 (top of page) .. 1 (bottom of page), updated every frame from a ref. */
  scrollProgressRef: React.MutableRefObject<number>;
  count?: number;
}

// Must stay roughly in sync with SceneContainer's <Canvas camera position>.
const CAMERA_Z = 8;
const Z_MIN = -26; // far end of the tunnel
const Z_MAX = 6; // near end, just short of the camera
const DEPTH_RANGE = Z_MAX - Z_MIN;
const MIN_RADIUS = 0.8;
const MAX_RADIUS = 4.2;

// How far scrolling the *entire* page carries you through the tunnel, and
// how much extra spin accumulates over a full scroll. Both are pure
// functions of scroll progress, not elapsed time — scrolling down feels
// like drifting deeper into the tunnel (particles come closer), scrolling
// back up backs you back out. There is no autonomous "flying toward the
// viewer" motion.
const SCROLL_DEPTH_TRAVEL = DEPTH_RANGE * 1.6;
const SCROLL_SPIN = Math.PI * 2.4;

// Static diagonal tilt on the tunnel's own axis so the rotation reads as a
// slanted/diagonal swirl from the camera's viewpoint, not a flat frontal spin.
const TILT_X = 0.55;
const TILT_Y = 0.22;

interface Particle {
  angle: number;
  radius: number;
  baseZ: number;
  twinklePhase: number;
}

function smoothstep(x: number, min: number, max: number) {
  const t = THREE.MathUtils.clamp((x - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Small soft radial-gradient sprite so each particle reads as a glowing dot with a gentle glare, not a hard square. */
function createGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * A slow, diagonally-tilted spiral of glowing dots used as the site-wide 3D
 * background's centerpiece. Depth and spin are driven directly by scroll
 * position (see SCROLL_DEPTH_TRAVEL/SCROLL_SPIN above) with only a very
 * gentle time-based idle drift layered on top so it doesn't look frozen
 * when the visitor stops scrolling.
 */
export default function WarpTunnel({ scrollProgressRef, count = 500 }: WarpTunnelProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const glowTexture = useMemo(() => createGlowTexture(), []);
  const colorNear = useMemo(() => new THREE.Color("#c4b5fd"), []);
  const colorFar = useMemo(() => new THREE.Color("#e0f2fe"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const particles = useMemo<Particle[]>(
    () =>
      new Array(count).fill(0).map(() => ({
        angle: Math.random() * Math.PI * 2,
        radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
        baseZ: Z_MIN + Math.random() * DEPTH_RANGE,
        twinklePhase: Math.random() * Math.PI * 2,
      })),
    [count]
  );

  const [positions, colors] = useMemo(
    () => [new Float32Array(count * 3), new Float32Array(count * 3)],
    [count]
  );

  useFrame((state) => {
    const scrollP = scrollProgressRef.current;
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.x = TILT_X;
      groupRef.current.rotation.y = TILT_Y;
      // Tiny idle drift (so it's not perfectly frozen at rest) + the main
      // slow spin, which is a direct function of how far you've scrolled.
      groupRef.current.rotation.z = t * 0.03 + scrollP * SCROLL_SPIN;
    }

    const depthOffset = scrollP * SCROLL_DEPTH_TRAVEL;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Wrap into [Z_MIN, Z_MAX) so scrolling deeper cycles seamlessly in
      // both directions (scroll up = drift back out) with no discontinuity.
      const raw = p.baseZ + depthOffset - Z_MIN;
      const wrapped = ((raw % DEPTH_RANGE) + DEPTH_RANGE) % DEPTH_RANGE;
      const z = Z_MIN + wrapped;

      // Gentle per-particle angular drift for a living, non-static feel —
      // slow enough to stay well within "xoáy chậm", not a fast orbit.
      const angle = p.angle + t * 0.012;
      positions[i * 3] = Math.cos(angle) * p.radius;
      positions[i * 3 + 1] = Math.sin(angle) * p.radius;
      positions[i * 3 + 2] = z;

      // Soft glare pulse + slight brightening as a particle nears the
      // camera end of the tunnel, plus a gentle twinkle.
      const nearness = smoothstep(z, Z_MIN, CAMERA_Z - 2);
      const twinkle = 0.85 + Math.sin(t * 1.4 + p.twinklePhase) * 0.15;

      tmpColor.copy(colorFar).lerp(colorNear, nearness);
      tmpColor.multiplyScalar(twinkle);
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    const geometry = pointsRef.current?.geometry;
    if (geometry) {
      (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={glowTexture}
          size={0.22}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

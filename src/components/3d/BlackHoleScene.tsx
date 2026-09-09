"use client";

import { useRef, useMemo, useEffect, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Float } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";

// ---------------------------------------------------------------------------
// A locally-generated environment map (three.js's built-in RoomEnvironment,
// baked via PMREMGenerator) so the glossy "4" materials get real reflections
// without depending on fetching an HDRI from an external CDN at runtime —
// that fetch fails outright in restricted/offline network conditions and
// silently breaks the whole scene (an unhandled Suspense rejection).
// ---------------------------------------------------------------------------
function ProceduralEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTexture.dispose();
    };
  }, [gl, scene]);

  return null;
}

// ---------------------------------------------------------------------------
// The "4"s sit ~7 units apart at scale 1, wider than the visible viewport on
// narrow/mobile screens (a fixed FOV maps to less visible width there). Scale
// the whole composition down to fit rather than letting it clip off-screen.
// ---------------------------------------------------------------------------
const COMPOSITION_TARGET_WIDTH = 7.6;

function ResponsiveComposition({ children }: { children: ReactNode }) {
  const viewportWidth = useThree((state) => state.viewport.width);
  const scale = Math.min(1, viewportWidth / COMPOSITION_TARGET_WIDTH);
  return <group scale={scale}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Event horizon: a solid, unlit black sphere. Real 3D geometry, so it
// naturally occludes (via the depth buffer) anything swirling behind it.
// ---------------------------------------------------------------------------
function EventHorizon({ radius }: { radius: number }) {
  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Thin bright Fresnel rim hugging the sphere's silhouette — a view-dependent
// shader on a slightly larger sphere: near-invisible face-on, bright at the
// grazing edge, like light bending around the event horizon.
// ---------------------------------------------------------------------------
function RimGlow({ radius }: { radius: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        uniforms: {
          uColor: { value: new THREE.Color("#e9d5ff") },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 2.2);
            gl_FragColor = vec4(uColor, fresnel);
          }
        `,
      }),
    []
  );

  return (
    <mesh renderOrder={3}>
      <sphereGeometry args={[radius * 1.05, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Swirling vortex glow: a camera-facing shader disc computing a spiral in
// polar coordinates, animated by rotating the UV angle over time. This is
// the smooth, glossy "fiery swirl" look (site palette: violet/cyan/white,
// not orange) instead of a sparse particle field — much closer to the
// reference photo's painterly vortex than individual dots can achieve.
// ---------------------------------------------------------------------------
const vortexVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const vortexFragmentShader = `
  uniform float uTime;
  uniform float uInnerRadius;
  varying vec2 vUv;

  // Cheap hash noise for a bit of organic flicker in the glow.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float r = length(centered) * 2.0; // 0 at center, 1 at outer edge
    float angle = atan(centered.y, centered.x);

    // Spiral arms: angle warps as a function of radius, rotating over time.
    float spiral = angle - (1.0 / max(r, 0.08)) * 1.6 + uTime * 0.6;
    float arms = sin(spiral * 3.0) * 0.5 + 0.5;
    arms = pow(arms, 2.0);

    // Radial falloff: hot/bright ring just outside the event horizon,
    // fading smoothly to nothing at the outer edge.
    float innerFade = smoothstep(uInnerRadius, uInnerRadius + 0.08, r);
    float outerFade = 1.0 - smoothstep(0.55, 1.0, r);
    float radial = innerFade * outerFade;

    float glow = radial * (0.35 + arms * 0.85);
    glow *= 0.9 + 0.1 * hash(vUv * 40.0 + floor(uTime * 6.0));

    vec3 colorHot = vec3(1.0, 0.98, 0.92);
    vec3 colorMid = vec3(0.78, 0.62, 1.0);
    vec3 colorCool = vec3(0.35, 0.55, 0.95);
    vec3 color = mix(colorCool, colorMid, smoothstep(0.0, 0.5, 1.0 - r));
    color = mix(color, colorHot, pow(innerFade * (1.0 - r), 1.5));

    gl_FragColor = vec4(color * glow * 1.4, glow);
  }
`;

function VortexGlow({ radius }: { radius: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInnerRadius: { value: 0.16 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh renderOrder={1}>
      <circleGeometry args={[radius, 96]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vortexVertexShader}
        fragmentShader={vortexFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// A light sprinkle of glowing particles orbiting just outside the vortex
// glow, for sparkle/depth on top of the smooth shader swirl.
// ---------------------------------------------------------------------------
interface SparkParticle {
  angle: number;
  radius: number;
  speed: number;
  twinklePhase: number;
}

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

function SparkField({ innerRadius, outerRadius, count }: { innerRadius: number; outerRadius: number; count: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowTexture = useMemo(() => createGlowTexture(), []);
  const colorHot = useMemo(() => new THREE.Color("#fff8ee"), []);
  const colorCool = useMemo(() => new THREE.Color("#8b7bff"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const particles = useMemo<SparkParticle[]>(
    () =>
      new Array(count).fill(0).map(() => ({
        angle: Math.random() * Math.PI * 2,
        radius: innerRadius + Math.random() * (outerRadius - innerRadius),
        speed: 0.2 + Math.random() * 0.35,
        twinklePhase: Math.random() * Math.PI * 2,
      })),
    [count, innerRadius, outerRadius]
  );

  const [positions, colors] = useMemo(
    () => [new Float32Array(count * 3), new Float32Array(count * 3)],
    [count]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const range = outerRadius - innerRadius;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.radius -= delta * range * 0.06;
      if (p.radius <= innerRadius) p.radius = outerRadius - Math.random() * range * 0.1;

      const proximity = 1 - (p.radius - innerRadius) / range;
      p.angle += delta * p.speed * (1 + proximity * 2.5);

      positions[i * 3] = Math.cos(p.angle) * p.radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
      positions[i * 3 + 2] = Math.sin(p.angle) * p.radius;

      const twinkle = 0.7 + Math.sin(t * 2 + p.twinklePhase) * 0.3;
      tmpColor.copy(colorCool).lerp(colorHot, proximity);
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
    <group rotation={[Math.PI / 2.3, 0, 0.3]}>
      <points ref={pointsRef} renderOrder={0}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={glowTexture}
          size={0.09}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** The black hole itself: event horizon + rim + vortex glow + sparkle, sized to sit where "0" would go between the two "4"s. */
function BlackHole() {
  const performanceTier = usePerformanceTier();
  const sparkCount = performanceTier === "low" ? 200 : 450;

  return (
    <group position={[0, 0, 0]}>
      <VortexGlow radius={1.7} />
      <EventHorizon radius={0.85} />
      <RimGlow radius={0.85} />
      <SparkField innerRadius={0.95} outerRadius={1.7} count={sparkCount} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Glossy "4" digits flanking the black hole — a physical material with
// clearcoat + an Environment for real reflections is what actually reads as
// "polished/glassy" instead of flat matte plastic.
// ---------------------------------------------------------------------------
function GlossyFour({ x }: { x: number }) {
  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.45}>
      <Center position={[x, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={1.7}
          height={0.4}
          curveSegments={16}
          bevelEnabled
          bevelThickness={0.045}
          bevelSize={0.03}
          bevelSegments={8}
        >
          4
          <meshPhysicalMaterial
            color="#e8e4fb"
            roughness={0.08}
            metalness={0.4}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.1}
            emissive="#7c3aed"
            emissiveIntensity={0.18}
          />
        </Text3D>
      </Center>
    </Float>
  );
}

/**
 * Site's "page not found" centerpiece: "4" [swirling black hole] "4", with
 * a glossy environment-lit finish on the digits — rendered inside
 * SceneContainer (see not-found.tsx).
 */
export default function BlackHoleScene() {
  return (
    <>
      <ProceduralEnvironment />
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 6]} intensity={12} color="#c4b5fd" />
      <pointLight position={[-4, -2, 5]} intensity={9} color="#67e8f9" />
      <directionalLight position={[2, 4, 6]} intensity={1.4} color="#ffffff" />

      {/* Shifted up so the composition sits in the upper half, leaving room
          below for the "page not found" text overlay without overlapping. */}
      <ResponsiveComposition>
        <group position={[0, 1.2, 0]}>
          <GlossyFour x={-2.75} />
          <BlackHole />
          <GlossyFour x={2.75} />
        </group>
      </ResponsiveComposition>
    </>
  );
}

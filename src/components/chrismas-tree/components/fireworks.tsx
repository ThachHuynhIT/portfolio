"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* ===================== Shaders ===================== */
const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.48) discard;
    // alpha = vColor.r (dùng kênh R làm alpha)
    gl_FragColor = vec4(vColor, vColor.r);
  }
`;

/* ===================== Types ===================== */
type TrailParticle = { position: THREE.Vector3; velocity: THREE.Vector3; createdAt: number };
type ClusterHead = { position: THREE.Vector3; velocity: THREE.Vector3 };
type CoreParticle = { position: THREE.Vector3; velocity: THREE.Vector3; createdAt: number };

type FireworkState = {
  active: boolean;
  startTime: number;
  position: THREE.Vector3;
  color: THREE.Color;
  life: number;
  endTime: number;
  clusterHeads: ClusterHead[];
  trail: TrailParticle[];
  core: CoreParticle[];
};

/* ===================== Component ===================== */
export default function FireworksMainTrail({ propColor = "#fff" }: { propColor: string }) {
  const { viewport } = useThree();

  /* -------- Config -------- */
  const MAX_FIREWORKS = 18; // vẫn giữ pool để tái sử dụng
  const NUM_CLUSTERS = 20;
  const CHILDREN_PER_EMIT = 8;
  const MAX_TRAIL_PER_FIREWORK = NUM_CLUSTERS * 520;

  const MAIN_SIZE = 3;
  const CHILD_SIZE = 1;

  const CORE_COUNT = 500;
  const CORE_SIZE = 3;
  const CORE_INITIAL_RADIUS = 0.06;
  const CORE_MIN_SPEED = 0.3;
  const CORE_MAX_SPEED = 1.3;
  const CORE_LIFE = 1.5;
  const CORE_AIR_DRAG = 0.995;
  const CORE_GRAVITY = new THREE.Vector3(0, -0.3, 0);

  const GRAVITY = new THREE.Vector3(0, -0.98, 0);
  const AIR_DRAG = 0.996;
  const TRAIL_LIFE = 1.2;

  const MAIN_FADE_START = 0.35;
  const MAIN_FADE_END = 1.0;

  const GLOBAL_END_FADE_START = 0.85;

  const smoothstep = (edge0: number, edge1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  /* -------- Refs -------- */
  const mainPointsRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);
  const childPointsRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);
  const corePointsRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);

  const fireworksRef = useRef<FireworkState[]>(
    Array(MAX_FIREWORKS)
      .fill(null)
      .map(() => ({
        active: false,
        startTime: 0,
        position: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        endTime: 0,
        clusterHeads: [],
        trail: [],
        core: [],
      }))
  );

  // khoảng delay nhỏ giữa 2 quả liên tiếp (cho cảm giác nhịp nhàng)
  const lastSpawnRef = useRef(0);
  const spawnDelayRef = useRef(0.1); // 0.1s sau khi quả trước tắt sẽ spawn quả mới

  /* -------- Geometries -------- */
  const childGeometries = useMemo(() => {
    return Array(MAX_FIREWORKS)
      .fill(null)
      .map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(MAX_TRAIL_PER_FIREWORK * 3), 3)
        );
        g.setAttribute(
          "color",
          new THREE.BufferAttribute(new Float32Array(MAX_TRAIL_PER_FIREWORK * 3), 3)
        );
        g.setAttribute(
          "size",
          new THREE.BufferAttribute(new Float32Array(MAX_TRAIL_PER_FIREWORK), 1)
        );
        g.setDrawRange(0, 0);
        return g;
      });
  }, [MAX_FIREWORKS, MAX_TRAIL_PER_FIREWORK]);

  const mainGeometries = useMemo(() => {
    return Array(MAX_FIREWORKS)
      .fill(null)
      .map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NUM_CLUSTERS * 3), 3));
        g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(NUM_CLUSTERS * 3), 3));
        g.setAttribute("size", new THREE.BufferAttribute(new Float32Array(NUM_CLUSTERS), 1));
        g.setDrawRange(0, 0);
        return g;
      });
  }, [MAX_FIREWORKS, NUM_CLUSTERS]);

  const coreGeometries = useMemo(() => {
    return Array(MAX_FIREWORKS)
      .fill(null)
      .map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CORE_COUNT * 3), 3));
        g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(CORE_COUNT * 3), 3));
        g.setAttribute("size", new THREE.BufferAttribute(new Float32Array(CORE_COUNT), 1));
        g.setDrawRange(0, 0);
        return g;
      });
  }, [MAX_FIREWORKS, CORE_COUNT]);

  /* -------- Spawn (1 quả) -------- */
  const spawnFirework = (now: number) => {
    const idx = fireworksRef.current.findIndex((f) => !f.active);
    if (idx === -1) return;

    // random nhẹ quanh giữa
    const x = (Math.random() - 0.5) * (viewport.width * 0.4);
    const y = Math.random() * (viewport.height / 4) + 1.5;
    const z = (Math.random() - 0.5) * 1;
    const position = new THREE.Vector3(x, y, z);

    const color = new THREE.Color(propColor);
    const life = 1.2; // tổng thời gian sống của 1 quả

    const clusterHeads: ClusterHead[] = [];
    for (let i = 0; i < NUM_CLUSTERS; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1 + Math.random() * 1;
      const v = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(speed);
      clusterHeads.push({ position: new THREE.Vector3(), velocity: v });
    }

    const core: CoreParticle[] = [];
    for (let i = 0; i < CORE_COUNT; i++) {
      const u = Math.random();
      let dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
      dir.normalize();
      const r0 = CORE_INITIAL_RADIUS * Math.cbrt(u);
      const pos = dir.clone().multiplyScalar(r0);
      const speed = CORE_MIN_SPEED + Math.random() * (CORE_MAX_SPEED - CORE_MIN_SPEED);
      const vel = dir.clone().multiplyScalar(speed);
      core.push({ position: pos, velocity: vel, createdAt: 0 });
    }

    fireworksRef.current[idx] = {
      active: true,
      startTime: now,
      position,
      color: color.clone(),
      life,
      endTime: 0,
      clusterHeads,
      trail: [],
      core,
    };

    // set lại mốc thời gian spawn
    lastSpawnRef.current = now;
  };

  /* -------- Frame loop -------- */
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    // Đếm xem hiện tại có bao nhiêu quả đang active
    const activeCount = fireworksRef.current.reduce((acc, f) => (f.active ? acc + 1 : acc), 0);

    // Nếu KHÔNG có quả nào đang nổ → spawn ngay (sau một delay rất nhỏ)
    if (activeCount === 0) {
      // đảm bảo có chút "nhịp", không phải frame này tắt frame sau bật liền
      if (t - lastSpawnRef.current >= spawnDelayRef.current) {
        spawnFirework(t);
      }
    }

    // Update tất cả quả đang active
    fireworksRef.current.forEach((fw, index) => {
      if (!fw.active) return;

      const elapsed = t - fw.startTime;
      const progress = elapsed / fw.life;

      if (progress >= 1) {
        // hết đời → tắt
        fw.active = false;
        fw.endTime = t;
        childGeometries[index].setDrawRange(0, 0);
        mainGeometries[index].setDrawRange(0, 0);
        coreGeometries[index].setDrawRange(0, 0);
        return;
      }

      // Update MAIN heads & emit trails
      fw.clusterHeads.forEach((head) => {
        head.velocity.addScaledVector(GRAVITY, dt);
        head.velocity.multiplyScalar(AIR_DRAG);
        head.position.addScaledVector(head.velocity, dt);

        const needed = CHILDREN_PER_EMIT;
        const room = MAX_TRAIL_PER_FIREWORK - fw.trail.length;
        if (room < needed) fw.trail.splice(0, needed - room);

        for (let i = 0; i < CHILDREN_PER_EMIT; i++) {
          const jitter = new THREE.Vector3(
            (Math.random() - 0.5) * 0.25,
            (Math.random() - 0.5) * 0.25,
            (Math.random() - 0.5) * 0.25
          );
          const v = head.velocity.clone().multiplyScalar(0.65).add(jitter);
          fw.trail.push({ position: head.position.clone(), velocity: v, createdAt: elapsed });
        }
      });

      // Cull trails
      fw.trail = fw.trail.filter((p) => elapsed - p.createdAt < TRAIL_LIFE);

      /* ----- MAIN geometry ----- */
      const gMain = mainGeometries[index];
      const mainPos = gMain.attributes.position.array as Float32Array;
      const mainCol = gMain.attributes.color.array as Float32Array;
      const mainSize = gMain.attributes.size.array as Float32Array;

      const tMain = smoothstep(MAIN_FADE_START, MAIN_FADE_END, progress);
      const alphaMain = Math.pow(1 - tMain, 2.2);
      const sizeMain = MAIN_SIZE * Math.pow(alphaMain, 0.85);

      for (let i = 0; i < fw.clusterHeads.length; i++) {
        const h = fw.clusterHeads[i];
        const i3 = i * 3;

        mainPos[i3] = h.position.x;
        mainPos[i3 + 1] = h.position.y;
        mainPos[i3 + 2] = h.position.z;

        mainCol[i3] = fw.color.r * alphaMain;
        mainCol[i3 + 1] = fw.color.g * alphaMain;
        mainCol[i3 + 2] = fw.color.b * alphaMain;

        mainSize[i] = sizeMain;
      }
      gMain.setDrawRange(0, fw.clusterHeads.length);
      gMain.attributes.position.needsUpdate = true;
      gMain.attributes.color.needsUpdate = true;
      gMain.attributes.size.needsUpdate = true;

      /* ----- CHILD trails ----- */
      const gChild = childGeometries[index];
      const cPos = gChild.attributes.position.array as Float32Array;
      const cCol = gChild.attributes.color.array as Float32Array;
      const cSize = gChild.attributes.size.array as Float32Array;

      const endFade = 1 - smoothstep(GLOBAL_END_FADE_START, 1.0, progress);

      for (let i = 0; i < fw.trail.length; i++) {
        const p = fw.trail[i];

        p.velocity.addScaledVector(GRAVITY, dt);
        p.velocity.multiplyScalar(AIR_DRAG);
        p.position.addScaledVector(p.velocity, dt);

        const i3 = i * 3;
        cPos[i3] = p.position.x;
        cPos[i3 + 1] = p.position.y;
        cPos[i3 + 2] = p.position.z;

        const age = elapsed - p.createdAt;
        const ageAlpha = Math.max(0, 1 - age / TRAIL_LIFE);
        const a = ageAlpha * endFade;

        cCol[i3] = fw.color.r * a;
        cCol[i3 + 1] = fw.color.g * a;
        cCol[i3 + 2] = fw.color.b * a;

        cSize[i] = CHILD_SIZE * a;
      }
      gChild.setDrawRange(0, fw.trail.length);
      gChild.attributes.position.needsUpdate = true;
      gChild.attributes.color.needsUpdate = true;
      gChild.attributes.size.needsUpdate = true;

      /* ----- CORE burst ----- */
      const gCore = coreGeometries[index];
      const corePos = gCore.attributes.position.array as Float32Array;
      const coreCol = gCore.attributes.color.array as Float32Array;
      const coreSize = gCore.attributes.size.array as Float32Array;

      fw.core = fw.core.filter((p) => elapsed - p.createdAt < CORE_LIFE);

      for (let i = 0; i < fw.core.length; i++) {
        const p = fw.core[i];
        p.velocity.addScaledVector(CORE_GRAVITY, dt);
        p.velocity.multiplyScalar(CORE_AIR_DRAG);
        p.position.addScaledVector(p.velocity, dt);

        const i3 = i * 3;
        corePos[i3] = p.position.x;
        corePos[i3 + 1] = p.position.y;
        corePos[i3 + 2] = p.position.z;

        const age = elapsed - p.createdAt;
        const ageAlpha = Math.max(0, 1 - age / CORE_LIFE);
        const a = ageAlpha * endFade;

        coreCol[i3] = fw.color.r * a;
        coreCol[i3 + 1] = fw.color.g * a;
        coreCol[i3 + 2] = fw.color.b * a;

        coreSize[i] = CORE_SIZE * a;
      }
      gCore.setDrawRange(0, fw.core.length);
      gCore.attributes.position.needsUpdate = true;
      gCore.attributes.color.needsUpdate = true;
      gCore.attributes.size.needsUpdate = true;

      /* ----- Apply world-space offsets ----- */
      const mp = mainPointsRef.current[index];
      const cp = childPointsRef.current[index];
      const kp = corePointsRef.current[index];
      if (mp) mp.position.copy(fw.position);
      if (cp) cp.position.copy(fw.position);
      if (kp) kp.position.copy(fw.position);
    });
  });

  /* -------- JSX -------- */
  return (
    <>
      {/* MAIN heads */}
      {mainGeometries.map((g, i) => (
        <points
          key={`main-${i}`}
          ref={(r) => {
            if (r) mainPointsRef.current[i] = r as THREE.Points<THREE.BufferGeometry>;
          }}
          geometry={g}
        >
          <shaderMaterial
            args={[{ vertexShader, fragmentShader }]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}

      {/* CHILD trails */}
      {childGeometries.map((g, i) => (
        <points
          key={`child-${i}`}
          ref={(r) => {
            if (r) childPointsRef.current[i] = r as THREE.Points<THREE.BufferGeometry>;
          }}
          geometry={g}
        >
          <shaderMaterial
            args={[{ vertexShader, fragmentShader }]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}

      {/* CORE burst */}
      {coreGeometries.map((g, i) => (
        <points
          key={`core-${i}`}
          ref={(r) => {
            if (r) corePointsRef.current[i] = r as THREE.Points<THREE.BufferGeometry>;
          }}
          geometry={g}
        >
          <shaderMaterial
            args={[{ vertexShader, fragmentShader }]}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  );
}

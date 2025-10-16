"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// ===== Types =====
type TrailParticle = {
    position: THREE.Vector3; // local to firework origin
    velocity: THREE.Vector3;
    createdAt: number; // seconds since firework start
};

type ClusterHead = {
    position: THREE.Vector3; // local to firework origin
    velocity: THREE.Vector3;
};

type CoreParticle = {
    position: THREE.Vector3; // local to firework origin
    velocity: THREE.Vector3; // radial outward
    createdAt: number; // seconds since firework start
};

type FireworkState = {
    active: boolean;
    startTime: number;
    position: THREE.Vector3; // world-space explosion center
    color: THREE.Color;
    life: number;
    endTime: number;

    // dots
    clusterHeads: ClusterHead[]; // main dots (never culled while firework is alive)
    trail: TrailParticle[]; // child dots (short life, spawned behind main)

    // core-burst
    core: CoreParticle[];
};

export default function FireworksMainTrail() {
    // ===== Config =====
    const MAX_FIREWORKS = 4;
    const NUM_CLUSTERS = 12; // number of main rays per firework
    const CHILDREN_PER_EMIT = 8; // how many child dots to spawn per head per frame
    const MAX_TRAIL_PER_FIREWORK = NUM_CLUSTERS * 520; // ring buffer for short-lived dots

    const MAIN_SIZE = 3; // main dot size
    const CHILD_SIZE = 1; // child dot size

    // core-burst config
    const CORE_COUNT = 500; // requested 500 dots
    const CORE_SIZE = 1.6; // slightly bigger than child
    const CORE_INITIAL_RADIUS = 0.06; // "small sphere" radius at t0
    const CORE_MIN_SPEED = 0.3; // outward speed range
    const CORE_MAX_SPEED = 1.4;
    const CORE_LIFE = 1.3; // short life for quick bloom
    const CORE_AIR_DRAG = 0.995; // gentle slow-down
    const CORE_GRAVITY = new THREE.Vector3(0, -0.3, 0); // light gravity

    const GRAVITY = new THREE.Vector3(0.5, -0.4, 0.5);
    const AIR_DRAG = 0.996; // general damping

    const TRAIL_LIFE = 0.55; // shorter life => shorter streaks

    // ===== Refs =====
    // Separate Points for MAIN dots and CHILD dots per firework (so we can size them differently)
    const mainPointsRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>(
        []
    );
    const childPointsRef = useRef<
        (THREE.Points<THREE.BufferGeometry> | null)[]
    >([]);

    // separate Points for core-burst per firework
    const corePointsRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>(
        []
    );

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

    // FPS-independent spawner
    const lastSpawnRef = useRef(0);
    const spawnIntervalRef = useRef(1.1);

    // ===== Palette =====
    const palette = useMemo(
        () => [
            new THREE.Color("#FFD700"),
            new THREE.Color("#FF5E5B"),
            new THREE.Color("#7DF9FF"),
            new THREE.Color("#39FF14"),
            new THREE.Color("#FFFFFF"),
        ],
        []
    );

    // ===== Geometries =====
    // Children (trail) geometry
    const childGeometries = useMemo(() => {
        return Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => {
                const g = new THREE.BufferGeometry();
                g.setAttribute(
                    "position",
                    new THREE.BufferAttribute(
                        new Float32Array(MAX_TRAIL_PER_FIREWORK * 3),
                        3
                    )
                );
                g.setAttribute(
                    "color",
                    new THREE.BufferAttribute(
                        new Float32Array(MAX_TRAIL_PER_FIREWORK * 3),
                        3
                    )
                );
                g.setDrawRange(0, 0);
                return g;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [MAX_FIREWORKS, MAX_TRAIL_PER_FIREWORK]);

    // Main geometry
    const mainGeometries = useMemo(() => {
        return Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => {
                const g = new THREE.BufferGeometry();
                g.setAttribute(
                    "position",
                    new THREE.BufferAttribute(new Float32Array(NUM_CLUSTERS * 3), 3)
                );
                g.setAttribute(
                    "color",
                    new THREE.BufferAttribute(new Float32Array(NUM_CLUSTERS * 3), 3)
                );
                g.setDrawRange(0, 0);
                return g;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [MAX_FIREWORKS, NUM_CLUSTERS]);

    // core-burst geometry
    const coreGeometries = useMemo(() => {
        return Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => {
                const g = new THREE.BufferGeometry();
                g.setAttribute(
                    "position",
                    new THREE.BufferAttribute(new Float32Array(CORE_COUNT * 3), 3)
                );
                g.setAttribute(
                    "color",
                    new THREE.BufferAttribute(new Float32Array(CORE_COUNT * 3), 3)
                );
                g.setDrawRange(0, 0);
                return g;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [MAX_FIREWORKS, CORE_COUNT]);

    // ===== Spawn a firework =====
    const spawnFirework = (now: number) => {
        const idx = fireworksRef.current.findIndex((f) => !f.active);
        if (idx === -1) return;

        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            4 + Math.random() * 3,
            (Math.random() - 0.5) * 3
        );

        const color = palette[Math.floor(Math.random() * palette.length)];

        const life = 0.8 + Math.random() * 1.2;

        const clusterHeads: ClusterHead[] = [];
        for (let i = 0; i < NUM_CLUSTERS; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1) * 0.75;
            const speed = 0.9 + Math.random() * 0.9;

            const v = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
            ).multiplyScalar(speed);

            clusterHeads.push({ position: new THREE.Vector3(), velocity: v });
        }

        // init core-burst particles
        const core: CoreParticle[] = [];
        for (let i = 0; i < CORE_COUNT; i++) {
            const u = Math.random();
            let dir = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            );
            if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
            dir.normalize();

            const r0 = CORE_INITIAL_RADIUS * Math.cbrt(u);
            const pos = dir.clone().multiplyScalar(r0);

            const speed =
                CORE_MIN_SPEED + Math.random() * (CORE_MAX_SPEED - CORE_MIN_SPEED);
            const vel = dir.clone().multiplyScalar(speed);

            core.push({
                position: pos,
                velocity: vel,
                createdAt: 0, // elapsed 0 at spawn
            });
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

        spawnIntervalRef.current = 0.8 + Math.random() * 0.8;
    };

    // ===== Frame loop =====
    useFrame((state, dt) => {
        const t = state.clock.getElapsedTime();

        if (t - lastSpawnRef.current > spawnIntervalRef.current) {
            spawnFirework(t);
            lastSpawnRef.current = t;
        }

        fireworksRef.current.forEach((fw, index) => {
            if (!fw.active) return;
            const elapsed = t - fw.startTime;
            const progress = elapsed / fw.life;

            if (progress >= 1) {
                fw.active = false;
                fw.endTime = t;
                childGeometries[index].setDrawRange(0, 0);
                mainGeometries[index].setDrawRange(0, 0);
                coreGeometries[index].setDrawRange(0, 0);
                return;
            }

            // --- Update main heads & emit trail dots ---
            fw.clusterHeads.forEach((head) => {
                head.velocity.addScaledVector(GRAVITY, dt);
                head.velocity.multiplyScalar(AIR_DRAG);
                head.position.addScaledVector(head.velocity, dt);

                const needed = CHILDREN_PER_EMIT;
                const room = MAX_TRAIL_PER_FIREWORK - fw.trail.length;
                if (room < needed) {
                    fw.trail.splice(0, needed - room);
                }

                for (let i = 0; i < CHILDREN_PER_EMIT; i++) {
                    const jitter = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.25,
                        (Math.random() - 0.5) * 0.25,
                        (Math.random() - 0.5) * 0.25
                    );
                    const v = head.velocity.clone().multiplyScalar(0.65).add(jitter);
                    fw.trail.push({
                        position: head.position.clone(),
                        velocity: v,
                        createdAt: elapsed,
                    });
                }
            });

            // --- Update trail dots (short life) ---
            fw.trail = fw.trail.filter((p) => elapsed - p.createdAt < TRAIL_LIFE);

            // write MAIN geometry (positions/colors)
            const gMain = mainGeometries[index];
            const mainPos = gMain.attributes.position.array as Float32Array;
            const mainCol = gMain.attributes.color.array as Float32Array;

            for (let i = 0; i < fw.clusterHeads.length; i++) {
                const h = fw.clusterHeads[i];
                const i3 = i * 3;
                mainPos[i3] = h.position.x;
                mainPos[i3 + 1] = h.position.y;
                mainPos[i3 + 2] = h.position.z;

                // MODIFIED: Main dots now fade out over the firework's lifespan.
                const mainAlpha = Math.max(0, 1 - progress);
                mainCol[i3] = fw.color.r * mainAlpha;
                mainCol[i3 + 1] = fw.color.g * mainAlpha;
                mainCol[i3 + 2] = fw.color.b * mainAlpha;
            }
            gMain.setDrawRange(0, fw.clusterHeads.length);
            gMain.attributes.position.needsUpdate = true;
            gMain.attributes.color.needsUpdate = true;

            // write CHILD (trail) geometry
            const gChild = childGeometries[index];
            const cPos = gChild.attributes.position.array as Float32Array;
            const cCol = gChild.attributes.color.array as Float32Array;

            for (let i = 0; i < fw.trail.length; i++) {
                const p = fw.trail[i];
                p.position.addScaledVector(p.velocity, dt);

                const i3 = i * 3;
                cPos[i3] = p.position.x;
                cPos[i3 + 1] = p.position.y;
                cPos[i3 + 2] = p.position.z;

                // MODIFIED: Trail dots now fade completely to zero.
                const age = elapsed - p.createdAt;
                const alpha = Math.max(0, 1 - age / TRAIL_LIFE);
                cCol[i3] = fw.color.r * alpha;
                cCol[i3 + 1] = fw.color.g * alpha;
                cCol[i3 + 2] = fw.color.b * alpha;
            }

            gChild.setDrawRange(0, fw.trail.length);
            gChild.attributes.position.needsUpdate = true;
            gChild.attributes.color.needsUpdate = true;

            // === CORE-BURST update & write ===
            const gCore = coreGeometries[index];
            const corePos = gCore.attributes.position.array as Float32Array;
            const coreCol = gCore.attributes.color.array as Float32Array;

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

                // MODIFIED: Core dots now fade completely to zero.
                const age = elapsed - p.createdAt;
                const a = Math.max(0, 1 - age / CORE_LIFE);
                coreCol[i3] = fw.color.r * a;
                coreCol[i3 + 1] = fw.color.g * a;
                coreCol[i3 + 2] = fw.color.b * a;
            }

            gCore.setDrawRange(0, fw.core.length);
            gCore.attributes.position.needsUpdate = true;
            gCore.attributes.color.needsUpdate = true;

            // move all point clouds to the world origin of this firework
            const mp = mainPointsRef.current[index];
            const cp = childPointsRef.current[index];
            const kp = corePointsRef.current[index];
            if (mp) mp.position.copy(fw.position);
            if (cp) cp.position.copy(fw.position);
            if (kp) kp.position.copy(fw.position);
        });
    });

    // ===== Render =====
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
                    <pointsMaterial
                        vertexColors
                        transparent
                        size={MAIN_SIZE}
                        sizeAttenuation={false}
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
                    <pointsMaterial
                        vertexColors
                        transparent
                        size={CHILD_SIZE}
                        sizeAttenuation={false}
                        depthWrite={false}
                    // blending={THREE.AdditiveBlending}
                    />
                </points>
            ))}

            {/* CORE burst at center */}
            {coreGeometries.map((g, i) => (
                <points
                    key={`core-${i}`}
                    ref={(r) => {
                        if (r) corePointsRef.current[i] = r as THREE.Points<THREE.BufferGeometry>;
                    }}
                    geometry={g}
                >
                    <pointsMaterial
                        vertexColors
                        transparent
                        size={CORE_SIZE}
                        sizeAttenuation={false}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            ))}
        </>
    );
}

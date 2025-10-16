"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Particle = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    trail: THREE.Vector3[];
    life: number;
    // Tuổi thọ riêng cho mỗi hạt (0..1 theo life của pháo hoa)
    particleLife: number;
};

type Spark = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;   // thời gian còn lại (giây tương đối)
    maxLife: number; // để tính fade
};

type FireworkState = {
    active: boolean;
    startTime: number;
    position: THREE.Vector3;
    color: THREE.Color;
    particles: Particle[];
    life: number;
    endTime: number;

    // Pool sparks
    sparks: Spark[];
};

export default function Fireworks() {
    const fireworksRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);
    const trailsRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);
    const sparksRef = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);

    // ==== Constants ====
    const MAX_FIREWORKS = 3;
    const particleCount = 80;

    const TRAIL_LENGTH = 20;
    const MAX_TRAIL_POINTS = particleCount * TRAIL_LENGTH;

    // Tổng sparks có thể có cho mỗi firework (pool)
    const SPARKS_PER_FW = particleCount * 6;

    // ==== Texture (đốm sáng) ====
    const particleTexture = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
            gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }, []);

    // ==== State ====
    const fireworksState = useRef<FireworkState[]>(
        Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => ({
                active: false,
                startTime: 0,
                position: new THREE.Vector3(),
                color: new THREE.Color(),
                particles: [],
                life: 0,
                endTime: 0,
                sparks: Array(SPARKS_PER_FW)
                    .fill(null)
                    .map(() => ({
                        position: new THREE.Vector3(),
                        velocity: new THREE.Vector3(),
                        life: 0,
                        maxLife: 1,
                    })),
            }))
    );

    // ==== Geometries ====
    const createFireworkGeometry = (color: THREE.Color) => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;

            const brightness = 0.8 + Math.random() * 0.2;
            colors[i * 3] = color.r * brightness;
            colors[i * 3 + 1] = color.g * brightness;
            colors[i * 3 + 2] = color.b * brightness;

            sizes[i] = Math.random() * 0.06 + 0.03;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        return geometry;
    };

    const fireworkColors = useMemo(
        () => [
            new THREE.Color("#ff0000"),
            new THREE.Color("#00ff00"),
            new THREE.Color("#0000ff"),
            new THREE.Color("#ffff00"),
            new THREE.Color("#ff00ff"),
            new THREE.Color("#00ffff"),
            new THREE.Color("#ff8800"),
            new THREE.Color("#ff0088"),
        ],
        []
    );

    const fireworksGeometries = useMemo(() => {
        return Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => {
                const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
                return createFireworkGeometry(color);
            });
    }, [fireworkColors]);

    const trailGeometries = useMemo(() => {
        return Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => {
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(MAX_TRAIL_POINTS * 3);
                const colors = new Float32Array(MAX_TRAIL_POINTS * 3);
                const sizes = new Float32Array(MAX_TRAIL_POINTS);

                geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
                geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
                geometry.setDrawRange(0, 0);

                return geometry;
            });
    }, []);

    // Sparks geometries
    const sparksGeometries = useMemo(() => {
        return Array(MAX_FIREWORKS)
            .fill(null)
            .map(() => {
                const g = new THREE.BufferGeometry();
                const positions = new Float32Array(SPARKS_PER_FW * 3);
                const colors = new Float32Array(SPARKS_PER_FW * 3);
                const sizes = new Float32Array(SPARKS_PER_FW);
                g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
                g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
                g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
                g.setDrawRange(0, 0);
                return g;
            });
    }, []);

    // ==== Helpers ====
    const spawnSpark = (
        fw: FireworkState,
        basePos: THREE.Vector3,
        baseVel: THREE.Vector3
    ) => {
        const s = fw.sparks.find((sp) => sp.life <= 0);
        if (!s) return;

        // Vận tốc nhỏ, lệch theo hướng dot chính
        const jitter = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6
        );
        const dir = baseVel.clone().normalize().multiplyScalar(0.8);

        s.position.copy(basePos);
        s.velocity.copy(dir.add(jitter).multiplyScalar(0.6));
        s.maxLife = 0.5 + Math.random() * 0.6; // 0.5..1.1
        s.life = s.maxLife;
    };

    const createNewFirework = (currentTime: number) => {
        const delay = 0.8;
        const availableIndex = fireworksState.current.findIndex(
            (fw) => !fw.active && currentTime - fw.endTime > delay
        );

        if (availableIndex !== -1) {
            const position = new THREE.Vector3(
                2 + Math.random() * 6,
                2.5 + Math.random() * 3.5,
                -3 + Math.random() * 6
            );

            const color =
                fireworkColors[Math.floor(Math.random() * fireworkColors.length)];

            const particles: Particle[] = [];
            for (let i = 0; i < particleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const speed = (0.5 + Math.random() * 0.8) * 0.9;
                const velocity = new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta) * speed,
                    Math.sin(phi) * Math.sin(theta) * speed,
                    Math.cos(phi) * speed
                );

                particles.push({
                    position: new THREE.Vector3(0, 0, 0),
                    velocity,
                    trail: [new THREE.Vector3(0, 0, 0)],
                    life: 1.0,
                    particleLife: 0.6 + Math.random() * 0.4, // 60..100% vòng đời
                });
            }

            fireworksState.current[availableIndex] = {
                active: true,
                startTime: currentTime,
                position,
                color,
                particles,
                life: 1.0 + Math.random() * 1.5, // vòng đời pháo hoa
                endTime: 0,
                sparks: fireworksState.current[availableIndex].sparks, // giữ pool
            };

            // Reset geometry chính
            const geometry = fireworksGeometries[availableIndex];
            const positions = geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
            }
            geometry.attributes.position.needsUpdate = true;

            // Reset trail draw range
            const trailPoints = trailsRef.current[availableIndex];
            if (trailPoints && trailPoints.geometry) {
                trailPoints.geometry.setDrawRange(0, 0);
            }

            // Reset sparks pool & draw range
            const fw = fireworksState.current[availableIndex];
            fw.sparks.forEach((s) => (s.life = 0));
            const sg = sparksGeometries[availableIndex];
            sg.setDrawRange(0, 0);
        }
    };

    // ==== Frame loop ====
    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        if (Math.random() < 0.05) {
            createNewFirework(time);
        }

        fireworksState.current.forEach((firework, index) => {
            if (!firework.active) return;

            const points = fireworksRef.current[index];
            const trailPoints = trailsRef.current[index];
            const sparksPoints = sparksRef.current[index];
            if (!points || !trailPoints || !sparksPoints) return;

            const elapsed = time - firework.startTime;
            const progress = elapsed / firework.life;

            if (progress >= 1) {
                firework.active = false;
                firework.endTime = time;

                if (points.material && "opacity" in points.material) {
                    (points.material as THREE.PointsMaterial).opacity = 0;
                }
                if (trailPoints.material && "opacity" in trailPoints.material) {
                    (trailPoints.material as THREE.PointsMaterial).opacity = 0;
                }
                if (sparksPoints.material && "opacity" in sparksPoints.material) {
                    (sparksPoints.material as THREE.PointsMaterial).opacity = 0;
                }
                if (trailPoints.geometry) {
                    trailPoints.geometry.setDrawRange(0, 0);
                }
                const sg = sparksGeometries[index];
                sg.setDrawRange(0, 0);
                return;
            }

            if (points.material && "opacity" in points.material) {
                (points.material as THREE.PointsMaterial).opacity = 1;
            }
            if (trailPoints.material && "opacity" in trailPoints.material) {
                (trailPoints.material as THREE.PointsMaterial).opacity = 0.8;
            }
            if (sparksPoints.material && "opacity" in sparksPoints.material) {
                (sparksPoints.material as THREE.PointsMaterial).opacity = 0.9;
            }

            // --- Main particles & trails ---
            const geometry = points.geometry;
            const positions = geometry.attributes.position.array as Float32Array;
            const sizes = geometry.attributes.size.array as Float32Array;

            const trailGeometry = trailPoints.geometry;
            const trailPositions = trailGeometry.attributes.position.array as Float32Array;
            const trailColors = trailGeometry.attributes.color.array as Float32Array;
            const trailSizes = trailGeometry.attributes.size.array as Float32Array;

            let trailIndex = 0;

            for (let i = 0; i < particleCount; i++) {
                const particle = firework.particles[i];
                const i3 = i * 3;

                const gravity = new THREE.Vector3(0, -0.5, 0);
                const damping = 0.99;

                particle.velocity.add(gravity.multiplyScalar(0.016));
                particle.velocity.multiplyScalar(damping);
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));

                positions[i3] = particle.position.x;
                positions[i3 + 1] = particle.position.y;
                positions[i3 + 2] = particle.position.z;

                // Cập nhật trail
                particle.trail.unshift(particle.position.clone());
                if (particle.trail.length > TRAIL_LENGTH) {
                    particle.trail.pop();
                }

                for (let j = 0; j < particle.trail.length; j++) {
                    const trailPos = particle.trail[j];
                    const ti3 = trailIndex * 3;

                    trailPositions[ti3] = trailPos.x;
                    trailPositions[ti3 + 1] = trailPos.y;
                    trailPositions[ti3 + 2] = trailPos.z;

                    const alpha = 1 - j / particle.trail.length;
                    const brightness = alpha * (1 - progress * 0.5);

                    trailColors[ti3] = firework.color.r * brightness;
                    trailColors[ti3 + 1] = firework.color.g * brightness;
                    trailColors[ti3 + 2] = firework.color.b * brightness;

                    trailSizes[trailIndex] = alpha * 0.08 * (1 - progress * 0.3);

                    trailIndex++;
                }

                // ✨ Rụng sparks từ dot lớn
                const emitChance = 0.12; // giảm nếu quá nhiều
                // Chỉ rụng trong nửa đầu vòng đời để nhìn tự nhiên hơn
                if (progress < 0.6 && Math.random() < emitChance) {
                    const sparksToEmit = 1 + (Math.random() < 0.35 ? 1 : 0);
                    for (let e = 0; e < sparksToEmit; e++) {
                        spawnSpark(firework, particle.position, particle.velocity);
                    }
                }

                // Tan biến theo tuổi thọ riêng (ghi vào size attr như logic sẵn có)
                const baseSize = 0.05;
                if (progress >= particle.particleLife) {
                    sizes[i] = 0;
                } else {
                    const particleProgress = progress / particle.particleLife;
                    if (particleProgress > 0.75) {
                        const fade = (particleProgress - 0.75) / 0.25;
                        sizes[i] = baseSize * (1 - fade);
                    } else {
                        sizes[i] = baseSize;
                    }
                }
            }

            trailGeometry.setDrawRange(0, trailIndex);
            trailGeometry.attributes.position.needsUpdate = true;
            trailGeometry.attributes.color.needsUpdate = true;
            trailGeometry.attributes.size.needsUpdate = true;

            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.size.needsUpdate = true;

            points.position.copy(firework.position);
            trailPoints.position.copy(firework.position);

            // --- Sparks update & render ---
            const sg = sparksGeometries[index];
            const sPos = sg.attributes.position.array as Float32Array;
            const sCol = sg.attributes.color.array as Float32Array;
            const sSize = sg.attributes.size.array as Float32Array;

            let sDraw = 0;
            for (let si = 0; si < firework.sparks.length; si++) {
                const s = firework.sparks[si];
                if (s.life <= 0) continue;

                s.velocity.add(new THREE.Vector3(0, -0.9, 0).multiplyScalar(0.016));
                s.velocity.multiplyScalar(0.985);
                s.position.add(s.velocity.clone().multiplyScalar(0.016));

                s.life -= 0.016;
                const remain = Math.max(s.life, 0);
                const t = 1 - remain / s.maxLife; // 0..1
                const alpha = Math.max(0, 1 - t);
                const brightness = alpha * (1 - progress * 0.35);

                const si3 = sDraw * 3;
                sPos[si3] = s.position.x;
                sPos[si3 + 1] = s.position.y;
                sPos[si3 + 2] = s.position.z;

                sCol[si3] = firework.color.r * brightness;
                sCol[si3 + 1] = firework.color.g * brightness;
                sCol[si3 + 2] = firework.color.b * brightness;

                sSize[sDraw] = 0.03 * (0.6 + 0.4 * (1 - t));

                sDraw++;
            }

            sg.setDrawRange(0, sDraw);
            sg.attributes.position.needsUpdate = true;
            sg.attributes.color.needsUpdate = true;
            sg.attributes.size.needsUpdate = true;

            sparksPoints.position.copy(firework.position);
        });
    });

    // ==== Render ====
    return (
        <>
            {fireworksGeometries.map((geometry, index) => (
                <group key={index}>
                    {/* Trails */}
                    <points
                        ref={(ref) => {
                            if (ref) {
                                trailsRef.current[index] = ref as THREE.Points<THREE.BufferGeometry>;
                            }
                        }}
                        geometry={trailGeometries[index]}
                    >
                        <pointsMaterial
                            size={0.08}
                            vertexColors
                            transparent
                            opacity={0.8}
                            sizeAttenuation
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                            map={particleTexture}
                        />
                    </points>

                    {/* Sparks (dot nhỏ tách ra từ dot lớn) */}
                    <points
                        ref={(ref) => {
                            if (ref) {
                                sparksRef.current[index] = ref as THREE.Points<THREE.BufferGeometry>;
                            }
                        }}
                        geometry={sparksGeometries[index]}
                    >
                        <pointsMaterial
                            size={0.06}
                            vertexColors
                            transparent
                            opacity={0.9}
                            sizeAttenuation
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                            map={particleTexture}
                        />
                    </points>

                    {/* Main dots */}
                    <points
                        ref={(ref) => {
                            if (ref) {
                                fireworksRef.current[index] = ref as THREE.Points<THREE.BufferGeometry>;
                            }
                        }}
                        geometry={geometry}
                    >
                        <pointsMaterial
                            size={0.15}
                            vertexColors
                            transparent
                            opacity={1}
                            sizeAttenuation
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                            map={particleTexture}
                        />
                    </points>
                </group>
            ))}
        </>
    );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ============================================
   Config (giảm chói / giảm ăn Bloom)
   ============================================ */
const DOT_ALPHA = 0.7;
const BRIGHT_BASE = 0.7;
const BRIGHT_RADIAL = 0.2;
const BRIGHT_RANDOM = 0.3;
const BRIGHT_CAP = 0.9;
const OPACITY_CAP = 0.8;

type Props = {
    /** thời gian reveal (giây) */
    appearDuration?: number;
    /** trễ trước khi bắt đầu (giây) */
    appearDelay?: number;
    /** true = gợn sóng, false = phẳng */
    wave?: boolean;
};

/* Texture hình tròn cho dot — đặt alpha thấp để bớt chói */
function createCircleTexture(size = 128, alpha = DOT_ALPHA) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.globalAlpha = alpha;
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    tex.needsUpdate = true;
    return tex;
}

export default function GroundRings({ appearDuration = 1.6, appearDelay = 0, wave = false }: Props) {
    const pointsRef = useRef<THREE.Points>(null);
    const matRef = useRef<THREE.PointsMaterial>(null);
    const startRef = useRef<number | null>(null);

    const totalParticles = 15000;
    const spiralArms = 2;
    const rotations = 3;
    const armSpread = 0.35;
    const armThickness = 1.8; // Tăng độ dày để 2 arms dính nhau

    const dotTexture = useMemo(() => createCircleTexture(128, DOT_ALPHA), []);

    const spiralGeometry = useMemo(() => {
        const baseColor = new THREE.Color("#ffffff");
        const maxAngle = rotations * Math.PI * 2;
        const particlesPerArm = totalParticles / spiralArms;

        function spiralWaveY(radius: number) {
            const waveFrequency = 4.0;
            const waveAmplitude = 0.25;
            return -0.5 + Math.sin(radius * waveFrequency) * waveAmplitude;
        }

        // Tạo danh sách điểm động - thêm nhiều điểm hơn ở các vùng có độ dốc cao
        const points: Array<{ x: number; y: number; z: number; size: number; color: [number, number, number]; radius: number }> = [];

        for (let i = 0; i < totalParticles; i++) {
            const armIndex = i % spiralArms;
            const particleProgress = Math.floor(i / spiralArms) / particlesPerArm;

            const angle = particleProgress * maxAngle;
            const armAngleOffset = (armIndex / spiralArms) * Math.PI * 2;

            const baseRadius = angle * armSpread;
            const randomRadius = Math.pow(Math.random(), 2) * armThickness;

            const finalRadius = baseRadius + randomRadius;
            const finalAngle = angle + armAngleOffset;

            // Xác định xem điểm có nằm ở viền ngoài không (80-100% của armThickness)
            const isEdge = randomRadius > armThickness * 0.75;

            const x = Math.cos(finalAngle) * finalRadius;
            const z = Math.sin(finalAngle) * finalRadius;
            const y = wave ? spiralWaveY(finalRadius) : -0.6;

            const radiusRatio = Math.min(finalRadius / 8, 1);
            const rand = Math.random();
            let brightness = BRIGHT_BASE + radiusRatio * BRIGHT_RADIAL + rand * BRIGHT_RANDOM;
            brightness = Math.min(brightness, BRIGHT_CAP);

            const pointSize = (0.015 + Math.random() * 0.012) * (0.5 + radiusRatio * 0.5);

            points.push({
                x,
                y,
                z,
                size: pointSize,
                color: [baseColor.r * brightness, baseColor.g * brightness, baseColor.b * brightness],
                radius: Math.hypot(x, z),
            });

            // Thêm điểm viền ngoài để   tạo đường viền rõ ràng
            if (isEdge && i % 2 === 0) {
                // Tạo 2-3 điểm bổ sung dọc theo viền ngoài
                const edgePoints = 2;
                for (let e = 0; e < edgePoints; e++) {
                    const edgeOffset = (Math.random() - 0.5) * 0.15; // Random nhẹ
                    const edgeRadiusFactor = 0.95 + Math.random() * 0.1; // 95-105% của armThickness
                    const edgeRadius = baseRadius + armThickness * edgeRadiusFactor;
                    const edgeAngle = finalAngle + edgeOffset;

                    const edgeX = Math.cos(edgeAngle) * edgeRadius;
                    const edgeZ = Math.sin(edgeAngle) * edgeRadius;
                    const edgeY = wave ? spiralWaveY(edgeRadius) : -0.6;

                    points.push({
                        x: edgeX,
                        y: edgeY,
                        z: edgeZ,
                        size: pointSize * 1.1, // Điểm viền to hơn một chút
                        color: [baseColor.r * brightness * 1.05, baseColor.g * brightness * 1.05, baseColor.b * brightness * 1.05],
                        radius: Math.hypot(edgeX, edgeZ),
                    });
                }
            }

            // Thêm điểm bổ sung ở các vùng có độ dốc cao (cạnh bên của sóng)
            if (wave && i % 3 === 0) {
                // Chỉ thêm cho 1/3 số điểm để tránh quá nhiều
                const waveFrequency = 4.0;
                const phase = (finalRadius * waveFrequency) % (Math.PI * 2);
                // Độ dốc cao nhất khi phase gần PI/2 hoặc 3PI/2
                const slopeFactor = Math.abs(Math.cos(phase));

                if (slopeFactor > 0.7) {
                    // Chỉ thêm điểm ở vùng độ dốc cao
                    const extraPoints = Math.floor(slopeFactor * 0.4); // Thêm tối đa 40% điểm
                    for (let j = 0; j < extraPoints; j++) {
                        const offsetAngle = (Math.random() - 0.5) * 0.1;
                        const offsetRadius = (Math.random() - 0.5) * armThickness * 0.3;

                        const newRadius = finalRadius + offsetRadius;
                        const newAngle = finalAngle + offsetAngle;
                        const newX = Math.cos(newAngle) * newRadius;
                        const newZ = Math.sin(newAngle) * newRadius;
                        const newY = spiralWaveY(newRadius);

                        points.push({
                            x: newX,
                            y: newY,
                            z: newZ,
                            size: pointSize * 0.9,
                            color: [baseColor.r * brightness, baseColor.g * brightness, baseColor.b * brightness],
                            radius: Math.hypot(newX, newZ),
                        });
                    }
                }
            }

            // Thêm điểm cầu nối giữa 2 spiral arms để chúng dính vào nhau
            if (i % 3 === 0 && armIndex === 0) {
                // Tăng tần suất thêm điểm cầu nối
                const bridgePoints = 5; // Tăng số điểm cầu nối từ 3 lên 5
                const otherArmOffset = Math.PI; // Offset đến arm kia (180 độ cho 2 arms)

                for (let b = 0; b < bridgePoints; b++) {
                    const bridgeProgress = (b + 1) / (bridgePoints + 1); // Phân bố đều giữa 2 arms
                    const bridgeAngle = finalAngle + otherArmOffset * bridgeProgress;

                    // Tạo nhiều lớp điểm với độ rộng khác nhau để lấp đầy khoảng trống
                    for (let layer = 0; layer < 2; layer++) {
                        const layerOffset = (layer - 0.5) * armThickness * 0.6;
                        const bridgeRadius = finalRadius + (Math.random() - 0.5) * armThickness * 0.4 + layerOffset;

                        const bridgeX = Math.cos(bridgeAngle) * bridgeRadius;
                        const bridgeZ = Math.sin(bridgeAngle) * bridgeRadius;
                        const bridgeY = wave ? spiralWaveY(bridgeRadius) : -0.6;

                        points.push({
                            x: bridgeX,
                            y: bridgeY,
                            z: bridgeZ,
                            size: pointSize * 0.9,
                            color: [baseColor.r * brightness * 1, baseColor.g * brightness * 1, baseColor.b * brightness * 1],
                            radius: Math.hypot(bridgeX, bridgeZ),
                        });
                    }
                }
            }
        }

        // Sắp xếp theo radius để render từ trong ra ngoài
        points.sort((a, b) => a.radius - b.radius);

        const finalCount = points.length;
        const posFinal = new Float32Array(finalCount * 3);
        const colFinal = new Float32Array(finalCount * 3);
        const sizeFinal = new Float32Array(finalCount);

        for (let i = 0; i < finalCount; i++) {
            const p = points[i];
            posFinal[i * 3] = p.x;
            posFinal[i * 3 + 1] = p.y;
            posFinal[i * 3 + 2] = p.z;
            colFinal[i * 3] = p.color[0];
            colFinal[i * 3 + 1] = p.color[1];
            colFinal[i * 3 + 2] = p.color[2];
            sizeFinal[i] = p.size;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(posFinal, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colFinal, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizeFinal, 1));
        geometry.setDrawRange(0, 0);
        return geometry;
    }, [totalParticles, spiralArms, rotations, armSpread, armThickness, wave]);

    useLayoutEffect(() => {
        const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined;
        const mat = matRef.current;
        if (geo) geo.setDrawRange(0, 0);
        if (mat) {
            mat.transparent = true;
            mat.opacity = 0;
            mat.needsUpdate = true;
        }
        startRef.current = null;
    }, []);

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const geo = pointsRef.current?.geometry as THREE.BufferGeometry | undefined;
        const mat = matRef.current;
        if (!geo || !mat) return;

        if (startRef.current == null) {
            startRef.current = t;
            geo.setDrawRange(0, 0);
            mat.opacity = 0;
            return;
        }

        const elapsed = t - startRef.current;
        const raw = Math.max(0, Math.min(1, (elapsed - appearDelay) / appearDuration));
        const k = easeOutCubic(raw);

        const total = (geo.getAttribute("position") as THREE.BufferAttribute).count;
        geo.setDrawRange(0, Math.max(1, Math.floor(total * k)));

        mat.opacity = Math.min(k, OPACITY_CAP);
    });

    return (
        <points ref={pointsRef} geometry={spiralGeometry}>
            <pointsMaterial
                ref={matRef}
                size={0.04}
                vertexColors
                transparent
                opacity={0}
                sizeAttenuation
                blending={THREE.NormalBlending}
                depthWrite={false}
                map={dotTexture}
                alphaTest={0}
            />
        </points>
    );
}

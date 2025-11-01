'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/* ============================================
   Config (giảm chói / giảm ăn Bloom)
   ============================================ */
const DOT_ALPHA = 0.7;        // alpha của texture dot (0..1) — giảm từ 1 → 0.6
const BRIGHT_BASE = 0.4;     // nền sáng
const BRIGHT_RADIAL = 0.2;   // tăng theo bán kính
const BRIGHT_RANDOM = 0.3;   // độ ngẫu nhiên
const BRIGHT_CAP = 0.9;      // trần brightness để tránh quá sáng
const OPACITY_CAP = 0.8;     // trần opacity khi reveal (giảm "gắt")

type Props = {
    /** thời gian reveal (giây) */
    appearDuration?: number;
    /** trễ trước khi bắt đầu (giây) */
    appearDelay?: number;
};

/* Texture hình tròn cho dot — đặt alpha thấp để bớt chói */
function createCircleTexture(size = 128, alpha = DOT_ALPHA) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
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

export default function GroundRings({
    appearDuration = 1.6,
    appearDelay = 0,
}: Props) {
    const pointsRef = useRef<THREE.Points>(null);
    const matRef = useRef<THREE.PointsMaterial>(null);
    const startRef = useRef<number | null>(null);

    // --- Cấu hình cho hiệu ứng xoắn ốc ---
    const totalParticles = 5000;  // Tổng số hạt
    const spiralArms = 2;         // Số nhánh xoắn
    const rotations = 3;          // Số vòng quay/nhánh
    const armSpread = 0.35;       // Độ rộng vòng xoắn
    const armThickness = 1;       // Độ dày mỗi vòng
    // --------------------------------------

    const dotTexture = useMemo(() => createCircleTexture(128, DOT_ALPHA), []);

    const spiralGeometry = useMemo(() => {
        // 1) Tạo dữ liệu thô
        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        const sizes = new Float32Array(totalParticles);
        const radii = new Float32Array(totalParticles);

        const baseColor = new THREE.Color('#ffffff');
        const maxAngle = rotations * Math.PI * 2;
        const particlesPerArm = totalParticles / spiralArms;

        function spiralWaveY(radius: number) {
            const waveFrequency = 4.0;
            const waveAmplitude = 0.25; // biên độ không đổi
            const wave = Math.sin(radius * waveFrequency);
            return -0.5 + wave * waveAmplitude;
        }

        for (let i = 0; i < totalParticles; i++) {
            const armIndex = i % spiralArms;
            const particleProgress = Math.floor(i / spiralArms) / particlesPerArm;

            const angle = particleProgress * maxAngle;
            const armAngleOffset = (armIndex / spiralArms) * Math.PI * 2;

            const baseRadius = angle * armSpread;
            const randomRadius = Math.pow(Math.random(), 2) * armThickness;

            const finalRadius = baseRadius + randomRadius;
            const finalAngle = angle + armAngleOffset;

            const x = Math.cos(finalAngle) * finalRadius;
            const z = Math.sin(finalAngle) * finalRadius;
            const y = spiralWaveY(finalRadius);

            const idx = i * 3;
            positions[idx + 0] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;

            const radiusRatio = Math.min(finalRadius / 8, 1);
            const rand = Math.random();
            let brightness = BRIGHT_BASE + radiusRatio * BRIGHT_RADIAL + rand * BRIGHT_RANDOM; // ~0.35 → ~0.75
            brightness = Math.min(brightness, BRIGHT_CAP); // kẹp trần

            colors[idx + 0] = baseColor.r * brightness;
            colors[idx + 1] = baseColor.g * brightness;
            colors[idx + 2] = baseColor.b * brightness;

            sizes[i] = (0.015 + Math.random() * 0.012) * (0.5 + radiusRatio * 0.5);

            radii[i] = Math.hypot(x, z);
        }

        // 2) Sắp xếp từ tâm → rìa để reveal mượt
        const order = Array.from({ length: totalParticles }, (_, i) => i).sort(
            (a, b) => radii[a] - radii[b]
        );

        const posFinal = new Float32Array(totalParticles * 3);
        const colFinal = new Float32Array(totalParticles * 3);
        const sizeFinal = new Float32Array(totalParticles);

        for (let newIdx = 0; newIdx < totalParticles; newIdx++) {
            const oldIdx = order[newIdx];

            posFinal[newIdx * 3 + 0] = positions[oldIdx * 3 + 0];
            posFinal[newIdx * 3 + 1] = positions[oldIdx * 3 + 1];
            posFinal[newIdx * 3 + 2] = positions[oldIdx * 3 + 2];

            colFinal[newIdx * 3 + 0] = colors[oldIdx * 3 + 0];
            colFinal[newIdx * 3 + 1] = colors[oldIdx * 3 + 1];
            colFinal[newIdx * 3 + 2] = colors[oldIdx * 3 + 2];

            sizeFinal[newIdx] = sizes[oldIdx];
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(posFinal, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colFinal, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizeFinal, 1));
        geometry.setDrawRange(0, 0);
        return geometry;
    }, [totalParticles, spiralArms, rotations, armSpread, armThickness]);

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
        const k = easeOutCubic(raw); // 0..1

        const total = (geo.getAttribute('position') as THREE.BufferAttribute).count;
        geo.setDrawRange(0, Math.max(1, Math.floor(total * k)));

        // Giới hạn trần opacity để giảm chói tổng thể
        mat.opacity = Math.min(Math.pow(k, 1), OPACITY_CAP);
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
                blending={THREE.NormalBlending} // giữ Normal để tránh sáng quá
                depthWrite={false}
                map={dotTexture}
                alphaTest={0}
            />
        </points>
    );
}

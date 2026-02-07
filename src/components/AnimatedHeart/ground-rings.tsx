'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { parseRGBStringToColor } from './util';

/* ============================================
   Config - Hiệu ứng dot nhỏ, phát sáng mạnh
   ============================================ */
const DOT_ALPHA = 1.0;           // Alpha full
const BRIGHT_BASE = 1.5;         // Độ sáng cơ bản vượt 1.0 để glow
const OPACITY_CAP = 1.0;         // Opacity tối đa = 1

// Config cho kích thước dot
const DOT_SIZE_BASE = 0.015;     // Kích thước cơ bản lớn hơn
const DOT_SIZE_MATERIAL = 0.045; // Size trong material lớn hơn

// Config cho độ cao
const HEIGHT_VARIATION = 1.3;    // Chênh lệch độ cao lớn hơn nhiều (tăng từ 0.8 lên 2.0)
const NOISE_SCALE = 0.2;         // Scale của noise

type Props = {
    /** thời gian reveal (giây) */
    appearDuration?: number;
    /** trễ trước khi bắt đầu (giây) */
    appearDelay?: number;
    /** độ gồ ghề của mặt phẳng (0 = phẳng hoàn toàn) */
    bumpiness?: number;
    /** kích thước mặt phẳng */
    groundSize?: number;
    /** vị trí Y của ground */
    groundY?: number;
    /** màu chính của ground (giống màu trái tim) */
    color?: string;
    /** Progress đổi màu (0-1) từ bên ngoài */
    colorProgress?: number;
    /** Màu ban đầu */
    initialColor?: string;
    /** Màu mục tiêu */
    targetColor?: string;
    /** Flash multiplier từ bên ngoài */
    flashMultiplier?: number;
};

/* Texture hình tròn mềm mại với glow effect mạnh */
function createGlowDotTexture(size = 64, alpha = DOT_ALPHA) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, size, size);

        // Tạo gradient radial cho hiệu ứng glow mạnh hơn
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.2, `rgba(255, 255, 255, ${alpha * 0.8})`);
        gradient.addColorStop(0.4, `rgba(255, 255, 255, ${alpha * 0.5})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.2})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
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
    bumpiness = 0.15,
    groundSize = 30,
    groundY = -0.8,
    colorProgress = 0,
    initialColor = 'rgb(255, 179, 51)',
    targetColor = 'rgb(255, 26, 26)',
    flashMultiplier = 1,
}: Props) {
    const pointsRef = useRef<THREE.Points>(null);
    const matRef = useRef<THREE.PointsMaterial>(null);
    const startRef = useRef<number | null>(null);

    // Tăng số lượng particles cho mặt phẳng lớn
    const totalParticles = 18000;

    const dotTexture = useMemo(() => createGlowDotTexture(64, DOT_ALPHA), []);

    const orangeColor = useMemo(() => {
        return new THREE.Color(parseRGBStringToColor(initialColor));
    }, [initialColor]);
    const redColor = useMemo(() => {
        return new THREE.Color(parseRGBStringToColor(targetColor));
    }, [targetColor]);

    // Lưu offset Y ban đầu cho mỗi particle để làm animation
    const initialOffsetsRef = useRef<Float32Array | null>(null);
    const appearOrderRef = useRef<Float32Array | null>(null);
    const visibilityRef = useRef<Float32Array | null>(null);
    const baseColorsRef = useRef<Float32Array | null>(null); // Lưu màu gốc để interpolate

    const groundGeometry = useMemo(() => {
        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        const sizes = new Float32Array(totalParticles);
        const initialOffsets = new Float32Array(totalParticles);
        const appearOrder = new Float32Array(totalParticles); // Thứ tự xuất hiện
        const baseColors = new Float32Array(totalParticles * 3); // Lưu màu gốc

        // Sử dụng màu cam ban đầu (giống trái tim) - màu đồng nhất
        const baseColor = orangeColor.clone();

        // Tạo noise function với nhiều octaves cho độ cao đa dạng
        const noise2D = (x: number, z: number, scale: number = NOISE_SCALE) => {
            const nx = x * scale;
            const nz = z * scale;
            return (
                Math.sin(nx * 0.3 + nz * 0.2) * 0.5 +
                Math.sin(nx * 0.8 - nz * 0.6) * 0.4 +
                Math.cos(nx * 0.5 + nz * 0.9) * 0.45 +
                Math.sin(nx * 1.5 + nz * 1.2) * 0.3 +
                Math.cos(nx * 2.0 - nz * 1.8) * 0.2 +
                (Math.random() - 0.5) * 0.8 // Random bump lớn hơn
            );
        };

        for (let i = 0; i < totalParticles; i++) {
            // Phân bố particles trên mặt phẳng rộng
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * groundSize;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Tính độ gồ ghề với chênh lệch lớn hơn nhiều
            const bumpOffset = noise2D(x, z) * bumpiness * HEIGHT_VARIATION;
            const y = groundY + bumpOffset;

            // Lưu offset ban đầu cho animation
            initialOffsets[i] = bumpOffset;

            // Thứ tự xuất hiện ngẫu nhiên (0-1)
            appearOrder[i] = Math.random();

            const idx = i * 3;
            positions[idx] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;

            // Màu sắc đồng nhất - cùng màu với trái tim
            const distRatio = Math.min(radius / groundSize, 1);

            // Độ sáng cố định, chỉ fade theo khoảng cách
            const distanceFade = 1 - distRatio * 0.3;
            const brightness = BRIGHT_BASE * distanceFade;

            colors[idx] = baseColor.r * brightness;
            colors[idx + 1] = baseColor.g * brightness;
            colors[idx + 2] = baseColor.b * brightness;

            // Lưu màu gốc để interpolate
            baseColors[idx] = baseColor.r;
            baseColors[idx + 1] = baseColor.g;
            baseColors[idx + 2] = baseColor.b;

            // Size đa dạng hơn: thêm random mạnh và non-linear cho tự nhiên
            const sizeRand = Math.pow(Math.random(), 1.7); // Nhiều dot nhỏ, ít dot lớn
            const sizeVar = DOT_SIZE_BASE + sizeRand * 0.032 + Math.random() * 0.012;
            sizes[i] = sizeVar * (0.5 + (1 - distRatio) * 0.5);
        }

        // Lưu initialOffsets
        initialOffsetsRef.current = initialOffsets;
        appearOrderRef.current = appearOrder;
        baseColorsRef.current = baseColors;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setDrawRange(0, 0);
        return geometry;
    }, [totalParticles, groundSize, groundY, bumpiness, orangeColor]);

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

        // Khởi tạo visibility array
        if (geo) {
            const total = (geo.getAttribute('position') as THREE.BufferAttribute).count;
            visibilityRef.current = new Float32Array(total).fill(0);
        }
    }, []);

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeInOutQuad = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

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

        const total = (geo.getAttribute('position') as THREE.BufferAttribute).count;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
        const initialOffsets = initialOffsetsRef.current;
        const appearOrder = appearOrderRef.current;
        const baseColors = baseColorsRef.current;

        // Hiệu ứng xuất hiện dần từng dot
        if (posAttr && colorAttr && initialOffsets && appearOrder && baseColors) {
            let visibleCount = 0;

            // Tính màu hiện tại dựa trên colorProgress
            const currentBaseColor = orangeColor.clone().lerp(redColor, colorProgress);

            for (let i = 0; i < total; i++) {
                // Mỗi dot có thời điểm xuất hiện riêng dựa trên appearOrder
                const dotAppearTime = appearOrder[i] * 0.8; // Spread ra 80% thời gian
                const dotProgress = Math.max(0, Math.min(1, (k - dotAppearTime) / 0.2));
                const dotAlpha = easeInOutQuad(dotProgress);

                if (dotAlpha > 0) {
                    visibleCount = Math.max(visibleCount, i + 1);

                    const idx = i * 3;

                    // Tính brightness ban đầu (từ geometry)
                    const origR = baseColors[idx];
                    const origG = baseColors[idx + 1];
                    const origB = baseColors[idx + 2];

                    // Tính màu mục tiêu tương ứng (đỏ)
                    const targetR = redColor.r * (origR / orangeColor.r);
                    const targetG = redColor.g * (origG / orangeColor.g);
                    const targetB = redColor.b * (origB / orangeColor.b);

                    // Interpolate màu theo colorProgress
                    const newR = origR + (targetR - origR) * colorProgress;
                    const newG = origG + (targetG - origG) * colorProgress;
                    const newB = origB + (targetB - origB) * colorProgress;

                    // Hiệu ứng pop-in: dot bay lên từ dưới
                    const baseY = groundY + initialOffsets[i];
                    const popOffset = (1 - dotAlpha) * -0.3; // Bay lên từ dưới

                    // Wave animation nhẹ sau khi xuất hiện
                    const waveOffset = dotAlpha > 0.9 ? Math.sin(t * 0.8 + i * 0.005) * 0.015 : 0;

                    posAttr.setY(i, baseY + popOffset + waveOffset);

                    // Glow khi xuất hiện, khi đổi màu, và duy trì glow nhẹ sau khi đổi màu
                    const appearGlow = dotProgress < 0.5 ? (0.5 - dotProgress) * 0.2 : 0;
                    const colorChangeGlow = colorProgress > 0 && colorProgress < 1 && flashMultiplier > 1.5 ? 0.6 * Math.sin(colorProgress * Math.PI) : 0;
                    // Glow nhẹ duy trì sau khi đổi màu
                    const persistentGlow = colorProgress >= 1 ? 0.18 : 0;
                    const glowBoost = appearGlow + colorChangeGlow + persistentGlow;

                    // Áp dụng flashMultiplier để đồng bộ với trái tim
                    colorAttr.setXYZ(
                        i,
                        (newR + glowBoost) * flashMultiplier,
                        (newG + glowBoost) * flashMultiplier,
                        (newB + glowBoost) * flashMultiplier
                    );
                }
            }

            posAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;
            geo.setDrawRange(0, Math.max(1, visibleCount));
        }

        mat.opacity = Math.min(k, OPACITY_CAP);
    });

    return (
        <points ref={pointsRef} geometry={groundGeometry}>
            <pointsMaterial
                ref={matRef}
                size={DOT_SIZE_MATERIAL}
                vertexColors
                transparent
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                map={dotTexture}
            />
        </points>
    );
}

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { parseRGBStringToColor } from './util';

type Props = {
    /** Số lượng trái tim */
    count?: number;
    /** Vùng spawn (bán kính) */
    spawnRadius?: number;
    /** Tốc độ bay lên cơ bản */
    riseSpeed?: number;
    /** Độ cao tối đa */
    maxHeight?: number;
    /** Độ cao khởi đầu */
    startHeight?: number;
    /** Delay trước khi bắt đầu (giây) */
    appearDelay?: number;
    /** Độ mờ tổng thể (0-1) */
    opacity?: number;
    /** Hệ số phát sáng (1 = bình thường, 2 = gấp đôi) */
    glowMultiplier?: number;
    /** Progress đổi màu (0-1) từ bên ngoài */
    colorProgress?: number;
    /** Flash multiplier từ bên ngoài */
    flashMultiplier?: number;
    miniHeartColor: string
};

/* Tạo texture hình trái tim 2D đơn giản - màu trắng để vertex colors điều khiển */
function createGlowHeartTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.clearRect(0, 0, size, size);

        const centerX = size / 2;
        const centerY = size / 2;
        const heartScale = size / 32;

        // Hàm vẽ hình trái tim chuẩn như hình mẫu
        const drawHeart = (scale: number) => {
            ctx.beginPath();
            const s = heartScale * scale;

            // Vẽ trái tim với bezier curves - hình dạng chuẩn
            ctx.moveTo(centerX, centerY + 10 * s);

            // Bên trái
            ctx.bezierCurveTo(
                centerX - 2 * s, centerY + 6 * s,
                centerX - 12 * s, centerY + 2 * s,
                centerX - 12 * s, centerY - 4 * s
            );
            ctx.bezierCurveTo(
                centerX - 12 * s, centerY - 10 * s,
                centerX - 6 * s, centerY - 12 * s,
                centerX, centerY - 6 * s
            );

            // Bên phải
            ctx.bezierCurveTo(
                centerX + 6 * s, centerY - 12 * s,
                centerX + 12 * s, centerY - 10 * s,
                centerX + 12 * s, centerY - 4 * s
            );
            ctx.bezierCurveTo(
                centerX + 12 * s, centerY + 2 * s,
                centerX + 2 * s, centerY + 6 * s,
                centerX, centerY + 10 * s
            );

            ctx.closePath();
        };

        // Vẽ glow nhẹ bên ngoài - màu trắng để vertex colors điều khiển
        for (let i = 3; i >= 1; i--) {
            const glowScale = 1 + i * 0.05;
            const alpha = 0.15 / i;
            ctx.save();
            drawHeart(glowScale);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
            ctx.restore();
        }

        // Vẽ trái tim chính - màu trắng để vertex colors điều khiển
        drawHeart(1);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    return texture;
}

// Dữ liệu cho mỗi trái tim với lifetime
interface HeartData {
    x: number;
    z: number;
    baseY: number;
    speed: number;
    phase: number;
    baseSize: number;
    wobbleSpeed: number;
    wobbleAmount: number;
    // Thêm các thuộc tính mới
    lifetime: number; // Thời gian tồn tại (giây)
    spawnTime: number; // Thời điểm spawn (offset từ đầu)
    fadeInDuration: number; // Thời gian fade in
    fadeOutDuration: number; // Thời gian fade out
}


export default function FloatingHearts({
    count = 120, // Gấp đôi số lượng
    spawnRadius = 0.8,
    riseSpeed = 0.25,
    startHeight = 0.5, // Bắt đầu cao hơn nền
    appearDelay = 1,
    glowMultiplier = 1.0,
    colorProgress = 0, // Progress đổi màu từ cam sang đỏ
    flashMultiplier = 1,
    miniHeartColor
}: Props) {
    const pointsRef = useRef<THREE.Points>(null);
    const matRef = useRef<THREE.PointsMaterial>(null);
    const startRef = useRef<number | null>(null);

    const ORANGE_COLOR = new THREE.Color(1.0, 0.65, 0.28);
    const PINK_COLOR = new THREE.Color(parseRGBStringToColor(miniHeartColor));

    const heartTexture = useMemo(() => createGlowHeartTexture(128), []);

    // Tạo dữ liệu cho từng trái tim với lifetime ngẫu nhiên
    const heartsData = useMemo<HeartData[]>(() => {
        const data: HeartData[] = [];
        for (let i = 0; i < count; i++) {
            // Vị trí spawn ngẫu nhiên
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * spawnRadius;

            // Lifetime ngẫu nhiên từ 4-10 giây
            const lifetime = 4 + Math.random() * 6;

            data.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                baseY: startHeight + Math.random() * 1.5, // Độ cao ngẫu nhiên cao hơn nền
                speed: riseSpeed * (0.5 + Math.random() * 0.6),
                phase: Math.random() * Math.PI * 2,
                baseSize: 0.03 + Math.random() * 0.04, // Kích thước nhỏ hơn 1/2
                wobbleSpeed: 0.3 + Math.random() * 0.5,
                wobbleAmount: 0.12 + Math.random() * 0.18,
                lifetime: lifetime,
                spawnTime: Math.random() * 3, // Spawn stagger trong 3 giây đầu
                fadeInDuration: 0.3 + Math.random() * 0.4,
                fadeOutDuration: 1.0 + Math.random() * 1.5,
            });
        }
        return data;
    }, [count, spawnRadius, startHeight, riseSpeed]);

    // Geometry cho particles
    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const data = heartsData[i];
            positions[i * 3] = data.x;
            positions[i * 3 + 1] = data.baseY;
            positions[i * 3 + 2] = data.z;

            sizes[i] = data.baseSize;

            // Màu vàng cam ban đầu
            colors[i * 3] = ORANGE_COLOR.r;
            colors[i * 3 + 1] = ORANGE_COLOR.g;
            colors[i * 3 + 2] = ORANGE_COLOR.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    }, [count, heartsData]);

    // Lưu trữ thời gian spawn thực tế cho mỗi heart (để respawn)
    const spawnTimesRef = useRef<Float32Array | null>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const mat = matRef.current;
        const points = pointsRef.current;

        if (!points || !mat) return;

        // Khởi tạo start time và spawn times
        if (startRef.current === null) {
            startRef.current = t;
            mat.opacity = 0;
            // Khởi tạo spawn times cho mỗi heart
            spawnTimesRef.current = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                spawnTimesRef.current[i] = heartsData[i].spawnTime;
            }
            return;
        }

        const elapsed = t - startRef.current;

        // Chờ delay
        if (elapsed < appearDelay) {
            mat.opacity = 0;
            return;
        }

        const activeTime = elapsed - appearDelay;

        // Fade in tổng thể
        const globalFadeIn = Math.min(activeTime / 1.0, 1);

        const geo = points.geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const sizeAttr = geo.getAttribute('size') as THREE.BufferAttribute;
        const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
        const spawnTimes = spawnTimesRef.current;

        if (!spawnTimes) return;

        for (let i = 0; i < count; i++) {
            const data = heartsData[i];

            // Tính thời gian sống của heart này
            const heartSpawnTime = spawnTimes[i];
            const heartAge = activeTime - heartSpawnTime;

            // Nếu chưa đến lúc spawn
            if (heartAge < 0) {
                posAttr.setXYZ(i, data.x, data.baseY - 2, data.z); // Ẩn dưới
                sizeAttr.setX(i, 0);
                continue;
            }

            // Nếu đã hết lifetime, respawn với vị trí mới
            if (heartAge > data.lifetime) {
                // Respawn: đặt lại spawn time
                spawnTimes[i] = activeTime + Math.random() * 0.5; // Respawn ngay hoặc sau 0.5s

                // Vị trí spawn mới ngẫu nhiên
                const newAngle = Math.random() * Math.PI * 2;
                const newRadius = Math.sqrt(Math.random()) * spawnRadius;
                data.x = Math.cos(newAngle) * newRadius;
                data.z = Math.sin(newAngle) * newRadius;
                data.baseY = startHeight + Math.random() * 0.8;

                // Random lại một số thuộc tính
                data.speed = riseSpeed * (0.5 + Math.random() * 0.6);
                data.lifetime = 4 + Math.random() * 6;

                posAttr.setXYZ(i, data.x, data.baseY - 2, data.z);
                sizeAttr.setX(i, 0);
                continue;
            }

            // Tính fade in/out dựa trên lifetime
            let lifeAlpha = 1;
            if (heartAge < data.fadeInDuration) {
                // Fade in
                lifeAlpha = heartAge / data.fadeInDuration;
            } else if (heartAge > data.lifetime - data.fadeOutDuration) {
                // Fade out
                lifeAlpha = (data.lifetime - heartAge) / data.fadeOutDuration;
            }
            lifeAlpha = Math.max(0, Math.min(1.5, lifeAlpha));

            // Tính vị trí Y mới (bay lên theo thời gian heart sống)
            const newY = data.baseY + heartAge * data.speed;

            // Wobble (lắc lư sang trái phải khi bay)
            const wobbleX = Math.sin(heartAge * data.wobbleSpeed + data.phase) * data.wobbleAmount;
            const wobbleZ = Math.cos(heartAge * data.wobbleSpeed * 0.7 + data.phase) * data.wobbleAmount * 0.6;

            posAttr.setXYZ(i, data.x + wobbleX, newY, data.z + wobbleZ);

            // Khi colorProgress càng lớn, trái tim càng mờ hơn (ví dụ giảm còn 40% khi colorProgress = 1)
            const fadeByColor = 1 - 0.8 * colorProgress;
            sizeAttr.setX(i, data.baseSize * lifeAlpha * fadeByColor);

            // Chuyển màu từ vàng cam sang hồng #ff7092ff theo colorProgress
            const currentR = ORANGE_COLOR.r + (PINK_COLOR.r - ORANGE_COLOR.r) * colorProgress;
            const currentG = ORANGE_COLOR.g + (PINK_COLOR.g - ORANGE_COLOR.g) * colorProgress;
            const currentB = ORANGE_COLOR.b + (PINK_COLOR.b - ORANGE_COLOR.b) * colorProgress;
            const brightness = 0.7 - 0.4 * colorProgress;
            colorAttr.setXYZ(
                i,
                currentR * lifeAlpha * flashMultiplier * brightness * 1.8,
                currentG * lifeAlpha * flashMultiplier * brightness * 1.8,
                currentB * lifeAlpha * flashMultiplier * brightness * 1.8
            );
        }

        posAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;

        mat.opacity = globalFadeIn * 0.3;
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
                ref={matRef}
                size={0.18 * glowMultiplier}
                vertexColors
                transparent
                opacity={0}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                map={heartTexture}
                alphaTest={0.005}
            />
        </points>
    );
}

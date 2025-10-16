"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function createCircleTexture(size = 128) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1;
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

const starColors = ['#00bfff', '#2196f3', '#ffffff'];
function normalizeColor(color: THREE.Color, targetSum = 2.7) {
    // Tăng độ sáng tổng R+G+B lên targetSum
    const sum = color.r + color.g + color.b;
    if (sum < targetSum) {
        const factor = targetSum / Math.max(sum, 0.01);
        color.r = Math.min(1, color.r * factor);
        color.g = Math.min(1, color.g * factor);
        color.b = Math.min(1, color.b * factor);
    }
    return color;
}

export default function BackgroundStars() {
    const dotTexture = useMemo(() => createCircleTexture(128), []);
    const pointsRef = useRef<THREE.Points>(null);
    const particleCount = 1800; // Tăng số lượng dots

    // Lưu trữ sizes gốc để phục hồi
    const originalSizes = useRef<Float32Array>(new Float32Array(particleCount));

    const starGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        const opacities = new Float32Array(particleCount); // Thêm mảng opacity

        for (let i = 0; i < particleCount; i++) {
            // Tạo ngôi sao phân bố đều trong không gian
            const radius = 8 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Kích thước dots nhỏ hơn
            const size = Math.random() * 0.07 + 0.02;
            sizes[i] = size;
            originalSizes.current[i] = size;

            // Random 3 màu
            let color = new THREE.Color(starColors[Math.floor(Math.random() * starColors.length)]);
            color = normalizeColor(color, 2.7 + Math.random() * 0.3); // Chuẩn hóa độ sáng
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Random opacity cho mỗi dot
            opacities[i] = 0.5 + Math.random() * 0.5; // Opacity từ 0.5 đến 1
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1)); // Thêm attribute opacity
        return geometry;
    }, [particleCount]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.getElapsedTime();

        // Xoay rất chậm để tạo hiệu ứng nền
        pointsRef.current.rotation.y = time * 0.09;

        // Nhấp nháy ngôi sao - sửa lỗi truy cập array
        const geometry = pointsRef.current.geometry;
        if (geometry.attributes.size) {
            const sizes = geometry.attributes.size.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                const pulse = Math.sin(time * 2 + i * 0.1) * 0.5 + 0.5;
                sizes[i] = originalSizes.current[i] * (0.8 + pulse * 0.4);
            }
            geometry.attributes.size.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef} geometry={starGeometry}>
            <pointsMaterial
                size={0.13}
                vertexColors
                transparent
                opacity={1}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                map={dotTexture}
                alphaTest={0.5}
            />
        </points>
    );
}

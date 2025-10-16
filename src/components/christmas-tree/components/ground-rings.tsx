'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// Hàm tiện ích để tạo texture hình tròn cho các hạt
function createCircleTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 1;
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

export default function GroundRings() {
    const pointsRef = useRef<THREE.Points>(null);

    // --- Cấu hình cho hiệu ứng xoắn ốc ---
    const totalParticles = 5000; // Tổng số hạt để tạo hiệu ứng
    const spiralArms = 2;          // Số lượng vòng xoắn ốc
    const rotations = 3;           // Số vòng xoay cho mỗi xoắn ốc
    const armSpread = 0.35;         // Độ rộng/khoảng cách giữa các vòng xoắn
    const armThickness = 1;      // Độ dày của mỗi vòng xoắn
    // -----------------------------------------

    const spiralGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        const sizes = new Float32Array(totalParticles);

        const baseColor = new THREE.Color('#ffffff');
        const maxAngle = rotations * Math.PI * 2;
        const particlesPerArm = totalParticles / spiralArms;

        // Hàm tạo độ cao gợn sóng cho các đường xoắn ốc
        function spiralWaveY(radius: number) {
            const waveFrequency = 4.0; // Tần số sóng (số ngọn sóng)

            // ✨ THAY ĐỔI CHÍNH: Sử dụng một giá trị biên độ sóng không đổi (0.25)
            // thay vì tính toán dựa trên bán kính.
            const waveAmplitude = 0.25;

            const wave = Math.sin(radius * waveFrequency);
            return -0.5 + wave * waveAmplitude;
        }

        for (let i = 0; i < totalParticles; i++) {
            const armIndex = i % spiralArms; // Xác định hạt thuộc về xoắn ốc nào (0 hoặc 1)
            const particleProgress = Math.floor(i / spiralArms) / particlesPerArm;

            // Tính góc xoay cơ bản dựa trên tiến trình của hạt
            const angle = particleProgress * maxAngle;

            // Thêm độ lệch góc cho mỗi xoắn ốc để chúng đối xứng nhau
            const armAngleOffset = (armIndex / spiralArms) * Math.PI * 2;

            // Tính bán kính cơ bản theo công thức xoắn ốc Archimedes
            const baseRadius = angle * armSpread;

            // Thêm nhiễu ngẫu nhiên để tạo độ dày cho vòng xoắn
            const randomAngle = Math.random() * Math.PI * 2;
            const randomRadius = Math.pow(Math.random(), 2) * armThickness;

            const finalRadius = baseRadius + randomRadius;
            const finalAngle = angle + armAngleOffset;

            // Chuyển từ tọa độ cực sang tọa độ Descartes
            const x = Math.cos(finalAngle) * finalRadius;
            const z = Math.sin(finalAngle) * finalRadius;
            const y = spiralWaveY(finalRadius); // Tính toán chiều cao Y

            const idx = i * 3;
            positions[idx] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;

            // Màu sắc và độ sáng
            const radiusRatio = Math.min(finalRadius / 8, 1);
            const brightness = 0.8 + radiusRatio * 0.5 + Math.random() * 0.3;
            colors[idx] = baseColor.r * brightness;
            colors[idx + 1] = baseColor.g * brightness;
            colors[idx + 2] = baseColor.b * brightness;

            // Kích thước hạt
            sizes[i] = (0.015 + Math.random() * 0.012) * (0.5 + radiusRatio * 0.5);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        return geometry;
    }, [totalParticles, spiralArms, rotations, armSpread, armThickness]);

    const dotTexture = useMemo(() => createCircleTexture(128), []);

    return (
        <points ref={pointsRef} geometry={spiralGeometry}>
            <pointsMaterial
                size={0.04}
                vertexColors
                transparent
                opacity={0.95}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                map={dotTexture}
                alphaTest={0.5}
            />
        </points>
    );
}

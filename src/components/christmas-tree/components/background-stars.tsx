"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function createCircleTexture(size = 100) {
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
    const dotTexture = useMemo(() => createCircleTexture(50), []);
    const pointsRef = useRef<THREE.Points>(null);
    const particleCount = 10000;

    const starGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const opacities = new Float32Array(particleCount);

        const maxRadius = 35;

        for (let i = 0; i < particleCount; i++) {
            const biasedRandom = Math.pow(Math.random(), 0.5);
            const radius = biasedRandom * maxRadius;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            let color = new THREE.Color(starColors[Math.floor(Math.random() * starColors.length)]);
            color = normalizeColor(color, 2.7 + Math.random() * 0.3);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            opacities[i] = 0.5 + Math.random() * 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        return geometry;
    }, [particleCount]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.getElapsedTime();
        pointsRef.current.rotation.y = time * 0.18;
    });

    return (
        <points ref={pointsRef} geometry={starGeometry}>
            <pointsMaterial
                size={0.07}
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

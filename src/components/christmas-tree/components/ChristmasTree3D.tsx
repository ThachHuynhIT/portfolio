'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';
import GroundRings from './ground-rings';

function createCircleTexture(size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.globalAlpha = 0;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 1;
        ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    return texture;
}

export default function ChristmasTree3D() {
    const dotTexture = useMemo(() => createCircleTexture(128), []);
    const groupRef = useRef<Group>(null);
    const trunkHeight = 0.8;
    const [treeColor, setTreeColor] = useState<'pink' | 'blue'>('pink');
    const [treeScale, setTreeScale] = useState(1);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth <= 768) {
                setTreeScale(0.65);
            } else {
                setTreeScale(1);
            }
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setTreeColor('blue'), 5000);
        return () => clearTimeout(timer);
    }, []);

    const getBranchColor = (type: 'tree' | 'trunk') => {
        if (treeColor === 'pink') {
            return [0.95, 0.5, 0.7];
        } else {
            return type === 'tree' ? [0.1, 0.7, 0.95] : [0.1, 0.7, 0.95];
        }
    };

    const trunkParticles = useMemo(() => {
        const particleCount = 60;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const [r, g, b] = getBranchColor('trunk');
        for (let i = 0; i < particleCount; i++) {
            const y = -0.4 + (i / (particleCount - 1)) * trunkHeight;
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.07 + Math.random() * 0.03;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
            sizes[i] = (0.07 + Math.random() * 0.03) / 2;
        }
        return { positions, colors, sizes, count: particleCount };
    }, [treeColor]);

    const treeParticles = useMemo(() => {
        const particleCount = 15000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        let index = 0;
        const totalHeight = 3.6;
        const baseRadius = 1.5;
        const layers = 12;
        const branchesPerLayer = 8;
        const [r, g, b] = getBranchColor('tree');

        let totalPossibleBranches = 0;
        for (let layer = 0; layer < layers; layer++) {
            const branchesInThisLayer = layer === layers - 1 ? Math.floor(branchesPerLayer / 2) : branchesPerLayer;
            totalPossibleBranches += branchesInThisLayer;
        }
        const avgParticlesPerBranch = particleCount / totalPossibleBranches;


        for (let layer = 0; layer < layers; layer++) {
            const layerHeight = (layer / layers) * totalHeight;
            const heightRatio = layer / layers;

            const maxRadiusAtLayer = baseRadius * (1 - heightRatio);
            const branchAngleUp = Math.PI * 0.08;
            const maxBranchLength = maxRadiusAtLayer / Math.cos(branchAngleUp);

            const branches = layer === layers - 1 ? Math.floor(branchesPerLayer / 2) : branchesPerLayer;
            for (let branch = 0; branch < branches; branch++) {
                const angleAroundTree = (branch / branches) * Math.PI * 2 + layer * 0.5;
                const branchHeightOffset = (Math.random() - 0.5) * 0.25;
                const branchStartHeight = layerHeight + branchHeightOffset;
                const branchAngleVariation = (Math.random() - 0.3) * Math.PI * 0.1;
                const lengthVariation = 0.9 + Math.random() * 0.1;
                const currentBranchLength = maxBranchLength * lengthVariation;

                const particlesPerBranch = Math.floor(avgParticlesPerBranch * (1 - heightRatio * 0.5));

                for (let i = 0; i < particlesPerBranch && index < particleCount; i++) {
                    const branchProgress = Math.pow(i / particlesPerBranch, 0.8);
                    const distance = branchProgress * currentBranchLength;
                    const branchThickness = (1 - branchProgress * 0.9) * 0.35;
                    const surfaceAngle = Math.random() * Math.PI * 2;
                    const surfaceRadius = branchThickness * (0.7 + Math.random() * 0.3);
                    const horizontalDistance = distance * Math.cos(branchAngleUp);
                    const verticalRise = distance * Math.sin(branchAngleUp);
                    const curveFactor = branchProgress * branchProgress * 0.1;
                    const branchDirX = Math.cos(angleAroundTree);
                    const branchDirZ = Math.sin(angleAroundTree);
                    const surfaceOffsetX = Math.cos(surfaceAngle) * surfaceRadius;
                    const surfaceOffsetY = Math.sin(surfaceAngle) * surfaceRadius * 0.5;

                    positions[index * 3] =
                        branchDirX * horizontalDistance +
                        surfaceOffsetX * Math.cos(angleAroundTree + Math.PI / 2) -
                        surfaceOffsetY * Math.sin(branchAngleUp) * branchDirX;
                    positions[index * 3 + 1] = branchStartHeight + verticalRise - curveFactor + surfaceOffsetY * Math.cos(branchAngleUp);
                    positions[index * 3 + 2] =
                        branchDirZ * horizontalDistance +
                        surfaceOffsetX * Math.sin(angleAroundTree + Math.PI / 2) -
                        surfaceOffsetY * Math.sin(branchAngleUp) * branchDirZ;

                    colors[index * 3] = r;
                    colors[index * 3 + 1] = g;
                    colors[index * 3 + 2] = b;

                    sizes[index] = ((Math.random() * 0.06 + 0.03) * (1 - branchProgress * 0.35)) / 2;
                    index++;
                }
            }
        }

        return { positions, colors, sizes, count: index };
    }, [treeColor]);

    const heartParticles = useMemo(() => {
        const particleCount = 1700;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const heartShape = (t: number, scale: number) => {
            const x = scale * 16 * Math.pow(Math.sin(t), 3);
            // Tăng hệ số của các thành phần cos(t) để kéo dài theo chiều y
            const y = scale * (16 * Math.cos(t) - 6 * Math.cos(2 * t) - 2.5 * Math.cos(3 * t) - 1.2 * Math.cos(4 * t)); // Đã điều chỉnh
            return { x, y };
        };

        let index = 0;
        const scale = 0.23; // Tăng scale tổng thể của trái tim để nó lớn hơn và có thể dài hơn

        for (let i = 0; i < particleCount / 2; i++) {
            const t = (i / (particleCount / 2)) * Math.PI * 2;
            const { x, y } = heartShape(t, scale);
            const noise = (Math.random() - 0.5) * 0.015;
            const angle = Math.random() * Math.PI * 2;
            positions[index * 3] = x / 16 + Math.cos(angle) * noise;
            positions[index * 3 + 1] = y / 16 + Math.sin(angle) * noise + 0.1;
            positions[index * 3 + 2] = (Math.random() - 0.5) * 0.04;
            const brightness = 0.7 + Math.random() * 0.1;
            const pinkFactor = Math.random();
            colors[index * 3] = brightness * (0.9 + pinkFactor * 0.1);
            colors[index * 3 + 1] = brightness * (0.7 + pinkFactor * 0.1);
            colors[index * 3 + 2] = brightness * (0.8 + pinkFactor * 0.1);
            sizes[index] = (Math.random() * 0.025 + 0.012) / 2;
            index++;
        }

        for (let i = 0; i < particleCount / 2; i++) {
            const t = Math.random() * Math.PI * 2;
            const innerScale = scale * (0.4 + Math.random() * 0.6);
            const { x, y } = heartShape(t, innerScale);
            positions[index * 3] = x / 16;
            positions[index * 3 + 1] = y / 16 + 0.1;
            positions[index * 3 + 2] = (Math.random() - 0.5) * 0.03;
            const brightness = 0.6 + Math.random() * 0.4;
            colors[index * 3] = brightness * (0.95 + Math.random() * 0.05);
            colors[index * 3 + 1] = brightness * (0.4 + Math.random() * 0.2);
            colors[index * 3 + 2] = brightness * (0.6 + Math.random() * 0.2);
            sizes[index] = (Math.random() * 0.018 + 0.009) / 2;
            index++;
        }
        return { positions, colors, sizes };
    }, []);

    const trunkGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(trunkParticles.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(trunkParticles.colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(trunkParticles.sizes, 1));
        return geometry;
    }, [trunkParticles]);

    const treeGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(treeParticles.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(treeParticles.colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(treeParticles.sizes, 1));
        return geometry;
    }, [treeParticles]);

    const heartGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(heartParticles.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(heartParticles.colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(heartParticles.sizes, 1));
        return geometry;
    }, [heartParticles]);

    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    });

    const treeHeight = 3.6;

    return (
        <group ref={groupRef} scale={[treeScale, treeScale, treeScale]}>
            <GroundRings />
            <points position={[0, 0, 0]} geometry={trunkGeometry}>
                <pointsMaterial
                    size={0.04}
                    vertexColors
                    transparent
                    opacity={0.85}
                    sizeAttenuation
                    blending={THREE.NormalBlending}
                    depthWrite={false}
                    map={dotTexture}
                    alphaTest={0.5}
                />
            </points>
            <points position={[0, 0, 0]} geometry={treeGeometry}>
                <pointsMaterial
                    size={0.025}
                    vertexColors
                    transparent
                    opacity={0.75}
                    sizeAttenuation
                    blending={THREE.NormalBlending}
                    depthWrite={false}
                    map={dotTexture}
                    alphaTest={0.5}
                />
            </points>
            <points position={[0, treeHeight + 0.1, 0]} geometry={heartGeometry}>
                <pointsMaterial
                    size={0.013}
                    vertexColors
                    transparent
                    opacity={0.85}
                    sizeAttenuation
                    blending={THREE.NormalBlending}
                    depthWrite={false}
                    map={dotTexture}
                    alphaTest={0.5}
                />
            </points>
            <pointLight position={[0, treeHeight + 0.1, 0]} intensity={0.5} color="#ff69b4" distance={1.5} />
            <pointLight position={[0.1, treeHeight + 0.15, 0]} intensity={0.25} color="#ffffff" distance={1} />
            <pointLight position={[-0.1, treeHeight + 0.05, 0]} intensity={0.25} color="#ff1493" distance={1} />
        </group>
    );
}

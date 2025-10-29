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

type Props = {
    treeColor: string;
    appearDuration?: number; // s
    appearDelay?: number;    // s
    heartDelayOffset?: number; // s
};

export default function ChristmasTree3D({
    treeColor,
    appearDuration = 1.4,
    appearDelay = 0,
    heartDelayOffset = 0.2,
}: Props) {
    const dotTexture = useMemo(() => createCircleTexture(128), []);
    const groupRef = useRef<Group>(null);
    const heartRef = useRef<THREE.Points>(null);

    const trunkMatRef = useRef<THREE.PointsMaterial>(null);
    const treeMatRef = useRef<THREE.PointsMaterial>(null);
    const heartMatRef = useRef<THREE.PointsMaterial>(null);

    const trunkGeoRef = useRef<THREE.BufferGeometry>(null);
    const treeGeoRef = useRef<THREE.BufferGeometry>(null);
    const heartGeoRef = useRef<THREE.BufferGeometry>(null);

    const trunkHeight = 0.8;
    const treeHeight = 3.6;

    const [treeScale, setTreeScale] = useState(1);

    const TREE_ROTATE_SPEED = 0.10;
    const HEART_Z_SPIN = 1.3;

    useEffect(() => {
        function handleResize() {
            setTreeScale(window.innerWidth <= 768 ? 0.65 : 1);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getBranchColor = () => {
        return treeColor === 'pink' ? [0.95, 0.5, 0.7] : [0.1, 0.7, 0.95];
    };

    const trunkParticles = useMemo(() => {
        const particleCount = 60;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const [r, g, b] = getBranchColor();

        for (let i = 0; i < particleCount; i++) {
            const y = -0.4 + (i / (particleCount - 1)) * trunkHeight;
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.07 + Math.random() * 0.03;
            positions[i * 3 + 0] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            colors[i * 3 + 0] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            sizes[i] = (0.07 + Math.random() * 0.03) / 2;
        }

        return { positions, colors, sizes, count: particleCount };
    }, [treeColor, getBranchColor]);

    // Tree
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
        const [r, g, b] = getBranchColor();

        let totalPossibleBranches = 0;
        for (let layer = 0; layer < layers; layer++) {
            const branchesInThisLayer = layer === layers - 1 ? Math.floor(branchesPerLayer / 2) : branchesPerLayer;
            totalPossibleBranches += branchesInThisLayer;
        }
        const avgParticlesPerBranch = particleCount / totalPossibleBranches;

        for (let layer = 0; layer < layers; layer++) {
            const layerHeight = (layer / layers) * totalHeight;
            const heightRatio = layer / layers;

            const branchAngleUp = Math.PI * 0.08;
            const maxRadiusAtLayer = baseRadius * (1 - heightRatio);
            const maxBranchLength = maxRadiusAtLayer / Math.cos(branchAngleUp);

            const branches = layer === layers - 1 ? Math.floor(branchesPerLayer / 2) : branchesPerLayer;
            for (let branch = 0; branch < branches; branch++) {
                const angleAroundTree = (branch / branches) * Math.PI * 2 + layer * 0.5;
                const branchHeightOffset = (Math.random() - 0.5) * 0.25;
                const branchStartHeight = layerHeight + branchHeightOffset;
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

                    positions[index * 3 + 0] =
                        branchDirX * horizontalDistance +
                        surfaceOffsetX * Math.cos(angleAroundTree + Math.PI / 2) -
                        surfaceOffsetY * Math.sin(branchAngleUp) * branchDirX;

                    positions[index * 3 + 1] =
                        branchStartHeight + verticalRise - curveFactor +
                        surfaceOffsetY * Math.cos(branchAngleUp);

                    positions[index * 3 + 2] =
                        branchDirZ * horizontalDistance +
                        surfaceOffsetX * Math.sin(angleAroundTree + Math.PI / 2) -
                        surfaceOffsetY * Math.sin(branchAngleUp) * branchDirZ;

                    colors[index * 3 + 0] = r;
                    colors[index * 3 + 1] = g;
                    colors[index * 3 + 2] = b;

                    sizes[index] =
                        ((Math.random() * 0.06 + 0.03) * (1 - branchProgress * 0.35)) / 2;

                    index++;
                }
            }
        }

        return { positions, colors, sizes, count: index };
    }, [treeColor, getBranchColor]);

    // Heart
    const heartParticles = useMemo(() => {
        const targetDots = 1200;
        const positions = new Float32Array(targetDots * 3);
        const colors = new Float32Array(targetDots * 3);
        const sizes = new Float32Array(targetDots);
        const [r, g, b] = getBranchColor();

        const heartScale = 0.1;
        const R = 2;

        const F = (x: number, y: number, z: number) => {
            const a = x * x + (9 / 4) * y * y + z * z - 1;
            return a * a * a - x * x * z * z * z - (9 / 80) * y * y * z * z * z;
        };

        const grad = (x: number, y: number, z: number) => {
            const h = 1e-3;
            const fx = (F(x + h, y, z) - F(x - h, y, z)) / (2 * h);
            const fy = (F(x, y + h, z) - F(x, y - h, z)) / (2 * h);
            const fz = (F(x, y, z + h) - F(x, y, z - h)) / (2 * h);
            return new THREE.Vector3(fx, fy, fz);
        };

        const hitOnRay = (dir: THREE.Vector3): THREE.Vector3 | null => {
            const steps = 100;
            let t0 = -R, f0 = F(dir.x * t0, dir.y * t0, dir.z * t0);
            for (let i = 1; i <= steps; i++) {
                const t1 = -R + (2 * R * i) / steps;
                const f1 = F(dir.x * t1, dir.y * t1, dir.z * t1);
                if (f0 === 0) return new THREE.Vector3(dir.x * t0, dir.y * t0, dir.z * t0);
                if (f0 * f1 < 0) {
                    let a = t0, b = t1;
                    for (let it = 0; it < 20; it++) {
                        const m = 0.5 * (a + b);
                        const fm = F(dir.x * m, dir.y * m, dir.z * m);
                        if (fm === 0) { a = b = m; break; }
                        if (f0 * fm < 0) b = m; else { a = m; f0 = fm; }
                    }
                    let t = 0.5 * (a + b);
                    for (let it = 0; it < 2; it++) {
                        const p = new THREE.Vector3(dir.x * t, dir.y * t, dir.z * t);
                        const g = grad(p.x, p.y, p.z);
                        const dfdt = g.dot(dir);
                        const ft = F(p.x, p.y, p.z);
                        if (Math.abs(dfdt) < 1e-6) break;
                        t = t - ft / dfdt;
                    }
                    return new THREE.Vector3(dir.x * t, dir.y * t, dir.z * t);
                }
                t0 = t1; f0 = f1;
            }
            return null;
        };

        let count = 0;
        const N = Math.round(targetDots * 1);
        const jitter = 0.006;

        for (let i = 0; i < N && count < targetDots; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / N);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const dir = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
            ).normalize();

            const p = hitOnRay(dir);
            if (!p) continue;

            // jitter tiếp tuyến nhẹ
            const t1 = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
            const tangent1 =
                t1.length() < 1e-6
                    ? new THREE.Vector3(1, 0, 0).cross(dir).normalize()
                    : t1.normalize();
            const tangent2 = new THREE.Vector3().crossVectors(dir, tangent1).normalize();

            const u = (Math.random() * 2 - 1) * jitter;
            const v = (Math.random() * 2 - 1) * jitter;
            p.addScaledVector(tangent1, u).addScaledVector(tangent2, v);

            positions[count * 3 + 0] = p.x * heartScale;
            positions[count * 3 + 1] = p.y * heartScale;
            positions[count * 3 + 2] = p.z * heartScale;

            const brightness = 0.8 + Math.random() * 0.2;
            colors[count * 3 + 0] = r * brightness;
            colors[count * 3 + 1] = g * brightness;
            colors[count * 3 + 2] = b * brightness;

            sizes[count] = 0.85;
            count++;
        }

        return {
            positions: count === targetDots ? positions : positions.slice(0, count * 3),
            colors: count === targetDots ? colors : colors.slice(0, count * 3),
            sizes: count === targetDots ? sizes : sizes.slice(0, count),
            count,
        };
    }, [treeColor, getBranchColor]);

    // Geometries
    const trunkGeometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(trunkParticles.positions, 3));
        g.setAttribute('color', new THREE.BufferAttribute(trunkParticles.colors, 3));
        g.setAttribute('size', new THREE.BufferAttribute(trunkParticles.sizes, 1));
        g.setDrawRange(0, 0);
        return g;
    }, [trunkParticles]);

    const treeGeometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(treeParticles.positions, 3));
        g.setAttribute('color', new THREE.BufferAttribute(treeParticles.colors, 3));
        g.setAttribute('size', new THREE.BufferAttribute(treeParticles.sizes, 1));
        g.setDrawRange(0, 0);
        return g;
    }, [treeParticles]);

    const heartGeometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(heartParticles.positions, 3));
        g.setAttribute('color', new THREE.BufferAttribute(heartParticles.colors, 3));
        g.setAttribute('size', new THREE.BufferAttribute(heartParticles.sizes, 1));
        g.setDrawRange(0, 0);
        return g;
    }, [heartParticles]);

    const startRef = useRef<number | null>(null);

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (startRef.current == null) startRef.current = t;
        const elapsed = t - startRef.current;

        const raw = Math.max(0, Math.min(1, (elapsed - appearDelay) / appearDuration));
        const k = easeOutCubic(raw);

        const rawHeart = Math.max(0, Math.min(1, (elapsed - (appearDelay + heartDelayOffset)) / appearDuration));
        const kHeart = easeOutCubic(rawHeart);

        if (groupRef.current) {
            groupRef.current.scale.setScalar(treeScale);
            groupRef.current.rotation.y = t * TREE_ROTATE_SPEED;
        }

        if (heartRef.current) {
            heartRef.current.rotation.z = t * HEART_Z_SPIN;
        }

        if (trunkMatRef.current) trunkMatRef.current.opacity = 0.85 * k;
        if (treeMatRef.current) treeMatRef.current.opacity = 0.75 * k;
        if (heartMatRef.current) heartMatRef.current.opacity = 0.85 * kHeart;

        if (trunkGeoRef.current) {
            const total = trunkParticles.count;
            trunkGeoRef.current.setDrawRange(0, Math.max(1, Math.floor(total * k)));
        }
        if (treeGeoRef.current) {
            const total = treeParticles.count;
            treeGeoRef.current.setDrawRange(0, Math.max(1, Math.floor(total * k)));
        }
        if (heartGeoRef.current) {
            const total = heartParticles.count;
            heartGeoRef.current.setDrawRange(0, Math.max(1, Math.floor(total * kHeart)));
        }
    });

    return (
        <group ref={groupRef}>
            <GroundRings />
            <points
                geometry={trunkGeometry}
                ref={(p) => { if (p) trunkGeoRef.current = p.geometry as THREE.BufferGeometry; }}
            >
                <pointsMaterial
                    ref={trunkMatRef}
                    size={0.04}
                    vertexColors
                    transparent
                    opacity={0}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    map={dotTexture}
                    alphaTest={0.5}
                />
            </points>

            <points
                geometry={treeGeometry}
                ref={(p) => { if (p) treeGeoRef.current = p.geometry as THREE.BufferGeometry; }}
            >
                <pointsMaterial
                    ref={treeMatRef}
                    size={0.025}
                    vertexColors
                    transparent
                    opacity={0}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    map={dotTexture}
                    alphaTest={0.5}
                />
            </points>

            <points
                position={[0, treeHeight + 0.1, 0]}
                geometry={heartGeometry}
                rotation={[Math.PI / 2, Math.PI, 0]}
                ref={(p) => {
                    heartRef.current = p ?? null as any; // gắn ref cho tim
                    if (p) heartGeoRef.current = p.geometry as THREE.BufferGeometry;
                }}
            >
                <pointsMaterial
                    ref={heartMatRef}
                    size={0.013}
                    vertexColors
                    transparent
                    opacity={0}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
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

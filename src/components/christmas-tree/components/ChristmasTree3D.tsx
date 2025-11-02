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

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type Props = {
    treeColor: string;
    appearDuration?: number;
    appearDelay?: number;
};

export default function ChristmasTree3D({
    treeColor,
    appearDuration = 1.6,
    appearDelay = 0,
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

    const TREE_ROTATE_SPEED = 0.1;
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
        const c = new THREE.Color(treeColor);
        return [c.r, c.g, c.b];
    };

    //
    // 1) TRUNK – đã sort theo y
    //
    const trunkData = useMemo(() => {
        const particleCount = 80; // + một chút để mịn hơn
        const [r, g, b] = getBranchColor();
        const tmp: {
            x: number;
            y: number;
            z: number;
            r: number;
            g: number;
            b: number;
            size: number;
        }[] = [];

        for (let i = 0; i < particleCount; i++) {
            const y = -0.4 + (i / (particleCount - 1)) * trunkHeight;
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.07 + Math.random() * 0.03;
            tmp.push({
                x: Math.cos(angle) * radius,
                y,
                z: Math.sin(angle) * radius,
                r,
                g,
                b,
                size: (0.07 + Math.random() * 0.03) / 2,
            });
        }

        // phần chân thân cây: bơm thêm 1 vòng quanh y rất thấp để không bị pop
        const EXTRA_BASE = 40;
        for (let i = 0; i < EXTRA_BASE; i++) {
            const angle = (i / EXTRA_BASE) * Math.PI * 2;
            const radius = 0.1 + Math.random() * 0.04;
            tmp.push({
                x: Math.cos(angle) * radius,
                y: -0.45 + Math.random() * 0.05,
                z: Math.sin(angle) * radius,
                r,
                g,
                b,
                size: 0.035,
            });
        }

        tmp.sort((a, b) => a.y - b.y);

        const finalCount = tmp.length;
        const positions = new Float32Array(finalCount * 3);
        const colors = new Float32Array(finalCount * 3);
        const sizes = new Float32Array(finalCount);

        tmp.forEach((p, idx) => {
            positions[idx * 3 + 0] = p.x;
            positions[idx * 3 + 1] = p.y;
            positions[idx * 3 + 2] = p.z;
            colors[idx * 3 + 0] = p.r;
            colors[idx * 3 + 1] = p.g;
            colors[idx * 3 + 2] = p.b;
            sizes[idx] = p.size;
        });

        return { positions, colors, sizes, count: finalCount };
    }, [treeColor]);

    //
    // 2) TREE – main + lớp dày ở chân
    //
    const treeData = useMemo(() => {
        const MAX_PARTICLES = 15000;
        const [r, g, b] = getBranchColor();

        const totalHeight = 3.6;
        const baseRadius = 1.5;
        const layers = 12;
        const branchesPerLayer = 8;

        // tạm chứa hết
        const tmp: {
            x: number;
            y: number;
            z: number;
            r: number;
            g: number;
            b: number;
            size: number;
        }[] = [];

        // 2.1) Thêm "lớp chân cây" thật dày để chống pop
        // Lớp này cực thấp, bán kính to → để khi drawRange = 0.01 vẫn chỉ thấy 1 lớp sương ở dưới
        const BASE_DENSE_COUNT = 2200;
        for (let i = 0; i < BASE_DENSE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const rad = 0.25 + Math.random() * 0.35; // loe ra
            const y = -0.25 + Math.random() * 0.25; // rất thấp
            tmp.push({
                x: Math.cos(angle) * rad,
                y,
                z: Math.sin(angle) * rad,
                r,
                g,
                b,
                size: 0.022 + Math.random() * 0.012,
            });
        }

        // 2.2) Phần thân cây như trước
        let totalPossibleBranches = 0;
        for (let layer = 0; layer < layers; layer++) {
            const branchesInThisLayer = layer === layers - 1 ? Math.floor(branchesPerLayer / 2) : branchesPerLayer;
            totalPossibleBranches += branchesInThisLayer;
        }
        const avgParticlesPerBranch = (MAX_PARTICLES - BASE_DENSE_COUNT) / totalPossibleBranches;

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

                for (let i = 0; i < particlesPerBranch; i++) {
                    const branchProgress = Math.pow(i / particlesPerBranch, 0.8);
                    const distance = branchProgress * currentBranchLength;
                    const branchThickness = (1 - branchProgress * 0.9) * 0.35;
                    const surfaceAngle = Math.random() * Math.PI * 2;
                    const surfaceRadius = branchThickness * (0.7 + Math.random() * 0.3);

                    const branchDirX = Math.cos(angleAroundTree);
                    const branchDirZ = Math.sin(angleAroundTree);
                    const horizontalDistance = distance * Math.cos(branchAngleUp);
                    const verticalRise = distance * Math.sin(branchAngleUp);
                    const curveFactor = branchProgress * branchProgress * 0.1;
                    const surfaceOffsetX = Math.cos(surfaceAngle) * surfaceRadius;
                    const surfaceOffsetY = Math.sin(surfaceAngle) * surfaceRadius * 0.5;

                    const x =
                        branchDirX * horizontalDistance +
                        surfaceOffsetX * Math.cos(angleAroundTree + Math.PI / 2) -
                        surfaceOffsetY * Math.sin(branchAngleUp) * branchDirX;

                    const y =
                        branchStartHeight +
                        verticalRise -
                        curveFactor +
                        surfaceOffsetY * Math.cos(branchAngleUp);

                    const z =
                        branchDirZ * horizontalDistance +
                        surfaceOffsetX * Math.sin(angleAroundTree + Math.PI / 2) -
                        surfaceOffsetY * Math.sin(branchAngleUp) * branchDirZ;

                    tmp.push({
                        x,
                        y,
                        z,
                        r,
                        g,
                        b,
                        size: ((Math.random() * 0.06 + 0.03) * (1 - branchProgress * 0.35)) / 2,
                    });
                }
            }
        }

        // sort theo y để vẽ từ dưới lên
        tmp.sort((a, b) => a.y - b.y);

        // cắt bớt nếu dư
        const finalCount = Math.min(tmp.length, MAX_PARTICLES);
        const positions = new Float32Array(finalCount * 3);
        const colors = new Float32Array(finalCount * 3);
        const sizes = new Float32Array(finalCount);

        for (let i = 0; i < finalCount; i++) {
            const p = tmp[i];
            positions[i * 3 + 0] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
            colors[i * 3 + 0] = p.r;
            colors[i * 3 + 1] = p.g;
            colors[i * 3 + 2] = p.b;
            sizes[i] = p.size;
        }

        return { positions, colors, sizes, count: finalCount };
    }, [treeColor]);

    //
    // 3) HEART – giữ nguyên
    //
    const heartData = useMemo(() => {
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
            let t0 = -R,
                f0 = F(dir.x * t0, dir.y * t0, dir.z * t0);
            for (let i = 1; i <= steps; i++) {
                const t1 = -R + (2 * R * i) / steps;
                const f1 = F(dir.x * t1, dir.y * t1, dir.z * t1);
                if (f0 === 0) return new THREE.Vector3(dir.x * t0, dir.y * t0, dir.z * t0);
                if (f0 * f1 < 0) {
                    let a = t0,
                        b = t1;
                    for (let it = 0; it < 20; it++) {
                        const m = 0.5 * (a + b);
                        const fm = F(dir.x * m, dir.y * m, dir.z * m);
                        if (fm === 0) {
                            a = b = m;
                            break;
                        }
                        if (f0 * fm < 0) b = m;
                        else {
                            a = m;
                            f0 = fm;
                        }
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
                t0 = t1;
                f0 = f1;
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
                Math.sin(phi) * Math.sin(theta),
            ).normalize();

            const p = hitOnRay(dir);
            if (!p) continue;

            const t1 = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
            const tangent1 = t1.length() < 1e-6 ? new THREE.Vector3(1, 0, 0).cross(dir).normalize() : t1.normalize();
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
        g.setAttribute('position', new THREE.BufferAttribute(trunkData.positions, 3));
        g.setAttribute('color', new THREE.BufferAttribute(trunkData.colors, 3));
        g.setAttribute('size', new THREE.BufferAttribute(trunkData.sizes, 1));
        g.setDrawRange(0, 0);
        return g;
    }, [trunkData]);

    const treeGeometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(treeData.positions, 3));
        g.setAttribute('color', new THREE.BufferAttribute(treeData.colors, 3));
        g.setAttribute('size', new THREE.BufferAttribute(treeData.sizes, 1));
        g.setDrawRange(0, 0);
        return g;
    }, [treeData]);

    const heartGeometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(heartData.positions, 3));
        g.setAttribute('color', new THREE.BufferAttribute(heartData.colors, 3));
        g.setAttribute('size', new THREE.BufferAttribute(heartData.sizes, 1));
        g.setDrawRange(0, 0);
        return g;
    }, [heartData]);

    // timeline mới
    const startRef = useRef<number | null>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (startRef.current == null) startRef.current = t;
        const elapsed = t - startRef.current;

        const globalProgress = clamp01((elapsed - appearDelay) / appearDuration);

        // thân cây: xuất hiện sớm và dài
        const treeProgress = easeOutCubic(globalProgress);
        // thân dưới (trunk): sớm hơn tí
        const trunkProgress = easeOutCubic(Math.min(1, globalProgress * 1.3));
        // tim xuất hiện trễ
        const heartProgress = easeOutCubic(Math.max(0, (globalProgress - 0.4) / 0.6));

        if (groupRef.current) {
            groupRef.current.scale.setScalar(treeScale);
            groupRef.current.rotation.y = t * TREE_ROTATE_SPEED;
        }

        if (heartRef.current) {
            heartRef.current.rotation.z = t * HEART_Z_SPIN;
        }

        if (trunkMatRef.current) trunkMatRef.current.opacity = 0.85 * trunkProgress;
        if (treeMatRef.current) treeMatRef.current.opacity = 0.75 * treeProgress;
        if (heartMatRef.current) heartMatRef.current.opacity = 0.9 * heartProgress;

        if (trunkGeoRef.current) {
            const total = trunkData.count;
            trunkGeoRef.current.setDrawRange(0, Math.max(1, Math.floor(total * trunkProgress)));
        }

        if (treeGeoRef.current) {
            const total = treeData.count;
            treeGeoRef.current.setDrawRange(0, Math.max(1, Math.floor(total * treeProgress)));
        }

        if (heartGeoRef.current) {
            const total = heartData.count;
            heartGeoRef.current.setDrawRange(0, Math.max(1, Math.floor(total * heartProgress)));
        }
    });

    return (
        <group ref={groupRef}>
            <GroundRings />

            {/* TRUNK */}
            <points
                geometry={trunkGeometry}
                ref={(p) => {
                    if (p) trunkGeoRef.current = p.geometry as THREE.BufferGeometry;
                }}
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

            {/* TREE */}
            <points
                geometry={treeGeometry}
                ref={(p) => {
                    if (p) treeGeoRef.current = p.geometry as THREE.BufferGeometry;
                }}
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

            {/* HEART */}
            <points
                position={[0, treeHeight + 0.1, 0]}
                geometry={heartGeometry}
                rotation={[Math.PI / 2, Math.PI, 0]}
                ref={(p) => {
                    heartRef.current = (p ?? null) as any;
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

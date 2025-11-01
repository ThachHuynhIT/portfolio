'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, InstancedMesh, Mesh } from 'three';
import * as THREE from 'three';
import { svgPath } from '../constant';

type Props = {
    colorHex?: string;
    height?: number;
    baseRadius?: number;
    turns?: number;
    tubeRadius?: number;

    // Dots
    particles?: number;
    dotsBoost?: number;

    // Streaks & Lightning
    streaks?: number;
    sparks?: number;

    // Common FX
    rotateSpeed?: number;
    appearDuration?: number;
    scale?: number;
    streakAmp?: number;
    streakSpeed?: number; // legacy compat
    streakTrail?: number; // legacy compat

    // Flash → vanish
    waitBeforeFade?: number;
    fadeFlashDuration?: number;
    onGone?: () => void;
    fadeTrigger?: number;

    // Snow
    snowCount?: number;
    snowSpeedMultiplier?: number;
    snowWindMultiplier?: number;

    // Snow visuals
    snowSizeMin?: number;
    snowSizeMax?: number;
    snowAngularSpeedMul?: number;

    // View
    treeYOffset?: number;

    // Explosion
    explodeDuration?: number;
    explodePower?: number;
    explodeDrag?: number;
};

function createCircleTexture(size = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const r = size / 2 - 2;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.format = THREE.RGBAFormat;
    return t;
}

function createSnowflakeTextureFromSVG(size = 256, fill = '#fff', brightness = 0.7) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    const scale = size / 900;
    ctx.scale(scale, scale);
    ctx.translate(-256, -256);
    const path = new Path2D(svgPath);
    ctx.fillStyle = fill;
    ctx.fill(path);

    // Reduce brightness by multiplying RGB channels
    if (brightness >= 0 && brightness < 1) {
        try {
            const img = ctx.getImageData(0, 0, size, size);
            const d = img.data;
            for (let i = 0; i < d.length; i += 4) {
                d[i] = Math.round(d[i] * brightness); // R
                d[i + 1] = Math.round(d[i + 1] * brightness); // G
                d[i + 2] = Math.round(d[i + 2] * brightness); // B
                // keep alpha unchanged
            }
            ctx.putImageData(img, 0, 0);
        } catch (e) {
            // getImageData can throw if canvas is tainted; fallback to reduced global alpha
            ctx.globalAlpha = Math.min(1, Math.max(0, brightness));
            ctx.clearRect(0, 0, size, size);
            ctx.translate(size / 2, size / 2);
            ctx.scale(scale, scale);
            ctx.translate(-256, -256);
            ctx.fillStyle = fill;
            ctx.fill(path);
        }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    return tex;
}

class TaperHelixCurve extends THREE.Curve<THREE.Vector3> {
    constructor(
        public height: number,
        public baseRadius: number,
        public turns: number,
        public phase = 0,
    ) {
        super();
    }
    getPoint(t: number, target = new THREE.Vector3()) {
        const y = t * this.height;
        const taper = 1 - t;
        const radius = this.baseRadius * Math.pow(taper, 0.92);
        const angle = this.turns * Math.PI * 2 * t + this.phase;
        return target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    }
}
function getFrame(tangent: THREE.Vector3, outN: THREE.Vector3, outB: THREE.Vector3) {
    const up = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    outN.copy(up).cross(tangent).normalize();
    outB.copy(tangent).cross(outN).normalize();
}

export default function DoubleSpiralTree3D({
    colorHex = '#6ec8ff',
    height = 3.6,
    baseRadius = 1.6,
    turns = 6,
    tubeRadius = 0.032,
    particles = 6000,
    dotsBoost = 6.9,
    streaks = 2,
    sparks = 4,
    rotateSpeed = 0.1,
    appearDuration = 2.2,
    scale = 1,
    streakAmp = 1.0,
    waitBeforeFade = 0.0,
    fadeFlashDuration = 0.8,
    onGone,
    fadeTrigger = 0,
    snowCount = 900,
    snowSpeedMultiplier = 2.5,
    snowWindMultiplier = 2.0,
    snowSizeMin = 0.12,
    snowSizeMax = 0.48,
    snowAngularSpeedMul = 1.0,
    treeYOffset = -0.6,
    explodeDuration = 0.9,
    explodePower = 18,
    explodeDrag = 0.85,
}: Props) {
    const groupRef = useRef<Group>(null);
    const starRef = useRef<Mesh>(null);
    const calledGoneRef = useRef(false);
    const { size } = useThree();
    const isMobile = size.width <= 640;
    const STATIC_LIGHTNING = isMobile;
    const STREAKS_N = streaks;
    const SPARKS_N = sparks;
    const L_SEGS = 240;
    const L_SPAN_START = 0.0;
    const L_SPAN_END = 1.0;
    const L_AMP_MUL = 1.0;
    // Tỷ lệ phóng to cho LIGHTNING — tăng để làm "to" hơn
    const LIGHTNING_SCALE = 1.4;
    const curveA = useMemo(() => new TaperHelixCurve(height, baseRadius, turns, 0), [height, baseRadius, turns]);
    const curveB = useMemo(() => new TaperHelixCurve(height, baseRadius, turns, Math.PI), [height, baseRadius, turns]);
    const color = useMemo(() => new THREE.Color(colorHex), [colorHex]);
    const dotTex = useMemo(createCircleTexture, []);
    const snowTex = useMemo(() => createSnowflakeTextureFromSVG(256, '#fff'), []);
    type P = { u: number; r: number; om: number; ph: number; h: number; which: 0 | 1 };

    const N = useMemo(() => Math.floor(particles * dotsBoost), [particles, dotsBoost]);
    const pParams = useMemo(() => {
        const arr: P[] = [];
        for (let i = 0; i < N; i++) {
            arr.push({
                which: (i % 2) as 0 | 1,
                u: Math.random(),
                r: 1.5 * THREE.MathUtils.lerp(tubeRadius * 0.45, tubeRadius * 1.2, Math.random()),
                om: THREE.MathUtils.lerp(0.7, 1.8, Math.random()) * (Math.random() < 0.5 ? -1 : 1),
                ph: Math.random() * Math.PI * 2,
                h: THREE.MathUtils.lerp(-0.2, 0.2, Math.random()),
            });
        }
        return arr;
    }, [N, tubeRadius]);

    const pOrder = useMemo(() => {
        const aIdx = pParams
            .map((_, i) => i)
            .filter((i) => pParams[i].which === 0)
            .sort((i, j) => pParams[i].u - pParams[j].u);
        const bIdx = pParams
            .map((_, i) => i)
            .filter((i) => pParams[i].which === 1)
            .sort((i, j) => pParams[i].u - pParams[j].u);
        const order: number[] = [];
        let ia = 0,
            ib = 0;
        while (ia < aIdx.length || ib < bIdx.length) {
            if (ia >= aIdx.length) {
                order.push(bIdx[ib++]);
                continue;
            }
            if (ib >= bIdx.length) {
                order.push(aIdx[ia++]);
                continue;
            }
            const ua = pParams[aIdx[ia]].u;
            const ub = pParams[bIdx[ib]].u;
            if (ua <= ub) order.push(aIdx[ia++]);
            else order.push(bIdx[ib++]);
        }
        return order;
    }, [pParams]);

    const pPos = useMemo(() => new Float32Array(N * 3), [N]);
    const pCol = useMemo(() => {
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const src = pParams[pOrder[i]];
            const t = src.u;
            const taper = 1 - t;
            const c = color.clone().multiplyScalar(0.95 + 0.25 * taper + Math.random() * 0.05);
            a[i * 3 + 0] = c.r;
            a[i * 3 + 1] = c.g;
            a[i * 3 + 2] = c.b;
        }
        return a;
    }, [N, pParams, pOrder, color]);
    const pSize = useMemo(() => {
        const s = new Float32Array(N);
        for (let i = 0; i < N; i++) s[i] = THREE.MathUtils.lerp(0.018, 0.032, Math.random());
        return s;
    }, [N]);

    const pOutDir = useMemo(() => new Float32Array(N * 3), [N]);
    const pVel = useMemo(() => new Float32Array(N * 3), [N]);

    const pGeoRef = useRef<THREE.BufferGeometry>(null);
    const pMatRef = useRef<THREE.PointsMaterial>(null);

    const center = new THREE.Vector3(),
        tangent = new THREE.Vector3(),
        normal = new THREE.Vector3(),
        binormal = new THREE.Vector3(),
        tmp = new THREE.Vector3();

    // ======= MAIN STREAKS =======
    const streakObjs = useMemo(() => {
        const arr: { line: THREE.Line; geo: THREE.BufferGeometry; mat: THREE.LineBasicMaterial }[] = [];
        const seg = L_SEGS;
        for (let k = 0; k < STREAKS_N; k++) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg * 3), 3));
            geo.drawRange.count = 0;
            const mat = new THREE.LineBasicMaterial({
                color: color.clone().multiplyScalar(1.6),
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const line = new THREE.Line(geo, mat);
            line.frustumCulled = false;
            arr.push({ line, geo, mat });
        }
        return arr;
    }, [STREAKS_N, color, L_SEGS]);

    // ======= LIGHTNING =======

    const lightningBoltObjs = useMemo(() => {
        const arr: {
            line: THREE.Line;
            geo: THREE.BufferGeometry;
            mat: THREE.LineBasicMaterial;
            initialJitter: { x: number; y: number; z: number }[];
            curN: Float32Array;
            curB: Float32Array;
            velN: Float32Array;
            velB: Float32Array;
            tgtN: Float32Array;
            tgtB: Float32Array;
            nextT: Float32Array;
            freq: Float32Array;
            seed: Float32Array;
        }[] = [];

        const seg = L_SEGS;
        for (let k = 0; k < SPARKS_N; k++) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg * 3), 3));
            geo.drawRange.count = 0;

            const mat = new THREE.LineBasicMaterial({
                color: color.clone().multiplyScalar(1.35),
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });

            const initialJitter: { x: number; y: number; z: number }[] = [];
            const arrPos = (geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
            const curve = k % 2 === 0 ? curveA : curveB;
            const offset_dir = k < SPARKS_N / 2 ? 1.0 : -1.0;
            const k_phase = (k * Math.PI * 2.0) / Math.max(1, SPARKS_N);

            for (let i = 0; i < seg; i++) {
                const localT = i / (seg - 1);
                const t = L_SPAN_START + (L_SPAN_END - L_SPAN_START) * localT;

                curve.getPointAt(t, center);
                curve.getTangentAt(t, tangent).normalize();
                getFrame(tangent, normal, binormal);

                // const nJ_initial = (Math.random() - 0.5) * streakAmp * tubeRadius * 3.0 * L_AMP_MUL;
                // const bJ_initial = (Math.random() - 0.5) * streakAmp * tubeRadius * 3.0 * L_AMP_MUL;
                // nhân thêm LIGHTNING_SCALE để tăng phạm vi/ngẫu nhiên của bolt
                const nJ_initial = (Math.random() - 0.5) * streakAmp * tubeRadius * 3.0 * L_AMP_MUL * LIGHTNING_SCALE;
                const bJ_initial = (Math.random() - 0.5) * streakAmp * tubeRadius * 3.0 * L_AMP_MUL * LIGHTNING_SCALE;
                initialJitter.push({ x: nJ_initial, y: bJ_initial, z: 0 });

                initialJitter.push({ x: nJ_initial, y: bJ_initial, z: 0 });

                // const baseOffset = offset_dir * tubeRadius * (2.2 + 1.2 * Math.sin(t * 5.0 + k_phase)) * L_AMP_MUL;
                // tăng baseOffset theo LIGHTNING_SCALE để mở rộng phạm vi bolt
                const baseOffset = offset_dir * tubeRadius * (2.2 + 1.2 * Math.sin(t * 5.0 + k_phase)) * L_AMP_MUL * LIGHTNING_SCALE;
                const p = tmp
                    .copy(center)
                    .addScaledVector(normal, baseOffset + nJ_initial)
                    .addScaledVector(binormal, bJ_initial);

                arrPos[i * 3 + 0] = p.x;
                arrPos[i * 3 + 1] = p.y;
                arrPos[i * 3 + 2] = p.z;
            }
            (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

            const line = new THREE.Line(geo, mat);
            line.frustumCulled = false;

            // Các mảng cho chế độ động (desktop)
            const curN = new Float32Array(seg);
            const curB = new Float32Array(seg);
            const velN = new Float32Array(seg);
            const velB = new Float32Array(seg);
            const tgtN = new Float32Array(seg);
            const tgtB = new Float32Array(seg);
            const nextT = new Float32Array(seg);
            const freq = new Float32Array(seg);
            const seed = new Float32Array(seg);

            for (let i = 0; i < seg; i++) {
                tgtN[i] = 0;
                tgtB[i] = 0;
                curN[i] = 0;
                curB[i] = 0;
                velN[i] = 0;
                velB[i] = 0;
                nextT[i] = -1;
                const f = 5 + Math.random() * 6; // giữ nguyên hiệu ứng desktop
                freq[i] = 2 * Math.PI * f;
                seed[i] = Math.random() * Math.PI * 2;
            }

            arr.push({ line, geo, mat, initialJitter, curN, curB, velN, velB, tgtN, tgtB, nextT, freq, seed });
        }
        return arr;
    }, [SPARKS_N, color, curveA, curveB, tubeRadius, streakAmp]);

    // ======= STAR MATERIAL =======
    const starMat = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: color.clone().multiplyScalar(1.8),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            opacity: 0,
            side: THREE.DoubleSide,
        });
    }, [color]);

    // ======= Precompute particle positions =======
    useMemo(() => {
        for (let i = 0; i < N; i++) {
            const src = pParams[pOrder[i]];
            const curve = src.which === 0 ? curveA : curveB;
            curve.getPointAt(src.u, center);
            curve.getTangentAt(src.u, tangent).normalize();
            getFrame(tangent, normal, binormal);

            tmp.copy(normal).multiplyScalar(Math.cos(src.ph) * src.r * 2.12);
            tmp.addScaledVector(binormal, Math.sin(src.ph) * src.r * 2.12);
            tmp.addScaledVector(tangent, src.h * 0.02);

            const len = Math.hypot(tmp.x, tmp.y, tmp.z) || 1;
            pOutDir[i * 3 + 0] = tmp.x / len;
            pOutDir[i * 3 + 1] = tmp.y / len;
            pOutDir[i * 3 + 2] = tmp.z / len;

            center.add(tmp);
            pPos[i * 3 + 0] = center.x;
            pPos[i * 3 + 1] = center.y;
            pPos[i * 3 + 2] = center.z;

            pVel[i * 3 + 0] = 0;
            pVel[i * 3 + 1] = 0;
            pVel[i * 3 + 2] = 0;
        }
    }, [N, pParams, pOrder, curveA, curveB, pPos, pOutDir, pVel]);

    // ======= Seed main streaks =======
    useMemo(() => {
        streakObjs.forEach((obj, k) => {
            const arr = (obj.geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
            const seg = arr.length / 3;
            const phase = (k / Math.max(1, streakObjs.length - 1)) * Math.PI * 2;
            for (let i = 0; i < seg; i++) {
                const t = i / (seg - 1);
                const curve = k % 2 === 0 ? curveA : curveB;
                curve.getPointAt(t, center);
                curve.getTangentAt(t, tangent).normalize();
                getFrame(tangent, normal, binormal);
                const offBase = THREE.MathUtils.lerp(tubeRadius * 0.6, tubeRadius * 1.5, (Math.sin(t * 10.0 + phase) + 1.0) * 0.5);
                const p = tmp
                    .copy(center)
                    .addScaledVector(normal, offBase)
                    .addScaledVector(binormal, (Math.random() - 0.5) * tubeRadius * 0.6);
                arr[i * 3 + 0] = p.x;
                arr[i * 3 + 1] = p.y;
                arr[i * 3 + 2] = p.z;
            }
            (obj.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
        });
    }, [streakObjs, curveA, curveB, tubeRadius]);

    // ======= Snow (instanced) =======
    const snowMeshRef = useRef<InstancedMesh>(null);
    const snowVelY = useMemo(() => new Float32Array(snowCount), [snowCount]);
    const snowWindX = useMemo(() => new Float32Array(snowCount), [snowCount]);
    const snowWindZ = useMemo(() => new Float32Array(snowCount), [snowCount]);
    const snowDriftA = useMemo(() => new Float32Array(snowCount), [snowCount]);
    const snowDriftW = useMemo(() => new Float32Array(snowCount), [snowCount]);
    const snowPhase = useMemo(() => new Float32Array(snowCount), [snowCount]);

    const snowPos = useMemo(() => {
        const arr = new Float32Array(snowCount * 3);
        const rangeX = 12,
            rangeZ = 12;
        for (let i = 0; i < snowCount; i++) {
            arr[i * 3 + 0] = (Math.random() * 2 - 1) * rangeX;
            arr[i * 3 + 1] = Math.random() * (height + 10) + 3.0;
            arr[i * 3 + 2] = (Math.random() * 2 - 1) * rangeZ;

            const baseVyMin = 0.18,
                baseVyMax = 0.35;
            snowVelY[i] = THREE.MathUtils.lerp(baseVyMin, baseVyMax, Math.random()) * snowSpeedMultiplier;

            const dirBias = Math.random() < 0.6 ? -1 : 1;
            const baseWX = dirBias * 0.45 * snowWindMultiplier;
            const baseWZ = THREE.MathUtils.lerp(-0.22, 0.22, Math.random()) * snowWindMultiplier;
            snowWindX[i] = baseWX + THREE.MathUtils.lerp(-0.25, 0.25, Math.random());
            snowWindZ[i] = baseWZ + THREE.MathUtils.lerp(-0.18, 0.18, Math.random());

            snowDriftA[i] = THREE.MathUtils.lerp(0.12, 0.55, Math.random());
            snowDriftW[i] = THREE.MathUtils.lerp(0.8, 1.6, Math.random());
            snowPhase[i] = Math.random() * Math.PI * 2;
        }
        return arr;
    }, [snowCount, height, snowSpeedMultiplier, snowWindMultiplier, snowVelY, snowWindX, snowWindZ, snowDriftA, snowDriftW, snowPhase]);

    const snowQuat = useMemo(() => Array.from({ length: snowCount }, () => new THREE.Quaternion()), [snowCount]);
    const snowAngVel = useMemo(() => {
        const arr = new Float32Array(snowCount * 3);
        for (let i = 0; i < snowCount; i++) {
            const base = 0.6 * snowAngularSpeedMul;
            arr[i * 3 + 0] = THREE.MathUtils.lerp(-base, base, Math.random());
            arr[i * 3 + 1] = THREE.MathUtils.lerp(-base, base, Math.random());
            arr[i * 3 + 2] = THREE.MathUtils.lerp(-base, base, Math.random());
        }
        return arr;
    }, [snowCount, snowAngularSpeedMul]);

    const snowScale = useMemo(() => {
        const s = new Float32Array(snowCount);
        for (let i = 0; i < snowCount; i++) s[i] = THREE.MathUtils.lerp(snowSizeMin, snowSizeMax, Math.random());
        return s;
    }, [snowCount, snowSizeMin, snowSizeMax]);

    useMemo(() => {
        for (let i = 0; i < snowCount; i++) {
            const e = new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            snowQuat[i].setFromEuler(e);
        }
    }, [snowCount, snowQuat]);

    // ======= Timers =======
    const startRef = useRef<number | null>(null);
    const prevTRef = useRef<number>(0);

    const readyToFlashAtRef = useRef<number | null>(null);
    const flashStartRef = useRef<number | null>(null);
    const explodeStartRef = useRef<number | null>(null);
    const vanishedRef = useRef<boolean>(false);
    const lastTriggerRef = useRef<number>(fadeTrigger);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const dtRaw = t - (prevTRef.current ?? t);
        const dt = Math.min(1 / 30, Math.max(0, dtRaw)); // clamp nhẹ; không thay đổi hiệu ứng
        prevTRef.current = t;

        if (startRef.current === null) startRef.current = t;
        const elapsed = t - startRef.current;

        // APPEAR 0→1
        const appearProgressRaw = Math.min(1.0, elapsed / appearDuration);

        // Trigger flash
        if (fadeTrigger !== lastTriggerRef.current && appearProgressRaw >= 1 && !vanishedRef.current) {
            lastTriggerRef.current = fadeTrigger;
            readyToFlashAtRef.current = t + waitBeforeFade;
        }

        // Bắt đầu flash
        if (readyToFlashAtRef.current !== null && flashStartRef.current === null && t >= readyToFlashAtRef.current) {
            flashStartRef.current = t;

            explodeStartRef.current = t;
            for (let i = 0; i < N; i++) {
                const j = i * 3;
                const rand = 0.7 + 0.6 * Math.random();
                pVel[j + 0] = pOutDir[j + 0] * explodePower * rand;
                pVel[j + 1] = pOutDir[j + 1] * explodePower * rand;
                pVel[j + 2] = pOutDir[j + 2] * explodePower * rand;
            }
        }

        const flashPhase = flashStartRef.current === null ? 0 : Math.min(1, (t - flashStartRef.current) / fadeFlashDuration);
        const flash = Math.sin(flashPhase * Math.PI);
        const brightBoost = 1 + 2.8 * flash;

        // Transform
        if (groupRef.current && !vanishedRef.current) {
            groupRef.current.rotation.y = t * rotateSpeed;
            groupRef.current.scale.setScalar(scale);
            groupRef.current.position.y = treeYOffset;
        }

        if (starRef.current && !vanishedRef.current) {
            // vẫn để sao quay mặt về camera
            starRef.current.lookAt(state.camera.position);
            starRef.current.rotation.x = 0;
            starRef.current.rotation.z = 0;
            // xoay thêm quanh trục Y của chính nó
            // tốc độ tuỳ bạn, 2.5 là quay nhanh vừa
            starRef.current.rotation.y = t * 0.1;
        }

        if (!vanishedRef.current) {
            // Streaks show range
            streakObjs.forEach((obj) => {
                const total = obj.geo.getAttribute('position').count;
                const drawAppear = Math.floor(total * appearProgressRaw);
                obj.geo.drawRange.count = Math.max(2, drawAppear);

                let extraFade = 1;
                if (explodeStartRef.current !== null) {
                    const k = Math.min(1, (t - explodeStartRef.current) / explodeDuration);
                    extraFade = 1 - k;
                }
                obj.mat.color.set(color).multiplyScalar(brightBoost);
                obj.mat.opacity = 0.95 * (appearProgressRaw > 0 ? 1 : 0) * extraFade;
            });

            // Particles
            if (pGeoRef.current) {
                const total = pGeoRef.current.getAttribute('position').count;
                const drawAppear = Math.floor(total * appearProgressRaw);
                pGeoRef.current.setDrawRange(0, Math.max(1, drawAppear));
            }
            if (pMatRef.current) {
                pMatRef.current.color.setScalar(brightBoost);
                pMatRef.current.opacity = 0.95 * (appearProgressRaw > 0 ? 1 : 0);
            }

            // Star
            const starEase = Math.max(0, Math.min(1, (elapsed - appearDuration) / 0.2));
            if (starMat) {
                starMat.color.set(color).multiplyScalar(1.8 * brightBoost);
                starMat.opacity = starEase;
            }

            // LIGHTNING
            const dampingRatio = 0.9;
            const changeMin = 0.5;
            const changeMax = 0.7;
            // const jitterBase = tubeRadius * streakAmp * L_AMP_MUL;
             // tăng jitter base theo LIGHTNING_SCALE để bolt rộng hơn
            const jitterBase = tubeRadius * streakAmp * L_AMP_MUL * LIGHTNING_SCALE;
            
            // const initialInfluence = 1.0 - 0.7 * appearProgressRaw;
            const initialInfluence = 1.0 - 0.7 * appearProgressRaw;

            lightningBoltObjs.forEach((obj, k) => {
                const totalVertices = obj.geo.getAttribute('position').count;
                const drawAppear = Math.floor(totalVertices * appearProgressRaw);
                obj.geo.drawRange.count = Math.max(2, drawAppear);

                let extraFade = 1;
                if (explodeStartRef.current !== null) {
                    const kExpl = Math.min(1, (t - explodeStartRef.current) / explodeDuration);
                    extraFade = 1 - kExpl;
                }
                obj.mat.color.set(color).multiplyScalar(1.35 * brightBoost);
                obj.mat.opacity = 0.95 * (appearProgressRaw > 0 ? 1 : 0) * extraFade;

                // === Mobile: STATIC lightning (không cập nhật jitter/position) ===
                if (STATIC_LIGHTNING) return;

                const arrPos = (obj.geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
                const curve = k % 2 === 0 ? curveA : curveB;
                const offset_dir = k < SPARKS_N / 2 ? 1.0 : -1.0;
                const k_phase = (k * Math.PI * 2.0) / Math.max(1, SPARKS_N);

                for (let i = 0; i < totalVertices; i++) {
                    if (t >= obj.nextT[i]) {
                        const amp = jitterBase * (0.35 + 0.65 * appearProgressRaw);
                        obj.tgtN[i] = (Math.random() * 2 - 1) * amp;
                        obj.tgtB[i] = (Math.random() * 2 - 1) * amp;
                        obj.nextT[i] = t + (Math.random() * (changeMax - changeMin) + changeMin);
                    }

                    const omega = obj.freq[i] * (0.9 + 0.2 * Math.sin(0.35 * t + obj.seed[i]));
                    const accN = omega * omega * (obj.tgtN[i] - obj.curN[i]) - 2 * dampingRatio * omega * obj.velN[i];
                    obj.velN[i] += accN * dt;
                    obj.curN[i] += obj.velN[i] * dt;

                    const accB = omega * omega * (obj.tgtB[i] - obj.curB[i]) - 2 * dampingRatio * omega * obj.velB[i];
                    obj.velB[i] += accB * dt;
                    obj.curB[i] += obj.velB[i] * dt;

                    const localT = i / (totalVertices - 1);
                    const t_curve = L_SPAN_START + (L_SPAN_END - L_SPAN_START) * localT;

                    curve.getPointAt(t_curve, center);
                    curve.getTangentAt(t_curve, tangent).normalize();
                    getFrame(tangent, normal, binormal);

                    const baseOffset = offset_dir * tubeRadius * (2.2 + 1.2 * Math.sin(t_curve * 5.0 + k_phase)) * L_AMP_MUL * LIGHTNING_SCALE;
                    const p = tmp
                        .copy(center)
                        .addScaledVector(normal, baseOffset + obj.initialJitter[i].x * initialInfluence + obj.curN[i])
                        .addScaledVector(binormal, obj.initialJitter[i].y * initialInfluence + obj.curB[i]);

                    arrPos[i * 3 + 0] = p.x;
                    arrPos[i * 3 + 1] = p.y;
                    arrPos[i * 3 + 2] = p.z;
                }
                (obj.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
            });

            // EXPLOSION (giữ nguyên)
            if (explodeStartRef.current !== null && pGeoRef.current) {
                const tExpl = t - explodeStartRef.current;
                const k = Math.min(1, tExpl / explodeDuration);
                const drag = Math.pow(explodeDrag, dt / (1 / 60));
                const arr = (pGeoRef.current.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;

                for (let i = 0; i < N; i++) {
                    const j = i * 3;
                    if (k < 0.25) {
                        const boost = (0.25 - k) * 0.4 * explodePower * dt;
                        pVel[j + 0] += pOutDir[j + 0] * boost;
                        pVel[j + 1] += pOutDir[j + 1] * boost;
                        pVel[j + 2] += pOutDir[j + 2] * boost;
                    }
                    pVel[j + 0] *= drag;
                    pVel[j + 1] *= drag;
                    pVel[j + 2] *= drag;
                    arr[j + 0] += pVel[j + 0] * dt;
                    arr[j + 1] += pVel[j + 1] * dt;
                    arr[j + 2] += pVel[j + 2] * dt;
                }
                (pGeoRef.current.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

                if (pMatRef.current) pMatRef.current.opacity = 0.95 * (1 - k);

                if (tExpl >= explodeDuration && !vanishedRef.current) {
                    vanishedRef.current = true;
                    if (groupRef.current) groupRef.current.visible = false;
                    if (!calledGoneRef.current) {
                        calledGoneRef.current = true;
                        onGone?.();
                    }
                }
            }
        }

        // ===== SNOW UPDATE =====
        if (snowMeshRef.current) {
            const mesh = snowMeshRef.current;
            const dummyPos = new THREE.Vector3();
            const dummyScale = new THREE.Vector3();
            const dummyQuat = new THREE.Quaternion();
            const eulerDelta = new THREE.Euler();
            const m = new THREE.Matrix4();
            const rangeX = 12,
                rangeZ = 12;
            const yMin = -1.0,
                yMax = height + 10;

            const gustX = Math.sin(t * 0.35) * 0.25 * snowWindMultiplier;
            const gustZ = Math.cos(t * 0.27) * 0.18 * snowWindMultiplier;

            for (let i = 0; i < snowCount; i++) {
                const idx = i * 3;

                const driftX = Math.sin(t * snowDriftW[i] + snowPhase[i]) * snowDriftA[i] * 0.6;
                const driftZ = Math.cos(t * (snowDriftW[i] * 0.9) + snowPhase[i] * 1.3) * snowDriftA[i] * 0.45;

                snowPos[idx + 0] += (snowWindX[i] + driftX + gustX) * dt;
                snowPos[idx + 2] += (snowWindZ[i] + driftZ + gustZ) * dt;
                snowPos[idx + 1] -= snowVelY[i] * dt;

                if (snowPos[idx + 1] < yMin) {
                    snowPos[idx + 1] = yMax;
                    snowPos[idx + 0] = (Math.random() * 2 - 1) * rangeX;
                    snowPos[idx + 2] = (Math.random() * 2 - 1) * rangeZ;
                    snowPhase[i] = Math.random() * Math.PI * 2;
                }
                if (snowPos[idx + 0] < -rangeX) snowPos[idx + 0] = rangeX;
                if (snowPos[idx + 0] > rangeX) snowPos[idx + 0] = -rangeX;
                if (snowPos[idx + 2] < -rangeZ) snowPos[idx + 2] = rangeZ;
                if (snowPos[idx + 2] > rangeZ) snowPos[idx + 2] = -rangeZ;

                const yaw = snowAngVel[idx + 0] * dt;
                const pitch = snowAngVel[idx + 1] * dt;
                const roll = snowAngVel[idx + 2] * dt;
                eulerDelta.set(pitch, yaw, roll, 'XYZ');
                dummyQuat.setFromEuler(eulerDelta);
                snowQuat[i].multiply(dummyQuat);

                dummyPos.set(snowPos[idx + 0], snowPos[idx + 1], snowPos[idx + 2]);
                const s = snowScale[i];
                dummyScale.set(s, s, s);
                m.compose(dummyPos, snowQuat[i], dummyScale);
                mesh.setMatrixAt(i, m);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <>
            {/* SNOW */}
            <instancedMesh ref={snowMeshRef} args={[undefined as any, undefined as any, snowCount]} frustumCulled={false} renderOrder={1}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                    map={snowTex}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    opacity={0.95}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </instancedMesh>

            {/* TREE GROUP */}
            <group ref={groupRef}>
                {/* STAR */}
                <mesh
                    ref={starRef}
                    geometry={useMemo(() => {
                        const s = new THREE.Shape();
                        const r = 0.24,
                            ir = 0.1,
                            p = 5;
                        s.moveTo(0, r);
                        for (let i = 0; i < p; i++) {
                            let ang = (i / p) * Math.PI * 2 + Math.PI / 2;
                            s.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                            ang += (Math.PI * 2) / (p * 2);
                            s.lineTo(Math.cos(ang) * ir, Math.sin(ang) * ir);
                        }
                        s.closePath();
                        // return new THREE.ShapeGeometry(s);
                         // Dùng ExtrudeGeometry để tạo "độ dày" cho ngôi sao
                        const depth = 0.06; // điều chỉnh giá trị để tăng/giảm độ dày
                        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
                            depth,
                            bevelEnabled: false,
                        };
                        const geom = new THREE.ExtrudeGeometry(s, extrudeSettings);
                        // ExtrudeGeometry mở rộng theo trục Z; dịch nhẹ về giữa nếu cần
                        geom.translate(0, 0, -depth / 2);
                        return geom;
                    }, [])}
                    material={starMat}
                    position={[0, height + 0.25, 0]}
                    renderOrder={6}
                />

                {/* PARTICLES */}
                <points
                    geometry={useMemo(() => {
                        const g = new THREE.BufferGeometry();
                        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
                        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
                        g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(N), 1));
                        (g.getAttribute('position') as THREE.BufferAttribute).set(pPos);
                        (g.getAttribute('color') as THREE.BufferAttribute).set(pCol);
                        (g.getAttribute('size') as THREE.BufferAttribute).set(pSize);
                        g.setDrawRange(0, 0);
                        return g;
                    }, [N, pPos, pCol, pSize])}
                    ref={(p) => {
                        if (p) pGeoRef.current = p.geometry as THREE.BufferGeometry;
                    }}
                >
                    <pointsMaterial
                        ref={pMatRef}
                        size={0.024}
                        vertexColors
                        transparent
                        opacity={0}
                        sizeAttenuation
                        blending={THREE.NormalBlending}
                        depthWrite={false}
                        map={dotTex}
                        alphaTest={0.1}
                    />
                </points>

                {/* MAIN STREAKS */}
                {streakObjs.map((o, i) => (
                    <primitive key={i} object={o.line} renderOrder={4} />
                ))}

                {/* LIGHTNING (static on mobile) */}
                {lightningBoltObjs.map((o, i) => (
                    <primitive key={`lightning-${i}`} object={o.line} renderOrder={10} />
                ))}
            </group>
        </>
    );
}

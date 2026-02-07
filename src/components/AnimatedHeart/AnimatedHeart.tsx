'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { parseRGBStringToColor } from './util';

// size of heart
const HEART_SCALE = 1.5;
const MOBILE_HEART_SCALE = 1.1;

// Interface cho smoke cluster (chùm particles) - bay ra ngoài một chiều
interface SmokeCluster {
  center: THREE.Vector3;       // Tâm của chùm
  velocity: THREE.Vector3;     // Vận tốc của chùm (bay ra ngoài)
  particles: {                 // Các particle trong chùm
    offset: THREE.Vector3;
    size: number;
  }[];
  life: number;
  maxLife: number;
  rotation: number;            // Góc xoay quanh trục Y
  rotationSpeed: number;       // Tốc độ xoay Y
  tiltAngle: number;           // Góc nghiêng (lật) của mảnh
  tiltSpeed: number;           // Tốc độ lật
  initialRotationX: number;    // Góc xoay ban đầu X (random)
  initialRotationZ: number;    // Góc xoay ban đầu Z (random)
}

// Interface cho dust particle trên đỉnh blob (hình trái tim bụi)
interface DustParticle {
  basePos: THREE.Vector3;      // Vị trí gốc trên bề mặt trái tim bụi
  offset: THREE.Vector3;       // Offset dao động
  size: number;
  phase: number;               // Phase để dao động
  driftSpeed: number;          // Tốc độ trôi
}

function createGlowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    // Tạo gradient radial cho hiệu ứng glow mềm
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  return texture;
}

// Mảng các đoạn text ngắn để chạy dọc màn hình
type Props = {
  position?: [number, number, number];
  riseDuration?: number; // thời gian blob bay từ dưới lên (s)
  morphDuration?: number; // thời gian biến đổi từ blob sang trái tim (s)
  colorChangeDuration?: number; // thời gian đổi màu (s)
  glowDuration?: number; // thời gian sáng lên trước khi đổi màu (s)
  heartbeatSpeed?: number; // tốc độ đập
  startY?: number; // vị trí Y bắt đầu của blob
  targetY?: number; // vị trí Y đích (nơi blob biến thành trái tim)
  onColorChangeProgress?: (progress: number) => void; // callback khi đổi màu
  onFlashProgress?: (flashMultiplier: number) => void; // callback khi flash effect
  texts: string[]; // mảng text chạy dọc màn hình
  heartColor: string
  textColor: string
};

// Component cho text chạy dọc - sử dụng HTML overlay
function FloatingText({
  text,
  startX,
  startY,
  startZ,
  speed,
  size,
  delay,
  opacityMultiplier = 1,
  textColor
}: {
  text: string;
  startX: number;
  startY: number;
  startZ: number;
  speed: number;
  size: number;
  delay: number;
  opacityMultiplier?: number;
  textColor: string
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);
  const [opacity, setOpacity] = useState(0);
  const [visible, setVisible] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    if (startTime.current === null) startTime.current = t;

    const elapsed = t - startTime.current - delay;
    if (elapsed < 0) {
      if (visible) setVisible(false);
      return;
    }
    if (!visible) setVisible(true);

    // Di chuyển từ dưới lên trên
    const yRange = 20; // Khoảng cách di chuyển
    const yStart = startY;
    const y = yStart + (elapsed * speed) % yRange;

    // Fade in/out dựa trên vị trí
    const fadeIn = Math.min(1, (y - yStart) / 2);
    const fadeOut = Math.min(1, (yStart + yRange - y) / 2);
    const newOpacity = fadeIn * fadeOut * 0.7;

    groupRef.current.position.y = y;
    setOpacity(newOpacity);
  });

  // Tính opacity cuối cùng với multiplier (KHÔNG dùng flash cho text)
  const finalOpacity = opacity * opacityMultiplier;
  const fontsize = window.innerWidth < 600 ? 25 : size * 150;

  return (
    <group ref={groupRef} position={[startX, startY, startZ]} visible={visible}>
      <Html
        center
        transform
        distanceFactor={5}
        style={{
          color: textColor,
          fontSize: `${fontsize}px`,
          fontWeight: 'bold',
          fontFamily: 'Mali',
          opacity: finalOpacity,
          whiteSpace: 'nowrap',
          textShadow: '0 0 16px #ff80b0, 0 0 16px #ff6090',
          pointerEvents: 'none',
          userSelect: 'none',
        }}        >
        {text}
      </Html>
    </group>
  );
}

export default function AnimatedHeart({
  position = [0, 0, 0],
  riseDuration = 2.5, // thời gian blob bay lên
  morphDuration = 2.0, // thời gian biến đổi thành trái tim
  colorChangeDuration = 1.0,
  glowDuration = 0.6, // thời gian sáng lên trước khi đổi màu
  heartbeatSpeed = 1.5,
  startY = -3, // blob bắt đầu từ dưới
  targetY = 0, // blob đến vị trí này rồi biến đổi
  onColorChangeProgress, // callback để đồng bộ màu với ground
  onFlashProgress, // callback để đồng bộ flash effect
  texts, // sử dụng default texts
  heartColor,
  textColor,
}: Props) {
  const dotTexture = useMemo(() => createGlowTexture(128), []);
  const pointsRef = useRef<THREE.Points>(null);
  const heartMatRef = useRef<THREE.PointsMaterial>(null);
  const heartGeoRef = useRef<THREE.BufferGeometry>(null);
  const startTimeRef = useRef<number | null>(null);
  const morphStartRef = useRef<number | null>(null);
  const colorChangeStartRef = useRef<number | null>(null);
  const firstBeatStartRef = useRef<number | null>(null); // Thời điểm bắt đầu nhịp đập đầu tiên
  const isMorphCompleteRef = useRef(false);
  const [canShowTexts, setCanShowTexts] = useState(false);
  const textsTriggeredRef = useRef(false);
  const flashMultiplierRef = useRef(1); // Lưu trữ flash multiplier để áp dụng cho tất cả particles

  // Smoke cluster system - mỗi cluster là một chùm gồm nhiều particles
  const smokeClustersRef = useRef<SmokeCluster[]>([]);
  const smokeGeoRef = useRef<THREE.BufferGeometry>(null);
  const smokeMatRef = useRef<THREE.PointsMaterial>(null);
  const maxSmokeClusters = 125; // Số chùm tối đa (x5)
  const particlesPerCluster = 30; // Số particles mỗi chùm
  const maxSmokeParticles = maxSmokeClusters * particlesPerCluster;

  // Màu ban đầu: cam/vàng ấm - tăng độ sáng vượt 1.0 để glow
  const orangeColor = useMemo(() => new THREE.Color(1.8, 1.2, 0.5), []);
  // Màu sau: đỏ - tăng độ sáng vượt 1.0 để glow
  const redColor = useMemo(() => new THREE.Color(parseRGBStringToColor(heartColor)), []);

  // Tạo data cho floating texts
  const floatingTextData = useMemo(() => {
    return texts.map((text, index) => ({
      text,
      startX: (Math.random() - 0.5) * 16, // Random X từ -8 đến 8
      startY: -10, // Random Y từ -10 đến 10
      // Random Z từ -15 đến 5 (cả trước và sau trái tim)
      startZ: -15 + Math.random() * 20,
      speed: 1.5 + Math.random() * 1.0, // Tốc độ random tăng lên
      size: 0.2 + Math.random() * 0.15, // Kích thước random
      delay: index * 0.2 + Math.random() * 0.5, // Delay giảm để nhiều text cùng lúc
    }));
  }, [texts]);

  // ===== Heart và Blob Particles =====
  const heartParticles = useMemo(() => {
    const targetDots = 14000;
    const heartPositions = new Float32Array(targetDots * 3);
    const blobPositions = new Float32Array(targetDots * 3); // Vị trí trên hình blob
    const originalColors = new Float32Array(targetDots * 3);
    const sizes = new Float32Array(targetDots);
    const noiseOffsets = new Float32Array(targetDots * 3); // Offset noise cho blob biến dạng

    const heartScale = window.innerWidth < 600 ? MOBILE_HEART_SCALE : HEART_SCALE;
    const R = 2;
    const blobRadius = 1.0; // Bán kính blob nhỏ hơn trái tim (khoảng 50%)

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
    const maxSafety = targetDots * 100;
    let safety = 0;
    const jitter = 0.006;

    while (count < targetDots && safety < maxSafety) {
      safety++;

      // Random uniform sampling trên sphere để tránh bias
      const sphereY = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const sqrt1minusU2 = Math.sqrt(1 - sphereY * sphereY);

      const dir = new THREE.Vector3(
        sqrt1minusU2 * Math.cos(theta),
        sphereY,
        sqrt1minusU2 * Math.sin(theta)
      ).normalize();

      const p = hitOnRay(dir);
      if (!p) continue;

      // === Density-based sampling để tạo phân bố đều ===
      // Tính toán xác suất giữ lại dựa trên tỷ lệ diện tích bề mặt/góc khối
      // Density tự nhiên ~ cos(alpha) / r^2
      // Để có density đều, ta cần xác suất giữ lại ~ r^2 / cos(alpha)

      const normal = grad(p.x, p.y, p.z).normalize();
      const distSq = p.lengthSq(); // r^2
      const cosAlpha = Math.abs(normal.dot(dir)); // cos(alpha)

      // Weight càng lớn thì xác suất giữ lại càng cao
      // Các khu vực ở xa (r lớn) hoặc tia tới xiên (cosAlpha nhỏ) cần được ưu tiên giữ lại
      // Thêm 0.1 vào cosAlpha để tránh chia cho 0
      const weight = distSq / (cosAlpha + 0.1);

      // Normalize weight về xác suất [0, 1]
      // Hệ số 0.2 được chọn thực nghiệm để cân bằng số lượng điểm
      const keepProbability = Math.min(1.0, weight * 0.2);

      // Skip particle nếu không may
      if (Math.random() > keepProbability) continue;

      const t1 = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
      const tangent1 =
        t1.length() < 1e-6
          ? new THREE.Vector3(1, 0, 0).cross(dir).normalize()
          : t1.normalize();
      const tangent2 = new THREE.Vector3().crossVectors(dir, tangent1).normalize();

      // Tăng jitter để tạo vị trí random hơn trên bề mặt
      const randomJitter = jitter * (1 + Math.random() * 3); // Random jitter từ 1x đến 4x
      const u = (Math.random() * 2 - 1) * randomJitter;
      const v = (Math.random() * 2 - 1) * randomJitter;
      p.addScaledVector(tangent1, u).addScaledVector(tangent2, v);

      // Vị trí trái tim thực sự
      const heartX = p.x * heartScale;
      const heartY = p.y * heartScale;
      const heartZ = p.z * heartScale;

      heartPositions[count * 3 + 0] = heartX;
      heartPositions[count * 3 + 1] = heartY;
      heartPositions[count * 3 + 2] = heartZ;

      // ===== Vị trí trên blob - CHUYỂN TIẾP MỀM TỪ CẦU SANG TIA =====
      // Sử dụng noise để tạo ranh giới không đều, không bị cắt ngang

      // Noise dựa trên vị trí để tạo ranh giới lởm chởm
      const noiseFreq = 3.0;
      const boundaryNoise = Math.sin(dir.x * noiseFreq + 0.5) * Math.cos(dir.y * noiseFreq * 1.3) * 0.25
        + Math.sin(dir.y * noiseFreq * 0.8 + 1.2) * Math.cos(dir.x * noiseFreq * 1.1) * 0.2
        + Math.sin((dir.x + dir.y) * noiseFreq * 0.6) * 0.15;

      // Ngưỡng động - mỗi particle có ngưỡng khác nhau
      const baseThreshold = -0.15;
      const dynamicThreshold = baseThreshold + boundaryNoise;

      // Tính mức độ "tia" - chuyển tiếp mượt thay vì nhị phân
      // spikeAmount: 0 = hoàn toàn cầu, 1 = hoàn toàn tia
      let spikeAmount = 0;
      const transitionWidth = 0.4; // Vùng chuyển tiếp rộng

      if (dir.z < dynamicThreshold - transitionWidth) {
        // Hoàn toàn là tia
        spikeAmount = 1;
      } else if (dir.z < dynamicThreshold + transitionWidth) {
        // Vùng chuyển tiếp - blend mượt
        const t = (dynamicThreshold + transitionWidth - dir.z) / (transitionWidth * 2);
        spikeAmount = t * t * (3 - 2 * t); // smoothstep
        // Thêm random để phá vỡ sự đều đặn
        spikeAmount *= 0.5 + Math.random() * 0.5;
      }

      let blobX: number, blobY: number, blobZ: number;

      if (spikeAmount > 0.01) {
        // Có tia - tính toán vị trí tia
        const lowerFactor = Math.min(1, Math.abs(dir.z + 0.5));

        // Random chọn kiểu tia
        const spikeType = Math.random();
        let spikeExtension: number;
        if (spikeType < 0.25) {
          spikeExtension = 1.0 + lowerFactor * 0.8 + Math.random() * 0.5;
        } else if (spikeType < 0.55) {
          spikeExtension = 1.3 + lowerFactor * 2.0 + Math.random() * 1.5;
        } else if (spikeType < 0.85) {
          spikeExtension = 2.0 + lowerFactor * 3.5 + Math.random() * 2.5;
        } else {
          spikeExtension = 3.5 + lowerFactor * 6.0 + Math.random() * 4.0;
        }

        // Blend giữa bán kính cầu và bán kính tia
        const sphereRadius = blobRadius * heartScale;
        const spikeRadius = blobRadius * heartScale * spikeExtension;
        const finalRadius = sphereRadius + (spikeRadius - sphereRadius) * spikeAmount;

        // Nhiễu góc - mạnh hơn khi spikeAmount cao
        const spreadAngle = (0.8 + lowerFactor * 0.6) * spikeAmount;
        const angleJitterX = (Math.random() - 0.5) * spreadAngle;
        const angleJitterY = (Math.random() - 0.5) * spreadAngle;
        const angleJitterZ = (Math.random() - 0.5) * 0.4 * spikeAmount;

        const jitteredDir = new THREE.Vector3(
          dir.x + angleJitterX,
          dir.y + angleJitterY,
          dir.z + angleJitterZ - lowerFactor * 0.2 * spikeAmount
        ).normalize();

        blobX = jitteredDir.x * finalRadius;
        blobY = jitteredDir.y * finalRadius;
        blobZ = jitteredDir.z * finalRadius;
      } else {
        // Hoàn toàn cầu - thêm chút nhiễu nhẹ để không quá perfect
        const surfaceNoise = 1 + (Math.random() - 0.5) * 0.05;
        blobX = dir.x * blobRadius * heartScale * surfaceNoise;
        blobY = dir.y * blobRadius * heartScale * surfaceNoise;
        blobZ = dir.z * blobRadius * heartScale * surfaceNoise;
      }

      blobPositions[count * 3 + 0] = blobX;
      blobPositions[count * 3 + 1] = blobY;
      blobPositions[count * 3 + 2] = blobZ;

      // Noise offsets cho hiệu ứng blob biến dạng
      noiseOffsets[count * 3 + 0] = Math.random() * Math.PI * 2;
      noiseOffsets[count * 3 + 1] = Math.random() * Math.PI * 2;
      noiseOffsets[count * 3 + 2] = Math.random() * Math.PI * 2;

      // Màu cam/vàng ấm với độ sáng cố định để glow
      const brightness = 1.2;
      originalColors[count * 3 + 0] = orangeColor.r * brightness;
      originalColors[count * 3 + 1] = orangeColor.g * brightness;
      originalColors[count * 3 + 2] = orangeColor.b * brightness;

      sizes[count] = 0.8 + Math.random() * 0.2;
      count++;
    }

    return {
      heartPositions: count === targetDots ? heartPositions : heartPositions.slice(0, count * 3),
      blobPositions: count === targetDots ? blobPositions : blobPositions.slice(0, count * 3),
      colors: count === targetDots ? originalColors : originalColors.slice(0, count * 3),
      sizes: count === targetDots ? sizes : sizes.slice(0, count),
      noiseOffsets: count === targetDots ? noiseOffsets : noiseOffsets.slice(0, count * 3),
      count,
    };
  }, [orangeColor]);

  // ===== Geometry cho trái tim chính =====
  const heartGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // Bắt đầu với vị trí blob
    g.setAttribute('position', new THREE.BufferAttribute(heartParticles.blobPositions.slice(), 3));
    g.setAttribute('color', new THREE.BufferAttribute(heartParticles.colors.slice(), 3));
    g.setAttribute('size', new THREE.BufferAttribute(heartParticles.sizes.slice(), 1));
    return g;
  }, [heartParticles]);

  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
  const easeInOutQuad = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
  const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

  // Simplex-like noise function cho blob biến dạng
  const noise3D = (x: number, y: number, z: number, time: number): number => {
    const n1 = Math.sin(x * 2.5 + time * 1.2) * Math.cos(y * 2.3 + time * 0.8);
    const n2 = Math.sin(y * 2.7 + time * 1.0) * Math.cos(z * 2.1 + time * 1.4);
    const n3 = Math.sin(z * 2.9 + time * 0.9) * Math.cos(x * 2.4 + time * 1.1);
    const n4 = Math.sin((x + y) * 1.8 + time * 1.3) * Math.cos((y + z) * 1.6 + time * 0.7);
    return (n1 + n2 + n3 + n4) * 0.25;
  };

  // Tạo các "bump" (phần lồi) ngẫu nhiên trên bề mặt blob
  // Mỗi bump có vị trí, kích thước, và phase riêng
  const bumpData = useMemo(() => {
    const numBumps = 15; // Số lượng phần lồi vừa phải
    const bumps: { dirX: number; dirY: number; dirZ: number; size: number; speed: number; phase: number }[] = [];

    for (let i = 0; i < numBumps; i++) {
      // Vị trí ngẫu nhiên trên bề mặt cầu
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      bumps.push({
        dirX: Math.sin(phi) * Math.cos(theta),
        dirY: Math.sin(phi) * Math.sin(theta),
        dirZ: Math.cos(phi),
        size: 0.2 + Math.random() * 0.4, // Kích thước bump - GIẢM
        speed: 1.0 + Math.random() * 1.5, // Tốc độ vừa phải
        phase: Math.random() * Math.PI * 2, // Phase offset
      });
    }
    return bumps;
  }, []);

  // Geometry cho smoke particles
  const smokeGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(maxSmokeParticles * 3);
    const colors = new Float32Array(maxSmokeParticles * 3);
    const sizes = new Float32Array(maxSmokeParticles);

    // Khởi tạo với giá trị mặc định (particles không hiển thị)
    for (let i = 0; i < maxSmokeParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000; // Ẩn đi
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 1.5;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 0.5;
      sizes[i] = 0;
    }

    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  // Function để spawn một chùm smoke cluster từ VIỀN blob - bay ra ngoài một chiều
  const spawnSmokeCluster = (
    startX: number,
    startY: number,
    startZ: number,
    velocityDir: THREE.Vector3
  ) => {
    // Giới hạn số cluster
    if (smokeClustersRef.current.length >= maxSmokeClusters) {
      const deadIndex = smokeClustersRef.current.findIndex(c => c.life <= 0);
      if (deadIndex !== -1) {
        smokeClustersRef.current.splice(deadIndex, 1);
      } else {
        return;
      }
    }

    // Tạo các particles trong chùm với hình dạng MẢNH VỠ có góc cạnh random
    const clusterParticles: { offset: THREE.Vector3; size: number }[] = [];

    // Kích thước mảnh vỡ - random nhiều hơn
    const fragmentWidth = 0.12 + Math.random() * 0.18;  // Random rộng
    const fragmentHeight = 0.08 + Math.random() * 0.14; // Random cao
    const fragmentThickness = 0.02 + Math.random() * 0.03;

    // Random hình dạng mảnh: có thể dài, vuông, hoặc bất đối xứng
    const aspectRatio = 0.5 + Math.random() * 1.5; // Tỉ lệ khung hình random
    const irregularity = 0.3 + Math.random() * 0.5; // Độ méo mó

    // Tạo 2 trục vuông góc với hướng bay
    const up = new THREE.Vector3(0, 1, 0);
    const tangent1 = new THREE.Vector3().crossVectors(velocityDir, up).normalize();
    if (tangent1.length() < 0.1) {
      tangent1.set(1, 0, 0);
    }
    const tangent2 = new THREE.Vector3().crossVectors(velocityDir, tangent1).normalize();

    // Hình dạng mảnh: có thể cong hoặc phẳng ngẫu nhiên
    const curvature = Math.random() * 0.2;

    for (let i = 0; i < particlesPerCluster; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusFactor = Math.sqrt(Math.random());

      // Thêm irregularity để tạo hình dạng không đều
      const irregX = 1 + (Math.random() - 0.5) * irregularity;
      const irregY = 1 + (Math.random() - 0.5) * irregularity;

      const localX = Math.cos(angle) * radiusFactor * fragmentWidth * aspectRatio * irregX;
      const localY = Math.sin(angle) * radiusFactor * fragmentHeight * irregY;

      const distFromCenter = Math.sqrt(localX * localX + localY * localY);
      const curveOffset = distFromCenter * distFromCenter * curvature;

      const localZ = (Math.random() - 0.5) * fragmentThickness + curveOffset;

      const offset = new THREE.Vector3()
        .addScaledVector(tangent1, localX)
        .addScaledVector(tangent2, localY)
        .addScaledVector(velocityDir, localZ);

      clusterParticles.push({
        offset: offset,
        size: 0.015 + Math.random() * 0.01,
      });
    }

    // Tốc độ bay ra - CHẬM HƠN
    const speed = 0.15 + Math.random() * 0.15; // Giảm tốc độ

    // Góc random ban đầu cho mảnh
    const initialRotX = Math.random() * Math.PI * 2;
    const initialRotZ = Math.random() * Math.PI * 2;

    const cluster: SmokeCluster = {
      center: new THREE.Vector3(startX, startY, startZ),
      velocity: new THREE.Vector3(
        velocityDir.x * speed,
        velocityDir.y * speed * 0.3 - 0.02, // Rơi xuống nhẹ
        velocityDir.z * speed
      ),
      particles: clusterParticles,
      life: 1.0,
      maxLife: 3.0 + Math.random() * 2.0, // Sống lâu hơn vì bay chậm
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.0, // Xoay chậm hơn
      tiltAngle: Math.random() * Math.PI * 0.5,
      tiltSpeed: (Math.random() - 0.5) * 1.5, // Lật chậm hơn
      initialRotationX: initialRotX,
      initialRotationZ: initialRotZ,
    };

    smokeClustersRef.current.push(cluster);
  };

  // Tương tự nhưng tạo 'spike' cluster: mảnh dài, hướng chủ yếu theo velocityDir
  const spawnSpikeCluster = (
    startX: number,
    startY: number,
    startZ: number,
    velocityDir: THREE.Vector3
  ) => {
    if (smokeClustersRef.current.length >= maxSmokeClusters) {
      const deadIndex = smokeClustersRef.current.findIndex(c => c.life <= 0);
      if (deadIndex !== -1) {
        smokeClustersRef.current.splice(deadIndex, 1);
      } else {
        return;
      }
    }

    const clusterParticles: { offset: THREE.Vector3; size: number }[] = [];

    // Spike-specific parameters: dài, mảnh, ít phân tán ngang
    const spikeLength = 0.6 + Math.random() * 0.9; // dài hơn
    const spikeThickness = 0.01 + Math.random() * 0.02; // rất mỏng
    const lateralJitter = 0.02 + Math.random() * 0.04; // ít tán

    // Hai trục vuông góc nhỏ để thêm chút bất đối xứng
    const up = new THREE.Vector3(0, 1, 0);
    const tangent1 = new THREE.Vector3().crossVectors(velocityDir, up).normalize();
    if (tangent1.length() < 0.1) tangent1.set(1, 0, 0);
    const tangent2 = new THREE.Vector3().crossVectors(velocityDir, tangent1).normalize();

    for (let i = 0; i < particlesPerCluster; i++) {
      // Dồn các particle dọc theo velocityDir để tạo gai
      const along = Math.random() * spikeLength;
      const lat1 = (Math.random() - 0.5) * lateralJitter;
      const lat2 = (Math.random() - 0.5) * lateralJitter;

      const offset = new THREE.Vector3()
        .addScaledVector(velocityDir, along)
        .addScaledVector(tangent1, lat1)
        .addScaledVector(tangent2, lat2);

      clusterParticles.push({ offset, size: 0.008 + Math.random() * 0.01 });
    }

    // Spike bay nhanh hơn và sống ngắn vừa đủ để thấy gai
    const speed = 0.35 + Math.random() * 0.25;
    const cluster: SmokeCluster = {
      center: new THREE.Vector3(startX, startY, startZ),
      velocity: new THREE.Vector3(velocityDir.x * speed, velocityDir.y * speed * 0.5 - 0.01, velocityDir.z * speed),
      particles: clusterParticles,
      life: 1.0,
      maxLife: 1.2 + Math.random() * 1.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2.0,
      tiltAngle: Math.random() * Math.PI * 0.6,
      tiltSpeed: (Math.random() - 0.5) * 2.0,
      initialRotationX: Math.random() * Math.PI * 2,
      initialRotationZ: Math.random() * Math.PI * 2,
    };

    smokeClustersRef.current.push(cluster);
  };

  // ===== Animation Loop =====
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (startTimeRef.current === null) startTimeRef.current = t;
    const elapsed = t - startTimeRef.current;

    if (!heartGeoRef.current || !heartMatRef.current || !pointsRef.current) return;

    const totalParticles = heartParticles.count;
    const posAttr = heartGeoRef.current.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = heartGeoRef.current.getAttribute('color') as THREE.BufferAttribute;

    // ===== Phase 1: Blob bay từ dưới lên =====
    const riseProgress = Math.min(elapsed / riseDuration, 1);
    const easedRiseProgress = easeOutCubic(riseProgress);

    // Fade in khi blob xuất hiện
    const fadeInProgress = Math.min(elapsed / 0.8, 1);
    heartMatRef.current.opacity = fadeInProgress * 0.85;

    // ===== Vị trí Y: blob bay từ startY lên targetY =====
    const currentYPosition = startY + (targetY - startY) * easedRiseProgress;

    // Đặt vị trí gốc của group - DI CHUYỂN BLOB TỪ DƯỚI LÊN
    // Áp dụng currentYPosition vào position của points object
    pointsRef.current.position.set(
      position[0],
      position[1] + currentYPosition,  // Di chuyển từ startY lên targetY
      position[2]
    );

    // ===== Kích thước blob: GIỮA NGUYÊN không thay đổi =====
    const blobScaleFactor = 1.0;

    // ===== Phase 2: Morph từ blob thành trái tim - BẮT ĐẦU NGAY KHI ĐẾN VỊ TRÍ =====
    // Khi blob đến vị trí (riseProgress >= 1), bắt đầu morph ngay lập tức
    if (riseProgress >= 1 && morphStartRef.current === null) {
      morphStartRef.current = t;
    }

    let morphProgress = 0;
    if (morphStartRef.current !== null) {
      const morphElapsed = t - morphStartRef.current;
      morphProgress = Math.min(morphElapsed / morphDuration, 1);
    }
    const easedMorphProgress = easeInOutQuad(morphProgress);

    // Đổi màu NGAY SAU KHI morph xong (không chờ nhịp đập đầu tiên)
    if (morphProgress >= 1 && colorChangeStartRef.current === null) {
      colorChangeStartRef.current = t;
    }

    // Giảm dần hiệu ứng biến dạng khi morph
    const deformStrength = 1 - easedMorphProgress;

    // ===== GIẢM biến dạng blob khi bay lên - chỉ biến dạng nhẹ =====
    // Biến dạng giảm dần theo riseProgress để blob ổn định hơn khi gần đến vị trí
    const riseDeformFactor = Math.max(0, 1 - riseProgress * 0.7); // Giảm dần biến dạng khi bay lên

    // ===== Tính toán các bump (phần lồi) động - GIẢM MẠNH =====
    const activeBumps: { x: number; y: number; z: number; strength: number; radius: number }[] = [];

    for (let b = 0; b < bumpData.length; b++) {
      const bump = bumpData[b];
      const bumpActivity = (Math.sin(t * bump.speed + bump.phase) + 1) * 0.5;

      if (bumpActivity > 0.3) { // Tăng threshold
        const moveSpeed = 0.8; // Giảm tốc độ di chuyển
        const movingDirX = bump.dirX * Math.cos(t * moveSpeed + bump.phase) - bump.dirZ * Math.sin(t * moveSpeed * 1.3);
        const movingDirY = bump.dirY + Math.sin(t * moveSpeed * 0.8 + bump.phase) * 0.3;
        const movingDirZ = bump.dirX * Math.sin(t * moveSpeed * 1.1) + bump.dirZ * Math.cos(t * moveSpeed + bump.phase * 0.5);

        const len = Math.sqrt(movingDirX * movingDirX + movingDirY * movingDirY + movingDirZ * movingDirZ);

        activeBumps.push({
          x: movingDirX / len,
          y: movingDirY / len,
          z: movingDirZ / len,
          strength: bumpActivity * bump.size * deformStrength * riseDeformFactor * 0.5, // Giảm 50%
          radius: 0.4 + bump.size * 0.3,
        });
      }
    }

    // ===== Biến dạng cơ bản - GIẢM MẠNH HƠN =====
    const morphSpeed = 1.5;

    // Scale rất nhẹ - GIẢM 70%
    const scaleX = 1.0 + Math.sin(t * morphSpeed * 0.8) * 0.03 * deformStrength * riseDeformFactor;
    const scaleY = 1.0 + Math.cos(t * morphSpeed * 0.7 + 1.5) * 0.04 * deformStrength * riseDeformFactor;
    const scaleZ = 1.0 + Math.sin(t * morphSpeed * 0.9 + 0.8) * 0.025 * deformStrength * riseDeformFactor;

    // Cập nhật vị trí particles
    for (let i = 0; i < totalParticles; i++) {
      const blobX = heartParticles.blobPositions[i * 3 + 0];
      const blobY = heartParticles.blobPositions[i * 3 + 1];
      const blobZ = heartParticles.blobPositions[i * 3 + 2];

      const heartX = heartParticles.heartPositions[i * 3 + 0];
      const heartY = heartParticles.heartPositions[i * 3 + 1];
      const heartZ = heartParticles.heartPositions[i * 3 + 2];

      const noiseOffsetX = heartParticles.noiseOffsets[i * 3 + 0];
      const noiseOffsetY = heartParticles.noiseOffsets[i * 3 + 1];
      const noiseOffsetZ = heartParticles.noiseOffsets[i * 3 + 2];

      // ===== Bắt đầu với vị trí blob cơ bản =====
      let deformedX = blobX * blobScaleFactor;
      let deformedY = blobY * blobScaleFactor;
      let deformedZ = blobZ * blobScaleFactor;

      // ===== CHUYỂN ĐỘNG CHO TẤT CẢ PARTICLES - TĂNG CƯỜNG =====
      const tailDistFromCenter = Math.sqrt(blobX * blobX + blobY * blobY + blobZ * blobZ);
      const sphereRadius = 3.0; // blobRadius * heartScale
      const isTailParticle = tailDistFromCenter > sphereRadius * 1.15; // Xa hơn bề mặt cầu = tia

      // Tính hướng từ tâm ra ngoài
      const particleDirX = tailDistFromCenter > 0.001 ? blobX / tailDistFromCenter : 0;
      const particleDirY = tailDistFromCenter > 0.001 ? blobY / tailDistFromCenter : 0;
      const particleDirZ = tailDistFromCenter > 0.001 ? blobZ / tailDistFromCenter : 0;

      const wavePhase = noiseOffsetX + noiseOffsetY; // Phase riêng cho mỗi particle

      if (morphProgress < 1) {
        if (isTailParticle) {
          // ===== CHUYỂN ĐỘNG CHO PHẦN ĐUÔI (TIA) - MẠNH HƠN x2 =====

          // Chuyển động sóng - tia dao động ra vào - TĂNG
          const waveSpeed = 3.5;
          const waveAmplitude = 0.6 + (tailDistFromCenter - sphereRadius) * 0.3;
          const radialWave = Math.sin(t * waveSpeed + wavePhase) * waveAmplitude;

          // Sóng thứ 2 - ngược phase
          const wave2 = Math.sin(t * waveSpeed * 0.7 + wavePhase * 1.5 + Math.PI) * waveAmplitude * 0.4;

          // Chuyển động xoắn - tia xoay quanh trục - TĂNG
          const twistSpeed = 2.5;
          const twistAmount = 0.35 * (1 + (tailDistFromCenter - sphereRadius) * 0.2);
          const twistAngle = t * twistSpeed + noiseOffsetZ;

          const perpX = -particleDirY;
          const perpY = particleDirX;
          const twistOffsetX = perpX * Math.sin(twistAngle) * twistAmount;
          const twistOffsetY = perpY * Math.sin(twistAngle) * twistAmount;
          const twistOffsetZ = Math.cos(twistAngle * 0.7) * twistAmount * 0.8;

          // Chuyển động lắc ngang - TĂNG
          const swaySpeed = 2.8;
          const swayAmount = 0.45 * (tailDistFromCenter - sphereRadius) / sphereRadius;
          const swayX = Math.sin(t * swaySpeed + wavePhase * 1.3) * swayAmount;
          const swayY = Math.cos(t * swaySpeed * 0.8 + wavePhase) * swayAmount;

          // Hiệu ứng whip (quất) - tia vẫy mạnh
          const whipSpeed = 4.0;
          const whipAmount = 0.25 * Math.max(0, (tailDistFromCenter - sphereRadius * 1.5) / sphereRadius);
          const whipX = Math.sin(t * whipSpeed + i * 0.01) * whipAmount;
          const whipY = Math.cos(t * whipSpeed * 1.2 + i * 0.015) * whipAmount;

          // Spiral motion - xoáy ốc
          const spiralSpeed = 1.8;
          const spiralRadius = 0.15 * (tailDistFromCenter - sphereRadius) / sphereRadius;
          const spiralAngle = t * spiralSpeed + wavePhase * 2;
          const spiralX = Math.cos(spiralAngle) * spiralRadius;
          const spiralZ = Math.sin(spiralAngle) * spiralRadius;

          deformedX += particleDirX * (radialWave + wave2) + twistOffsetX + swayX + whipX + spiralX;
          deformedY += particleDirY * (radialWave + wave2) + twistOffsetY + swayY + whipY;
          deformedZ += particleDirZ * (radialWave + wave2) * 0.6 + twistOffsetZ + spiralZ;

          // Shimmer - TĂNG
          const shimmerSpeed = 6.0;
          const shimmerAmount = 0.1;
          deformedX += Math.sin(t * shimmerSpeed + i * 0.1) * shimmerAmount;
          deformedY += Math.cos(t * shimmerSpeed * 1.1 + i * 0.15) * shimmerAmount;
          deformedZ += Math.sin(t * shimmerSpeed * 0.9 + i * 0.12) * shimmerAmount * 0.7;

        } else {
          // ===== CHUYỂN ĐỘNG CHO PHẦN CẦU - TĂNG CƯỜNG MẠNH =====

          // 1. Hiệu ứng thở - phồng lên xẹp xuống - TĂNG x2
          const breatheSpeed = 2.0;
          const breatheAmount = 0.35;
          const breathe = Math.sin(t * breatheSpeed) * breatheAmount;
          const breathe2 = Math.sin(t * breatheSpeed * 1.7 + Math.PI * 0.5) * breatheAmount * 0.4;

          // 2. Sóng chạy trên bề mặt cầu - NHIỀU sóng hơn, MẠNH hơn
          const surfaceWaveSpeed = 3.5;
          const surfaceWaveFreq = 4.5;
          const surfaceWave1 = Math.sin(t * surfaceWaveSpeed + particleDirX * surfaceWaveFreq + particleDirY * surfaceWaveFreq * 0.7) * 0.15;
          const surfaceWave2 = Math.sin(t * surfaceWaveSpeed * 1.3 - particleDirY * surfaceWaveFreq * 1.2 + particleDirZ * surfaceWaveFreq) * 0.1;
          const surfaceWave3 = Math.cos(t * surfaceWaveSpeed * 0.8 + particleDirZ * surfaceWaveFreq * 1.5) * 0.08;
          const surfaceWave = surfaceWave1 + surfaceWave2 + surfaceWave3;

          // 3. Xoáy quanh trục Y - NHANH hơn, MẠNH hơn
          const sphereRotateSpeed = 1.2;
          const rotateAmount = 0.25;
          const rotateAngle = t * sphereRotateSpeed + wavePhase * 0.5;
          const rotateOffsetX = -particleDirZ * Math.sin(rotateAngle) * rotateAmount;
          const rotateOffsetZ = particleDirX * Math.sin(rotateAngle) * rotateAmount;

          // 4. Xoáy thứ hai quanh trục X - TĂNG
          const rotateSpeed2 = 0.9;
          const rotateAmount2 = 0.18;
          const rotateAngle2 = t * rotateSpeed2 + noiseOffsetZ;
          const rotateOffsetY2 = particleDirZ * Math.sin(rotateAngle2) * rotateAmount2;
          const rotateOffsetZ2 = -particleDirY * Math.sin(rotateAngle2) * rotateAmount2;

          // 5. Xoáy thứ ba quanh trục Z - MỚI
          const rotateSpeed3 = 0.7;
          const rotateAmount3 = 0.12;
          const rotateAngle3 = t * rotateSpeed3 + noiseOffsetX * 0.8;
          const rotateOffsetX3 = particleDirY * Math.sin(rotateAngle3) * rotateAmount3;
          const rotateOffsetY3 = -particleDirX * Math.sin(rotateAngle3) * rotateAmount3;

          // 6. Nhiễu bề mặt động - MẠNH hơn x2
          const noiseSpeed = 4.0;
          const noiseAmount = 0.14;
          const dynamicNoise = Math.sin(t * noiseSpeed + noiseOffsetX * 3) * Math.cos(t * noiseSpeed * 0.8 + noiseOffsetY * 2) * noiseAmount;
          const dynamicNoise2 = Math.cos(t * noiseSpeed * 0.7 + noiseOffsetY * 2.5) * Math.sin(t * noiseSpeed * 1.1 + noiseOffsetZ * 1.8) * noiseAmount * 0.8;
          const dynamicNoise3 = Math.sin(t * noiseSpeed * 1.3 + noiseOffsetZ * 2) * noiseAmount * 0.5;

          // 7. Pulsing - co giãn theo nhịp - TĂNG
          const pulseSpeed = 5.0;
          const pulseAmount = 0.1;
          const pulse = Math.sin(t * pulseSpeed + i * 0.02) * pulseAmount;
          const pulse2 = Math.sin(t * pulseSpeed * 0.6 + i * 0.03 + Math.PI) * pulseAmount * 0.5;

          // 8. Wobble - lắc lư không đều - TĂNG x2
          const wobbleSpeed = 3.2;
          const wobbleAmount = 0.12;
          const wobbleX = Math.sin(t * wobbleSpeed + wavePhase * 2) * wobbleAmount;
          const wobbleY = Math.cos(t * wobbleSpeed * 0.9 + wavePhase * 1.5) * wobbleAmount;
          const wobbleZ = Math.sin(t * wobbleSpeed * 1.1 + wavePhase * 1.8) * wobbleAmount;

          // 9. Ripple effect - sóng lan từ tâm - TĂNG
          const rippleSpeed = 4.0;
          const rippleFreq = 6.0;
          const distanceFromPole = Math.sqrt(particleDirX * particleDirX + particleDirZ * particleDirZ);
          const ripple = Math.sin(t * rippleSpeed - distanceFromPole * rippleFreq) * 0.08;
          const ripple2 = Math.sin(t * rippleSpeed * 1.5 - distanceFromPole * rippleFreq * 0.7 + Math.PI) * 0.05;

          // 10. Bulge effect - phồng lên ở các vùng ngẫu nhiên - MỚI
          const bulgeSpeed = 1.5;
          const bulgePhase1 = Math.sin(t * bulgeSpeed + particleDirX * 3) * Math.cos(t * bulgeSpeed * 0.8 + particleDirY * 2);
          const bulgePhase2 = Math.sin(t * bulgeSpeed * 1.2 + particleDirZ * 2.5);
          const bulge = (bulgePhase1 + bulgePhase2) * 0.08;

          // 11. Jitter - rung nhẹ ngẫu nhiên - MỚI
          const jitterAmount = 0.03;
          const jitterX = (Math.sin(t * 15 + i * 0.5) + Math.sin(t * 23 + i * 0.7)) * jitterAmount;
          const jitterY = (Math.cos(t * 17 + i * 0.6) + Math.cos(t * 19 + i * 0.4)) * jitterAmount;
          const jitterZ = (Math.sin(t * 21 + i * 0.8) + Math.sin(t * 13 + i * 0.3)) * jitterAmount;

          // Áp dụng TẤT CẢ chuyển động cho cầu
          deformedX += particleDirX * (breathe + breathe2 + surfaceWave + pulse + pulse2 + ripple + ripple2 + bulge) + rotateOffsetX + rotateOffsetX3 + dynamicNoise + wobbleX + jitterX;
          deformedY += particleDirY * (breathe + breathe2 + surfaceWave + pulse + pulse2 + bulge) + rotateOffsetY2 + rotateOffsetY3 + dynamicNoise * 0.8 + dynamicNoise2 + wobbleY + jitterY;
          deformedZ += particleDirZ * (breathe + breathe2 + surfaceWave + pulse + pulse2 + ripple + ripple2 + bulge) + rotateOffsetZ + rotateOffsetZ2 + dynamicNoise * 0.6 + dynamicNoise3 + wobbleZ + jitterZ;

          // 12. Shimmer mạnh hơn x2
          const sphereShimmer = 0.08;
          deformedX += Math.sin(t * 6.0 + i * 0.05) * sphereShimmer;
          deformedY += Math.cos(t * 5.5 + i * 0.07) * sphereShimmer;
          deformedZ += Math.sin(t * 5.8 + i * 0.06) * sphereShimmer;
        }
      }

      // ===== Áp dụng scale nhẹ cho từng trục =====
      deformedX *= scaleX;
      deformedY *= scaleY;
      deformedZ *= scaleZ;

      // ===== Áp dụng các bump (phần lồi) - GIẢM MẠNH =====
      const distFromCenter = Math.sqrt(deformedX * deformedX + deformedY * deformedY + deformedZ * deformedZ);
      if (distFromCenter > 0.001) {
        const dirX = deformedX / distFromCenter;
        const dirY = deformedY / distFromCenter;
        const dirZ = deformedZ / distFromCenter;

        let totalBumpOffset = 0;
        for (const bump of activeBumps) {
          const dot = dirX * bump.x + dirY * bump.y + dirZ * bump.z;
          const influence = Math.max(0, (dot - (1 - bump.radius)) / bump.radius);
          const smoothInfluence = influence * influence * (3 - 2 * influence);
          totalBumpOffset += smoothInfluence * bump.strength;
        }

        // Giảm bump scale
        const bumpScale = 0.5;
        deformedX += dirX * totalBumpOffset * bumpScale;
        deformedY += dirY * totalBumpOffset * bumpScale;
        deformedZ += dirZ * totalBumpOffset * bumpScale;
      }

      // ===== Thêm noise rất nhẹ =====
      const particleNoise = noise3D(
        noiseOffsetX,
        noiseOffsetY,
        noiseOffsetZ,
        t * 1.5
      ) * 0.05 * deformStrength * blobScaleFactor * riseDeformFactor;

      deformedX += particleNoise;
      deformedY += particleNoise * 0.8;
      deformedZ += particleNoise * 0.9;

      // ===== Morph TRỰC TIẾP từ vị trí hiện tại sang trái tim =====
      // Mỗi particle di chuyển thẳng từ vị trí blob của nó đến vị trí heart tương ứng
      // KHÔNG đi qua tâm
      const finalX = deformedX + (heartX - deformedX) * easedMorphProgress;
      const finalY = deformedY + (heartY - deformedY) * easedMorphProgress;
      const finalZ = deformedZ + (heartZ - deformedZ) * easedMorphProgress;

      posAttr.setXYZ(i, finalX, finalY, finalZ);

      // ===== Spawn smoke cluster từ VIỀN blob - bay ra ngoài một chiều =====
      const shouldSpawn = (riseProgress < 1) || (morphProgress > 0 && morphProgress < 0.8);

      if (shouldSpawn) {
        // Tỉ lệ spawn
        const spawnChance = morphProgress > 0
          ? 0.002 * (1 - morphProgress)
          : 0.003;

        if (Math.random() < spawnChance) {
          // Vị trí trên viền blob
          const blobSurfaceX = deformedX;
          const blobSurfaceY = deformedY;
          const blobSurfaceZ = deformedZ;

          // Tính vị trí world (trên viền blob)
          const rotatedStartX = -blobSurfaceX;
          const rotatedStartY = blobSurfaceZ;
          const rotatedStartZ = blobSurfaceY;

          const startWorldX = position[0] + rotatedStartX * 0.44;
          const startWorldY = position[1] + currentYPosition + rotatedStartY * 0.44;
          const startWorldZ = position[2] + rotatedStartZ * 0.44;

          // Hướng bay ra (từ tâm ra ngoài)
          const particleDist = Math.sqrt(blobSurfaceX * blobSurfaceX + blobSurfaceY * blobSurfaceY + blobSurfaceZ * blobSurfaceZ);

          const baseX = -blobSurfaceX / particleDist;
          const baseZ = blobSurfaceY / particleDist;

          // If this spawn is coming from the lower third, prefer spike clusters
          const lowerThreshold = -1.5; // tham số: phần dưới của shape
          const isLower = blobSurfaceY < lowerThreshold;

          if (isLower) {
            // Spike: higher chance and more radial spread
            const spikeChance = Math.min(0.02, spawnChance * 8);
            if (Math.random() < spikeChance) {
              // mạnh hơn dọc theo hướng base, chỉ thêm chút nhiễu bên cạnh
              const outDir = new THREE.Vector3(
                baseX + (Math.random() - 0.5) * 0.25,
                blobSurfaceZ / particleDist + (Math.random() - 0.5) * 0.12,
                baseZ + (Math.random() - 0.5) * 0.25
              ).normalize();
              spawnSpikeCluster(startWorldX, startWorldY, startWorldZ, outDir);
            }
          } else {
            // Thêm random nhỏ để tạo góc khác nhau
            const randomAngle = (Math.random() - 0.5) * 0.5; // Random góc
            const cosA = Math.cos(randomAngle);
            const sinA = Math.sin(randomAngle);

            const outDir = new THREE.Vector3(
              baseX * cosA - baseZ * sinA,
              blobSurfaceZ / particleDist + (Math.random() - 0.5) * 0.3,
              baseX * sinA + baseZ * cosA
            ).normalize();

            spawnSmokeCluster(startWorldX, startWorldY, startWorldZ, outDir);
          }
        }
      }
    }
    posAttr.needsUpdate = true;

    // ===== Update smoke clusters - bay ra ngoài một chiều, mờ dần =====
    if (smokeGeoRef.current && smokeMatRef.current) {
      const smokePosAttr = smokeGeoRef.current.getAttribute('position') as THREE.BufferAttribute;
      const smokeColorAttr = smokeGeoRef.current.getAttribute('color') as THREE.BufferAttribute;
      const smokeSizeAttr = smokeGeoRef.current.getAttribute('size') as THREE.BufferAttribute;

      const deltaTime = 1 / 60;
      let particleIndex = 0;

      // Update từng cluster
      for (let c = 0; c < smokeClustersRef.current.length; c++) {
        const cluster = smokeClustersRef.current[c];

        // Update life
        cluster.life -= deltaTime / cluster.maxLife;

        if (cluster.life > 0) {
          // ===== Bay ra ngoài một chiều - di chuyển theo velocity =====
          cluster.center.add(cluster.velocity.clone().multiplyScalar(deltaTime));

          // Giảm tốc dần (drag) - rất nhẹ để bay xa
          cluster.velocity.multiplyScalar(0.995);

          // Thêm một chút gravity nhẹ
          cluster.velocity.y -= 0.002 * deltaTime;

          // Update rotation và tilt (xoay chậm)
          cluster.rotation += cluster.rotationSpeed * deltaTime;
          cluster.tiltAngle += cluster.tiltSpeed * deltaTime;

          // Mảnh vỡ giữ nguyên hình dạng, chỉ mờ dần
          const disperseFactor = 1.0;

          // Màu và opacity - mờ dần theo life
          const lifeFactor = cluster.life;
          const fadeColor = lifeFactor * lifeFactor; // Fade out mượt

          // Ma trận xoay 3D với góc ban đầu random
          const totalRotY = cluster.rotation + cluster.initialRotationX;
          const totalRotX = cluster.tiltAngle + cluster.initialRotationZ;

          const cosY = Math.cos(totalRotY);
          const sinY = Math.sin(totalRotY);
          const cosX = Math.cos(totalRotX);
          const sinX = Math.sin(totalRotX);

          // Update từng particle trong cluster
          for (let p = 0; p < cluster.particles.length; p++) {
            if (particleIndex >= maxSmokeParticles) break;

            const particleData = cluster.particles[p];
            const ox = particleData.offset.x * disperseFactor;
            const oy = particleData.offset.y * disperseFactor;
            const oz = particleData.offset.z * disperseFactor;

            // Xoay quanh trục X (tilt)
            const y1 = oy * cosX - oz * sinX;
            const z1 = oy * sinX + oz * cosX;

            // Xoay quanh trục Y (rotation)
            const x2 = ox * cosY + z1 * sinY;
            const z2 = -ox * sinY + z1 * cosY;

            // Vị trí particle = tâm + offset đã xoay
            const px = cluster.center.x + x2;
            const py = cluster.center.y + y1;
            const pz = cluster.center.z + z2;

            smokePosAttr.setXYZ(particleIndex, px, py, pz);

            // Màu cam ấm, mờ dần - với flash effect (chỉ khi color change đã bắt đầu)
            // Màu base bình thường (không glow), chỉ glow khi flash
            const smokeFlash = colorChangeStartRef.current !== null ? flashMultiplierRef.current : 1;
            smokeColorAttr.setXYZ(particleIndex,
              1.0 * fadeColor * smokeFlash,
              0.55 * fadeColor * smokeFlash,
              0.22 * fadeColor * smokeFlash
            );

            // Size: giữ nguyên rồi thu nhỏ dần khi gần hết life
            const sizeFactor = Math.min(1, lifeFactor * 2); // Thu nhỏ ở nửa sau
            smokeSizeAttr.setX(particleIndex, particleData.size * sizeFactor);

            particleIndex++;
          }
        }
      }

      // Hide các particle slots không dùng
      for (let i = particleIndex; i < maxSmokeParticles; i++) {
        smokePosAttr.setXYZ(i, 0, -1000, 0);
        smokeSizeAttr.setX(i, 0);
      }

      // Remove dead clusters
      smokeClustersRef.current = smokeClustersRef.current.filter(c => c.life > 0);

      smokePosAttr.needsUpdate = true;
      smokeColorAttr.needsUpdate = true;
      smokeSizeAttr.needsUpdate = true;

      // Fade out smoke khi morph gần xong, nhưng giữ visible nếu flash đang hoạt động
      const isFlashActive = colorChangeStartRef.current !== null && flashMultiplierRef.current > 1.5;
      if (isFlashActive) {
        // Flash đang hoạt động - giữ opacity cao
        smokeMatRef.current.opacity = Math.min(0.85 * (flashMultiplierRef.current / 2), 1);
      } else if (morphProgress > 0.7) {
        smokeMatRef.current.opacity = Math.max(0, 0.85 * (1 - (morphProgress - 0.7) * 3));
      } else {
        smokeMatRef.current.opacity = 0.85;
      }
    }

    // ===== Phase 2.5: Nhịp đập đầu tiên (sau morph, trước đổi màu) =====
    if (firstBeatStartRef.current !== null && colorChangeStartRef.current === null) {
      // Reset flash multiplier - chưa đến lúc flash
      flashMultiplierRef.current = 1;

      const firstBeatElapsed = t - firstBeatStartRef.current;
      const heartbeatTime = firstBeatElapsed * heartbeatSpeed;
      const beat = Math.sin(heartbeatTime * Math.PI * 2);
      const scaleMultiplier = 1.0 + beat * 0.03;

      for (let i = 0; i < totalParticles; i++) {
        const heartX = heartParticles.heartPositions[i * 3 + 0];
        const heartY = heartParticles.heartPositions[i * 3 + 1];
        const heartZ = heartParticles.heartPositions[i * 3 + 2];

        const shimmer = Math.sin(t * 3 + i * 0.1) * 0.005;

        posAttr.setXYZ(
          i,
          heartX * scaleMultiplier + shimmer,
          heartY * scaleMultiplier,
          heartZ * scaleMultiplier + shimmer
        );
      }
      posAttr.needsUpdate = true;
      heartMatRef.current.opacity = 0.88 + beat * 0.05;
    }

    // ===== Phase 3: Color Change + Heartbeat - BẮT ĐẦU SAU KHI MORPH XONG =====
    // Đổi màu chỉ bắt đầu sau khi morph hoàn thành
    if (colorChangeStartRef.current !== null) {
      const colorElapsed = t - colorChangeStartRef.current;

      // Giai đoạn 1: Lóa sáng (tăng brightness của màu cam)
      const glowProgress = Math.min(colorElapsed / glowDuration, 1);
      const easedGlowProgress = easeInOutQuad(glowProgress);

      // Giai đoạn 2: Đổi màu (từ cam sáng → đỏ) đồng thời giảm độ sáng về bình thường
      const colorStartTime = glowDuration;
      const colorProgress = colorElapsed > colorStartTime
        ? Math.min((colorElapsed - colorStartTime) / colorChangeDuration, 1)
        : 0;
      const easedColorProgress = easeInOutQuad(colorProgress);

      // Tính toán tổng progress để callback
      const totalProgress = glowProgress < 1 ? glowProgress * 0.5 : 0.5 + colorProgress * 0.5;
      if (onColorChangeProgress) {
        onColorChangeProgress(totalProgress);
      }

      // ===== FLASH EFFECT cho TẤT CẢ CÁC DOT khi bắt đầu chuyển màu =====
      // Flash kéo dài 0.5s - sáng lên mượt mà
      const flashDuration = 1;
      let flashMultiplier = 1.5;
      if (colorElapsed < flashDuration) {
        const flashProgress = colorElapsed / flashDuration;
        // Flash sáng lên rồi giảm dần mượt mà (ease out quad)
        const flashIntensity = Math.pow(1 - flashProgress, 2);
        // Flash tăng độ sáng cực mạnh
        flashMultiplier = 1 + flashIntensity * 35; // Tăng 12x độ sáng - rất sáng
      }
      // Cập nhật ref để các particles khác có thể sử dụng
      flashMultiplierRef.current = flashMultiplier;

      // Gọi callback để thông báo cho các component khác về flash multiplier
      if (onFlashProgress) {
        onFlashProgress(flashMultiplier);
      }

      // Đổi màu - LÓA SÁNG với FLASH CỰC MẠNH
      for (let i = 0; i < totalParticles; i++) {
        const originalR = heartParticles.colors[i * 3 + 0];
        const originalG = heartParticles.colors[i * 3 + 1];
        const originalB = heartParticles.colors[i * 3 + 2];

        const brightness = originalR / orangeColor.r;

        let newR, newG, newB;

        if (glowProgress < 1) {
          // Giai đoạn 1: Lóa sáng - tăng brightness của màu cam + FLASH
          // Tăng brightness từ 1x lên 2.5x + flash effect
          const glowMultiplier = 1 + easedGlowProgress * 1.5; // Max 2.5x brightness
          newR = originalR * glowMultiplier * flashMultiplier;
          newG = originalG * glowMultiplier * flashMultiplier;
          newB = originalB * glowMultiplier * flashMultiplier;
        } else {
          // Giai đoạn 2: Đổi từ cam sáng → đỏ, đồng thời giảm độ sáng lại một ít
          // Brightness tăng từ 2.0x lên 2.5x khi hoàn thành đổi màu (trái tim đỏ bớt sáng)
          const glowMultiplier = 1 + easedColorProgress * 0.5; // Từ 2.0 lên 2.5

          // Blend màu từ cam sang đỏ
          const blendedR = orangeColor.r + (redColor.r - orangeColor.r) * easedColorProgress;
          const blendedG = orangeColor.g + (redColor.g - orangeColor.g) * easedColorProgress;
          const blendedB = orangeColor.b + (redColor.b - orangeColor.b) * easedColorProgress;

          newR = blendedR * brightness * glowMultiplier * flashMultiplier;
          newG = blendedG * brightness * glowMultiplier * flashMultiplier;
          newB = blendedB * brightness * glowMultiplier * flashMultiplier;
        }

        colorAttr.setXYZ(i, newR, newG, newB);
      }
      colorAttr.needsUpdate = true;
      // Heartbeat - trái tim đập liên tục sau khi đổi màu xong
      if (colorProgress >= 1) {
        if (!isMorphCompleteRef.current) {
          isMorphCompleteRef.current = true;
        }

        const heartbeatStartTime = colorChangeStartRef.current! + glowDuration + colorChangeDuration;
        const heartbeatElapsed = t - heartbeatStartTime;
        const heartbeatTime = heartbeatElapsed * heartbeatSpeed;
        const beat = Math.sin(heartbeatTime * Math.PI * 2);
        const scaleMultiplier = 1.0 + beat * 0.03;

        for (let i = 0; i < totalParticles; i++) {
          const heartX = heartParticles.heartPositions[i * 3 + 0];
          const heartY = heartParticles.heartPositions[i * 3 + 1];
          const heartZ = heartParticles.heartPositions[i * 3 + 2];

          const shimmer = Math.sin(t * 3 + i * 0.1) * 0.005;

          posAttr.setXYZ(
            i,
            heartX * scaleMultiplier + shimmer,
            heartY * scaleMultiplier, // Không cần cộng targetY vì position của object đã được set
            heartZ * scaleMultiplier + shimmer
          );
        }
        posAttr.needsUpdate = true;
        heartMatRef.current.opacity = 0.88 + beat * 0.05;
      }
    }
  });

  // Hiển thị text ngay khi tim bắt đầu đập
  useEffect(() => {
    if (!textsTriggeredRef.current) {
      const timer = setTimeout(() => {
        setCanShowTexts(true);
        textsTriggeredRef.current = true;
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, []);

  // ===== Render =====
  return (
    <group>
      {/* Trái tim chính - biến đổi từ blob (FILL) */}
      <points
        position={position}
        geometry={heartGeometry}
        rotation={[Math.PI / 2, Math.PI, 0]}
        scale={0.44}
        ref={(p) => {
          pointsRef.current = p as THREE.Points | null;
          if (p) heartGeoRef.current = p.geometry as THREE.BufferGeometry;
        }}
      >
        <pointsMaterial
          ref={heartMatRef}
          size={0.035}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          blending={THREE.NormalBlending}
          depthWrite={false}
          map={dotTexture}
          alphaTest={0.01}
        />
      </points>

      {/* Smoke particles - khói tách ra từ blob */}
      <points
        geometry={smokeGeometry}
        ref={(p) => {
          if (p) smokeGeoRef.current = p.geometry as THREE.BufferGeometry;
        }}
      >
        <pointsMaterial
          ref={smokeMatRef}
          size={0.04}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          map={dotTexture}
          alphaTest={0.01}
        />
      </points>

      {/* Floating texts chạy dọc màn hình - chỉ hiển thị sau khi tim đổi màu 0.1s */}
      {canShowTexts && floatingTextData.map((data, index) => (
        <FloatingText
          key={index}
          text={data.text}
          startX={data.startX}
          startY={data.startY}
          startZ={data.startZ}
          speed={data.speed}
          size={data.size}
          delay={data.delay}
          textColor={textColor}
        />
      ))}
    </group>
  );
}

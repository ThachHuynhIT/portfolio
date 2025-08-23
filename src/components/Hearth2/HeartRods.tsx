import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// =============================
// Magic-number constants
// =============================
const RENDERER_MAX_DPR = 2;

const CAMERA_FOV = 45;
const CAMERA_NEAR = 1;
const CAMERA_FAR = 8000;
const CAMERA_Z = 900;

const HEART_BASE_WIDTH = 32; // base width used by the classic heart equation
const HEART_PARTICLE_COUNT = 120; // small hearts placed along outline

const SMALL_HEART_MIN_SIZE = 16; // px, clamp for outline hearts
const SMALL_TIP_MIN_SIZE = 24; // px, clamp for rod tip hearts
const SMALL_HEART_TINT = "#ff3366"; // fill + glow tint
const SMALL_HEART_CANVAS_SCALE = 2; // offscreen canvas size multiplier
const SMALL_HEART_GLOW_COLOR = "rgba(255,60,120,0.6)"; // giảm opacity để bớt loá
const SMALL_HEART_GLOW_BLUR = 25; // tăng blur để vùng sáng to hơn nhưng mềm hơn

const MARKER_CANVAS_SIZE = 200; // tăng canvas size để có không gian cho vùng sáng rộng hơn
const MARKER_GRAD_INNER_R = 12; // tăng inner radius để vùng sáng trung tâm to hơn
const MARKER_GRAD_OUTER_R = 90; // tăng outer radius để vùng sáng rộng hơn
const MARKER_CIRCLE_R = 95; // tăng circle radius tương ứng
const MARKER_Z = -10; // local z for marker sprite

const GROUP_EXTRA_Z_OFFSET = 0; // additional offset if needed

const ROD_COLOR = 0xff99bb;
const ROD_BACK_Z_OFFSET = -40; // push rods slightly behind the outline
const NEAR_MARGIN_LOCAL = 100; // local-space margin from camera near plane

// Opacity ramp for rods
const ROD_FADE_IN_PORTION = 0.2; // first 20% of travel
const ROD_FADE_OUT_START = 0.85; // start fading at 85%
const ROD_FADE_OUT_PORTION = 0.15; // last 15% of travel

// Small-heart animation
const SMALL_HEART_VISIBLE_THRESHOLD = 0.02; // hide when very faint
const SMALL_HEART_CYCLE_JITTER_RAD = 0.3; // randomize spawn along outline
const SMALL_HEART_EASE_EXP = 1.4; // opacity ease exponent (smoother)

// Speed boost for the flying streaks (rods). Increase >1 for faster motion
const STREAK_SPEED_MULTIPLIER = 3.0; // faster streaks (3x)
const MARKER_SPEED_MULTIPLIER = 2.0; // faster sweep dot // <-- make vệt bay nhanh hơn (2x)

// Bloom/Glow effect constants for rods - Điều chỉnh để sáng đều, vùng sáng to hơn nhưng bớt loá
const ROD_BLOOM_INTENSITY = 1.5; // giảm bloom intensity để bớt loá
const ROD_EMISSIVE_INTENSITY = 0.4; // giảm emissive intensity để bớt loá
const ROD_EMISSIVE_COLOR = 0xff99bb; // same as rod color for glow
const SPLIT_ROD_EMISSIVE_BOOST = 1.0; // giảm boost cho split rods

// Lens flare effect constants for split rods - Vùng sáng to hơn nhưng bớt loá
const LENS_FLARE_INTENSITY = 0.6; // giảm cường độ lens flare
const LENS_FLARE_SIZE = 60; // tăng kích thước lens flare để vùng sáng to hơn và phù hợp với marker
const LENS_FLARE_COUNT = 3; // tăng số lượng lens flare nhưng giảm intensity

// Particle sparkle effect constants - Điều chỉnh cho vùng sáng to hơn nhưng bớt loá
const SPARKLE_COUNT_PER_ROD = 12; // tăng số particle sparkle cho mỗi split rod
const SPARKLE_LIFETIME = 1000; // tăng thời gian sống của sparkle để lan tỏa xa hơn
const SPARKLE_SPEED = 90; // giảm tốc độ bay để sparkle tồn tại lâu hơn
const SPARKLE_SIZE = 6; // tăng kích thước sparkle để vùng sáng to hơn

const TWO_PI = Math.PI * 2;

// Alternative heart shape - more like the simple outline in the image
const getSimpleHeartPoint = (t: number) => {
  // Create a cleaner, more symmetric heart shape
  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const cos2T = Math.cos(2 * t);

  // Simplified parametric equations for a more traditional heart shape
  const x = 16 * sinT * sinT * sinT;
  const y = 13 * cosT - 4 * cos2T - 2 * Math.cos(3 * t);

  return { x, y };
};

// =============================
// Types
// =============================
type RodDirectionMode = "toCamera" | "fromCamera" | "radialOut" | "tangent" | "random";

export type HeartRodsProps = {
  bigHeartWidth?: number;
  bigHeartAspect?: number;

  /** Small heart visuals & motion */
  smallHeartSizePx?: number;
  smallHeartScale?: number; // relative size factor (default 0.6)
  smallHeartMoveMin?: number; // world units (default 10)
  smallHeartMoveMax?: number; // world units (default 24)
  smallHeartPulse?: number; // ± pulsation factor (default 0.06)
  smallHeartLifeMs?: number; // cycle duration (default 1000ms)

  /** Rods */
  rodDirectionMode?: RodDirectionMode;
  rodLengthBase?: number;
  rodLengthJitter?: number;
  rodWidth?: number;
  rodHeight?: number;
  rodDepthAnimate?: boolean;
  rodDepthSpeed?: number; // base speed; multiplied by STREAK_SPEED_MULTIPLIER
  rodDepthMaxAdvance?: number;
  rodOpacity?: number; // base opacity of rods

  /** Sweep marker */
  markerRevsPerSec?: number;
  markerSize?: number;

  /** Depth alignment */
  targetZ?: number;

  style?: React.CSSProperties;
};

const layerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

export default function HeartRods({
  bigHeartWidth = 520,
  bigHeartAspect = 1.1,

  smallHeartSizePx = 48,
  smallHeartScale = 0.6,
  smallHeartMoveMin = 10,
  smallHeartMoveMax = 24,
  smallHeartPulse = 0.06,
  smallHeartLifeMs = 1000,

  rodDirectionMode = "toCamera",
  rodLengthBase = 150,
  rodLengthJitter = 0,
  rodWidth = 5,
  rodHeight = 1.6,
  rodDepthAnimate = true,
  rodDepthSpeed = 200,
  rodDepthMaxAdvance = 1200,
  rodOpacity = 0.85,

  markerRevsPerSec = 0.2,
  markerSize = 130, // tăng kích thước marker để vùng sáng hiển thị rộng hơn

  targetZ = -120,
  style,
}: HeartRodsProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ----- Renderer -----
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDERER_MAX_DPR));
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight, false);

    // Enable enhanced tone mapping cho bloom effect
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // giảm exposure để bớt loá nhưng vẫn giữ bloom

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ----- Scene -----
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // ----- Camera -----
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, mountRef.current.clientWidth / mountRef.current.clientHeight, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(0, 0, CAMERA_Z);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ----- Lighting for enhanced glowing rods -----
    // Ambient light để tạo ánh sáng tổng thể - điều chỉnh cho vùng sáng to hơn nhưng bớt loá
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // giảm intensity
    scene.add(ambientLight);

    // Point light từ camera để làm sáng các rod - điều chỉnh
    const pointLight = new THREE.PointLight(0xff99bb, 2.0, 3500); // giảm intensity, tăng distance
    pointLight.position.copy(camera.position);
    scene.add(pointLight);

    // Thêm point light phụ để tăng cường glow - điều chỉnh
    const auxiliaryPointLight = new THREE.PointLight(0xffffff, 1.4, 2800); // giảm intensity, tăng distance
    auxiliaryPointLight.position.set(0, 0, CAMERA_Z * 0.7);
    scene.add(auxiliaryPointLight);

    // Directional light để tăng cường hiệu ứng - tăng cường
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);

    // Thêm directional light từ phía sau để tạo rim lighting
    const rimLight = new THREE.DirectionalLight(0xff99bb, 0.8);
    rimLight.position.set(0, 0, -1);
    scene.add(rimLight);

    type HeartParticle = THREE.Sprite & {
      basePos: THREE.Vector3;
      baseScale?: number;

      // small-heart loop
      lifeMs: number;
      tOffset: number;
      moveDir?: THREE.Vector3;
      moveDist?: number;

      // small-heart cycle tracking (to randomize per cycle)
      cyclePhase?: number;

      // rods/tip
      rod?: THREE.Mesh;
      rodBaseZ?: number;
      rodAdvanceMax?: number;
      tip?: THREE.Sprite;
      tipOffset?: THREE.Vector3;

      // sweep / activation
      paramT?: number;
      activated?: boolean;
      rodStartSec?: number;

      // split rods (tách vệt sáng)
      hasSplit?: boolean; // đã tách chưa
      splitRods?: SplitRod[]; // các vệt tách ra

      __dispose: () => void;
    };

    type SplitRod = {
      mesh: THREE.Mesh;
      direction: THREE.Vector3;
      baseZ: number;
      advanceMax: number;
      startSec: number;
      originalParent: HeartParticle;
      // Thêm các thuộc tính cho hiệu ứng loá sáng
      lensFlares?: THREE.Sprite[]; // lens flare sprites
      sparkles?: SparkleParticle[]; // sparkle particles
    };

    // Sparkle particle type cho hiệu ứng rải tia sáng
    type SparkleParticle = {
      sprite: THREE.Sprite;
      velocity: THREE.Vector3;
      startTime: number;
      lifetime: number;
      startOpacity: number;
    };
    const createRodMesh = (length: number, width: number, height: number, color = ROD_COLOR, opacity = rodOpacity, isSplitRod = false) => {
      const geom = new THREE.BoxGeometry(width, height, length);

      // Tính toán emissive intensity dựa trên loại rod
      const baseEmissiveIntensity = isSplitRod ? ROD_EMISSIVE_INTENSITY * SPLIT_ROD_EMISSIVE_BOOST : ROD_EMISSIVE_INTENSITY;

      // Sử dụng MeshStandardMaterial với emissive đều để sáng toàn bộ chiều dài
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        emissive: new THREE.Color(ROD_EMISSIVE_COLOR),
        emissiveIntensity: baseEmissiveIntensity,
        metalness: 0.2, // tăng lên để giảm độ sáng
        roughness: 0.4, // tăng lên để giảm shine, tạo vùng sáng mềm hơn
        toneMapped: false, // giữ để hiệu ứng bloom hoạt động
      });

      // Sử dụng Normal Blending thay vì Additive để giảm độ sáng chồng chéo
      if (isSplitRod) {
        mat.blending = THREE.NormalBlending; // thay đổi từ AdditiveBlending
        mat.depthWrite = true; // bật lại depth write
      }
      const mesh = new THREE.Mesh(geom, mat) as unknown as THREE.Mesh & { __dispose: () => void };
      (mesh as any).__dispose = () => {
        geom.dispose();
        mat.dispose();
      };
      return mesh;
    };

    const createHeartSprite = (sizePx = SMALL_HEART_MIN_SIZE, tint = SMALL_HEART_TINT) => {
      const canvas = document.createElement("canvas");
      const s = sizePx * SMALL_HEART_CANVAS_SCALE;
      canvas.width = canvas.height = s;
      const ctx = canvas.getContext("2d")!;

      ctx.translate(s / 2, s / 2);
      ctx.beginPath();
      const scale = sizePx / HEART_BASE_WIDTH;
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * TWO_PI;
        const point = getSimpleHeartPoint(t);
        const x = point.x;
        const y = point.y;
        if (i === 0) ctx.moveTo(x * scale, y * scale);
        else ctx.lineTo(x * scale, y * scale);
      }
      ctx.closePath();
      ctx.fillStyle = tint;

      // soft glow
      ctx.shadowColor = SMALL_HEART_GLOW_COLOR;
      ctx.shadowBlur = SMALL_HEART_GLOW_BLUR;
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;

      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      mat.rotation = Math.PI; // tip down

      const sprite = new THREE.Sprite(mat) as HeartParticle;
      sprite.scale.set(s / 2, s / 2, 1);

      (sprite as any).__dispose = () => {
        tex.dispose();
        mat.dispose();
        (sprite.rod as any)?.__dispose?.();
      };

      // small-heart lifecycle: default 1s
      sprite.lifeMs = smallHeartLifeMs;
      sprite.tOffset = Math.random() * sprite.lifeMs;

      return sprite;
    };

    // helpers
    const disposeSprite = (s: any) => {
      if (!s) return;
      if (s.material?.map) s.material.map.dispose?.();
      s.material?.dispose?.();
      s.__dispose?.();
    };

    const disposeMesh = (m: any) => {
      if (!m) return;
      m.geometry?.dispose?.();
      m.material?.dispose?.();
      m.__dispose?.();
    };

    // Tạo lens flare sprite cho hiệu ứng loá sáng - cải thiện để vùng sáng rộng hơn
    const createLensFlare = (size: number, color: THREE.Color, intensity: number) => {
      const canvas = document.createElement("canvas");
      const canvasSize = size * 3; // tăng canvas size để có không gian cho glow rộng hơn
      canvas.width = canvas.height = canvasSize;
      const ctx = canvas.getContext("2d")!;

      // Tạo radial gradient cho lens flare với nhiều layer
      // Layer ngoài cùng - glow rộng và mờ
      const outerGradient = ctx.createRadialGradient(canvasSize / 2, canvasSize / 2, 0, canvasSize / 2, canvasSize / 2, canvasSize / 2);

      const r = Math.floor(color.r * 255);
      const g = Math.floor(color.g * 255);
      const b = Math.floor(color.b * 255);

      outerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`);
      outerGradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${intensity * 0.2})`);
      outerGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity * 0.1})`);
      outerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = outerGradient;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Layer trong - glow chính
      const innerGradient = ctx.createRadialGradient(canvasSize / 2, canvasSize / 2, 0, canvasSize / 2, canvasSize / 2, canvasSize / 3);

      innerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
      innerGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${intensity * 0.6})`);
      innerGradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${intensity * 0.2})`);
      innerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = innerGradient;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size * 1.2, size * 1.2, 1); // tăng scale để vùng sáng hiển thị rộng hơn

      (sprite as any).__dispose = () => {
        texture.dispose();
        material.dispose();
      };

      return sprite;
    };

    // Tạo sparkle particle cho hiệu ứng rải tia sáng
    const createSparkle = (position: THREE.Vector3, velocity: THREE.Vector3, currentTime: number) => {
      const canvas = document.createElement("canvas");
      const size = SPARKLE_SIZE;
      canvas.width = canvas.height = size * 3; // tăng canvas để vùng glow to hơn
      const ctx = canvas.getContext("2d")!;

      // Tạo star shape với glow effect mạnh hơn
      ctx.translate(size * 1.5, size * 1.5);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // giảm opacity để bớt loá
      ctx.shadowColor = "rgba(255, 153, 187, 0.6)"; // giảm shadow opacity
      ctx.shadowBlur = 8; // tăng blur để glow to hơn

      // Vẽ ngôi sao 4 cánh to hơn
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? size * 0.5 : size * 0.2; // tăng radius
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.NormalBlending, // thay đổi từ AdditiveBlending để bớt loá
        depthWrite: false,
        toneMapped: false,
      });

      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size * 1.5, size * 1.5, 1); // tăng scale để to hơn
      sprite.position.copy(position);

      const sparkle: SparkleParticle = {
        sprite,
        velocity: velocity.clone(),
        startTime: currentTime,
        lifetime: SPARKLE_LIFETIME + Math.random() * 300, // tăng random range
        startOpacity: 0.6 + Math.random() * 0.2, // giảm opacity để bớt loá
      };

      (sprite as any).__dispose = () => {
        texture.dispose();
        material.dispose();
      };

      return sparkle;
    };

    // Tạo split rod từ rod gốc - song song với vệt gốc (không có tip)
    const createSplitRod = (parentParticle: HeartParticle, currentTime: number): SplitRod | null => {
      if (!parentParticle.rod || !heartGroup) return null;

      const parentRod = parentParticle.rod as THREE.Mesh;
      const length = rodLengthBase * 0.7 + (Math.random() * 2 - 1) * (rodLengthJitter * 0.3); // nhỏ hơn rod gốc

      // Tạo rod mới với enhanced glow cho split rod
      const splitMesh = createRodMesh(length, rodWidth * 0.6, rodHeight * 0.6, ROD_COLOR, rodOpacity * 0.8, true);

      // Sử dụng cùng hướng với rod gốc (song song)
      const splitDirection = new THREE.Vector3(0, 0, 1);
      splitMesh.quaternion.copy(parentRod.quaternion); // copy cùng rotation

      // Tạo offset vị trí ngẫu nhiên xung quanh rod gốc (để tách ra)
      const offsetRadius = 15 + Math.random() * 10; // 15-25 units từ rod gốc
      const offsetAngle = Math.random() * Math.PI * 2; // góc ngẫu nhiên
      const offsetX = Math.cos(offsetAngle) * offsetRadius;
      const offsetY = Math.sin(offsetAngle) * offsetRadius;

      // Vị trí xuất phát: vị trí rod gốc + offset
      const currentPos = parentRod.position.clone();
      const half = length / 2;
      const splitPos = currentPos.clone();
      splitPos.x += offsetX; // offset theo X
      splitPos.y += offsetY; // offset theo Y
      splitPos.add(splitDirection.clone().multiplyScalar(-half));
      splitPos.z += ROD_BACK_Z_OFFSET - 5; // hơi lùi lại so với rod gốc
      splitMesh.position.copy(splitPos);

      // Tính advance max
      const baseZ = splitMesh.position.z;
      const groupZ = heartGroup.position.z;
      const allowedLocalMaxByCamera = camera.position.z - NEAR_MARGIN_LOCAL - groupZ;
      const maxAllowed = Math.max(0, Math.min(rodDepthMaxAdvance, allowedLocalMaxByCamera - baseZ));

      // Set opacity và visibility
      (splitMesh.material as THREE.MeshStandardMaterial).opacity = 0;
      (splitMesh.material as THREE.MeshStandardMaterial).transparent = true;
      splitMesh.visible = true;

      // Thêm vào scene (chỉ có mesh, không có tip)
      heartGroup.add(splitMesh);

      // Tạo lens flares cho split rod
      const lensFlares: THREE.Sprite[] = [];
      for (let i = 0; i < LENS_FLARE_COUNT; i++) {
        const flareSize = LENS_FLARE_SIZE * (0.5 + Math.random() * 0.5);
        const flareColor = new THREE.Color(ROD_EMISSIVE_COLOR);
        const flareIntensity = LENS_FLARE_INTENSITY * (0.7 + Math.random() * 0.3);
        const lensFlare = createLensFlare(flareSize, flareColor, flareIntensity);

        // Vị trí lens flare gần đầu rod
        const flareOffset = splitDirection.clone().multiplyScalar(length * 0.3 + i * 5);
        lensFlare.position.copy(splitPos).add(flareOffset);
        lensFlare.visible = false; // sẽ hiển thị khi rod active

        heartGroup.add(lensFlare);
        lensFlares.push(lensFlare);
      }

      // Tạo sparkles cho split rod
      const sparkles: SparkleParticle[] = [];
      for (let i = 0; i < SPARKLE_COUNT_PER_ROD; i++) {
        // Vị trí sparkle ngẫu nhiên quanh rod
        const sparklePos = splitPos.clone();
        sparklePos.x += (Math.random() - 0.5) * 20;
        sparklePos.y += (Math.random() - 0.5) * 20;
        sparklePos.z += (Math.random() - 0.5) * 10;

        // Velocity ngẫu nhiên
        const sparkleVel = new THREE.Vector3(
          (Math.random() - 0.5) * SPARKLE_SPEED,
          (Math.random() - 0.5) * SPARKLE_SPEED,
          Math.random() * SPARKLE_SPEED * 0.5
        );

        const sparkle = createSparkle(sparklePos, sparkleVel, currentTime);
        sparkle.sprite.visible = false; // sẽ hiển thị khi rod active

        heartGroup.add(sparkle.sprite);
        sparkles.push(sparkle);
      }

      const splitRod: SplitRod = {
        mesh: splitMesh,
        direction: splitDirection,
        baseZ: baseZ,
        advanceMax: maxAllowed,
        startSec: currentTime,
        originalParent: parentParticle,
        lensFlares,
        sparkles,
      };

      return splitRod;
    };

    // state
    let heartGroup: THREE.Group | null = null;
    let heartParticles: HeartParticle[] = [];
    let allSplitRods: SplitRod[] = []; // theo dõi tất cả split rods
    let markerSprite: (THREE.Sprite & { __dispose?: () => void }) | null = null;
    let markerAngle = 0;
    let prevMarkerAngle = 0;

    let heartScaleX = 1;
    let heartScaleY = 1;

    const buildHeart = () => {
      if (heartGroup) {
        scene.remove(heartGroup);
        // Cleanup split rods
        for (const splitRod of allSplitRods) {
          disposeMesh(splitRod.mesh);
          // Cleanup lens flares
          if (splitRod.lensFlares) {
            for (const flare of splitRod.lensFlares) {
              disposeSprite(flare);
            }
          }
          // Cleanup sparkles
          if (splitRod.sparkles) {
            for (const sparkle of splitRod.sparkles) {
              disposeSprite(sparkle.sprite);
            }
          }
        }
        allSplitRods = [];

        for (const p of heartParticles) {
          disposeSprite(p.tip);
          disposeMesh(p.rod);
          p.__dispose?.();
        }
        heartParticles = [];
        heartGroup = null;
      }

      heartGroup = new THREE.Group();
      heartGroup.position.set(0, 0, targetZ + GROUP_EXTRA_Z_OFFSET);
      scene.add(heartGroup);

      const w = bigHeartWidth;
      const scaleX = w / HEART_BASE_WIDTH;
      const scaleY = (w / HEART_BASE_WIDTH) * bigHeartAspect;
      heartScaleX = scaleX;
      heartScaleY = scaleY;

      const count = HEART_PARTICLE_COUNT;
      for (let i = 0; i < count; i++) {
        const t = (i / count) * TWO_PI;

        // curve point (scaled) - using new heart shape
        const point = getSimpleHeartPoint(t);
        const hx = point.x;
        const hy = point.y;
        const px = hx * scaleX;
        const py = hy * scaleY;

        // SMALL HEART: smaller size + motion parameters
        const p = createHeartSprite(Math.max(SMALL_HEART_MIN_SIZE, smallHeartSizePx * smallHeartScale));
        p.position.set(px, py, 0);
        p.basePos = new THREE.Vector3(px, py, 0);
        p.baseScale = p.scale.x;

        const ang = Math.random() * TWO_PI;
        p.moveDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0);
        p.moveDist = smallHeartMoveMin + Math.random() * Math.max(0, smallHeartMoveMax - smallHeartMoveMin);

        // rods
        p.paramT = t;
        p.activated = false;
        p.rodStartSec = undefined;
        p.hasSplit = false; // chưa tách
        p.splitRods = []; // mảng chứa các rod tách ra

        const length = rodLengthBase + (Math.random() * 2 - 1) * rodLengthJitter;
        const rod = createRodMesh(length, rodWidth, rodHeight, ROD_COLOR, rodOpacity);

        // directions
        const toCamera = new THREE.Vector3(0, 0, 1);
        const fromCamera = new THREE.Vector3(0, 0, -1);
        const radialOut = new THREE.Vector3(px, py, 0).normalize();

        // tangent (scaled) - derivatives for simplified heart shape
        const sinT = Math.sin(t);
        const cosT = Math.cos(t);
        const dx_dt = 16 * 3 * sinT * sinT * cosT;
        const dy_dt = -13 * sinT + 8 * Math.sin(2 * t) + 6 * Math.sin(3 * t);
        const tangent = new THREE.Vector3(dx_dt * scaleX, dy_dt * scaleY, 0).normalize();

        let dir: THREE.Vector3;
        switch (rodDirectionMode) {
          case "fromCamera":
            dir = fromCamera;
            break;
          case "radialOut":
            dir = radialOut.lengthSq() > 0 ? radialOut : new THREE.Vector3(1, 0, 0);
            break;
          case "tangent":
            dir = tangent.lengthSq() > 0 ? tangent : new THREE.Vector3(1, 0, 0);
            break;
          case "random":
            dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            break;
          case "toCamera":
          default:
            dir = toCamera;
            break;
        }

        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
        rod.quaternion.copy(q);

        const half = length / 2;
        const rodPos = new THREE.Vector3(px, py, 0).add(dir.clone().multiplyScalar(-half));
        const dirTowardCamera = dir.z > 0.5;
        if (dirTowardCamera) rodPos.add(new THREE.Vector3(0, 0, -length * 0.6));
        rodPos.z += ROD_BACK_Z_OFFSET; // push slightly back
        rod.position.copy(rodPos);

        const baseZ = rod.position.z;
        const groupZ = heartGroup.position.z;
        const allowedLocalMaxByCamera = camera.position.z - NEAR_MARGIN_LOCAL - groupZ;
        const maxAllowed = Math.max(0, Math.min(rodDepthMaxAdvance, allowedLocalMaxByCamera - baseZ));
        p.rod = rod as any;
        p.rodBaseZ = baseZ;
        p.rodAdvanceMax = maxAllowed;

        // choose forward “head” for the tip
        const localHalf = new THREE.Vector3(0, 0, length / 2);
        const headA = localHalf.clone().applyQuaternion(rod.quaternion);
        const headB = headA.clone().multiplyScalar(-1);
        const worldZ_A = groupZ + rod.position.z + headA.z;
        const worldZ_B = groupZ + rod.position.z + headB.z;
        const tipOffset = worldZ_A >= worldZ_B ? headA : headB;

        const tip = createHeartSprite(Math.max(SMALL_TIP_MIN_SIZE, smallHeartSizePx * Math.min(1, smallHeartScale)));
        tip.position.set(rod.position.x + tipOffset.x, rod.position.y + tipOffset.y, rod.position.z + tipOffset.z);
        p.tip = tip;
        p.tipOffset = tipOffset.clone();

        (rod.material as THREE.MeshStandardMaterial).opacity = 0;
        (rod.material as THREE.MeshStandardMaterial).transparent = true;
        rod.visible = false;

        (tip.material as THREE.SpriteMaterial).opacity = 0;
        tip.visible = false;

        heartGroup.add(rod, tip, p);
        heartParticles.push(p);
      }

      // marker
      if (markerSprite) {
        heartGroup.remove(markerSprite);
        disposeSprite(markerSprite);
      }

      const markerCanvas = document.createElement("canvas");
      markerCanvas.width = markerCanvas.height = MARKER_CANVAS_SIZE;
      const mctx = markerCanvas.getContext("2d")!;

      // Tạo nhiều layer gradient để vùng sáng rộng hơn và mượt hơn
      // Layer 1: Glow ngoài cùng rộng nhất
      const outerGrd = mctx.createRadialGradient(
        MARKER_CANVAS_SIZE / 2,
        MARKER_CANVAS_SIZE / 2,
        0,
        MARKER_CANVAS_SIZE / 2,
        MARKER_CANVAS_SIZE / 2,
        MARKER_CANVAS_SIZE / 2 - 5
      );
      outerGrd.addColorStop(0, "rgba(255,180,200,0.15)");
      outerGrd.addColorStop(0.6, "rgba(255,120,180,0.08)");
      outerGrd.addColorStop(1, "rgba(255,120,180,0)");
      mctx.fillStyle = outerGrd;
      mctx.fillRect(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE);

      // Layer 2: Gradient chính
      const grd = mctx.createRadialGradient(
        MARKER_CANVAS_SIZE / 2,
        MARKER_CANVAS_SIZE / 2,
        MARKER_GRAD_INNER_R,
        MARKER_CANVAS_SIZE / 2,
        MARKER_CANVAS_SIZE / 2,
        MARKER_GRAD_OUTER_R
      );
      grd.addColorStop(0, "rgba(255,200,230,1)");
      grd.addColorStop(0.3, "rgba(255,160,200,0.8)");
      grd.addColorStop(0.6, "rgba(255,120,180,0.4)");
      grd.addColorStop(1, "rgba(255,120,180,0)");
      mctx.fillStyle = grd;
      mctx.beginPath();
      mctx.arc(MARKER_CANVAS_SIZE / 2, MARKER_CANVAS_SIZE / 2, MARKER_CIRCLE_R, 0, TWO_PI);
      mctx.fill();

      const mtex = new THREE.CanvasTexture(markerCanvas);
      mtex.minFilter = THREE.LinearFilter;
      mtex.magFilter = THREE.LinearFilter;
      const mmat = new THREE.SpriteMaterial({
        map: mtex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending, // thêm additive blending để glow sáng hơn
        toneMapped: false, // không bị tone mapping để giữ nguyên độ sáng
      });
      const ms = new THREE.Sprite(mmat) as any;
      ms.scale.set(markerSize, markerSize, 1);
      ms.__dispose = () => {
        mtex.dispose();
        mmat.dispose();
      };
      markerSprite = ms;
      if (markerSprite) {
        heartGroup.add(markerSprite);
      }

      markerAngle = 0;
      prevMarkerAngle = 0;
    };

    buildHeart();

    // ----- Animation -----
    let rafId = 0;
    const clock = new THREE.Clock();
    let rodTimeSec = 0;
    let heartsTimeMs = 0;

    // Hàm tính tốc độ marker dựa trên vị trí (0-1)
    const getMarkerSpeedMultiplier = (normalizedPosition: number): number => {
      const pos = normalizedPosition; // 0-1

      // Chuyển đổi sang phần trăm để dễ hiểu
      const percentage = pos * 100;

      // Định nghĩa các zone tăng tốc
      if (percentage >= 0 && percentage <= 5) {
        // Khúc bắt đầu: tăng tốc 2x
        return 3;
      } else if (percentage >= 45 && percentage <= 55) {
        // Khúc giữa: tăng tốc 2x
        return 3;
      } else if (percentage >= 95 && percentage <= 100) {
        // Khúc kết thúc: tăng tốc 2x
        return 3;
      } else {
        return 1.0;
        // Tốc độ bình thường
      }
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dtMs = clock.getDelta() * 1000;
      const dtSec = dtMs / 1000;
      rodTimeSec += dtSec;
      heartsTimeMs += dtMs;

      // move marker along the curve
      if (heartGroup && markerSprite) {
        // Tính vị trí hiện tại của marker (0-1)
        const normalizedPosition = markerAngle / TWO_PI;

        // Lấy multiplier tốc độ dựa trên vị trí
        const speedMultiplier = getMarkerSpeedMultiplier(normalizedPosition);

        // Áp dụng tốc độ có điều chỉnh
        const adjustedMarkerSpeed = markerRevsPerSec * MARKER_SPEED_MULTIPLIER * speedMultiplier;
        const dAngle = adjustedMarkerSpeed * TWO_PI * dtSec;

        prevMarkerAngle = markerAngle;
        markerAngle = (markerAngle + dAngle) % TWO_PI;

        const markerPoint = getSimpleHeartPoint(markerAngle);
        const hx = markerPoint.x;
        const hy = markerPoint.y;
        const mx = hx * heartScaleX;
        const my = hy * heartScaleY;
        markerSprite.position.set(mx, my, MARKER_Z);

        // trigger activations when marker sweeps past
        for (const p of heartParticles) {
          const r = p.rod as THREE.Mesh | undefined;
          if (p.activated) continue;
          const t = p.paramT ?? 0;

          let passed = false;
          if (markerAngle >= prevMarkerAngle) passed = t > prevMarkerAngle && t <= markerAngle;
          else passed = t > prevMarkerAngle || t <= markerAngle;

          if (passed) {
            p.activated = true;
            p.rodStartSec = rodTimeSec;

            if (r) {
              // snap head to the border at activation
              const tipZ = p.tipOffset?.z ?? 0;
              const newBaseZ = -tipZ;
              r.position.z = newBaseZ;
              p.rodBaseZ = newBaseZ;

              const groupZ = heartGroup!.position.z;
              const allowedLocalMaxByCamera = camera.position.z - NEAR_MARGIN_LOCAL - groupZ;
              p.rodAdvanceMax = Math.max(0, Math.min(rodDepthMaxAdvance, allowedLocalMaxByCamera - newBaseZ));

              r.visible = true;
              (r.material as THREE.MeshStandardMaterial).opacity = 0;
            }
            if (p.tip) {
              p.tip.visible = true;
              (p.tip.material as THREE.SpriteMaterial).opacity = 0;
            }
          }
        }
      }

      // rods/tips motion & fade
      if (rodDepthAnimate && heartGroup) {
        for (const p of heartParticles) {
          const r = p.rod as THREE.Mesh | undefined;
          const advMax = p.rodAdvanceMax ?? 0;
          if (!r || p.rodBaseZ == null || advMax <= 0) continue;

          const rm = r.material as THREE.MeshStandardMaterial;
          const startSec = p.rodStartSec ?? rodTimeSec;

          // Apply speed multiplier here to make streaks fly faster
          const effectiveSpeed = rodDepthSpeed * STREAK_SPEED_MULTIPLIER;
          const dist = Math.max(0, (rodTimeSec - startSec) * effectiveSpeed);
          const adv = Math.min(dist, advMax);

          // move
          r.position.z = p.activated ? p.rodBaseZ + adv : p.rodBaseZ;

          // Tính tỷ lệ tiến trình (0-1)
          const progress = advMax > 0 ? adv / advMax : 0;

          // Tách vệt sáng khi đạt 5% và chưa tách
          if (progress >= 0.05 && !p.hasSplit && p.activated) {
            p.hasSplit = true;

            // Tạo 2-3 split rods ngẫu nhiên
            const numSplits = Math.floor(Math.random() * 2) + 2; // 2 hoặc 3

            for (let i = 0; i < numSplits; i++) {
              const splitRod = createSplitRod(p, rodTimeSec);
              if (splitRod) {
                p.splitRods!.push(splitRod);
                allSplitRods.push(splitRod);
              }
            }
          }

          // opacity: fade in first 20%, out last 15%
          const inK = Math.min(1, progress / ROD_FADE_IN_PORTION);
          const outK = progress > ROD_FADE_OUT_START ? Math.max(0, 1 - (progress - ROD_FADE_OUT_START) / ROD_FADE_OUT_PORTION) : 1;
          rm.opacity = rodOpacity * inK * outK;

          // Cập nhật emissive intensity cho rod chính - Vùng sáng to hơn nhưng bớt loá
          const baseIntensity = ROD_EMISSIVE_INTENSITY * (rm.opacity / rodOpacity);
          const emissiveIntensity = baseIntensity * ROD_BLOOM_INTENSITY;
          // Giảm pulse effect để sáng đều hơn, tăng kích thước vùng sáng
          const pulseEffect = 1 + 0.03 * Math.sin(Date.now() * 0.0015 + progress * 2); // giảm amplitude và frequency hơn nữa
          rm.emissiveIntensity = emissiveIntensity * pulseEffect;

          if (p.tip) {
            const tm = p.tip.material as THREE.SpriteMaterial;
            tm.opacity = Math.min(1, rm.opacity + 0.2);
            p.tip.position.set(r.position.x + p.tipOffset!.x, r.position.y + p.tipOffset!.y, r.position.z + p.tipOffset!.z);
          }

          // end of pass
          if (p.activated && adv >= advMax - 1e-3) {
            p.activated = false;
            p.hasSplit = false; // reset cho lần tiếp theo
            r.position.z = p.rodBaseZ!;
          }
        }

        // Animate split rods
        for (let i = allSplitRods.length - 1; i >= 0; i--) {
          const splitRod = allSplitRods[i];
          const effectiveSpeed = rodDepthSpeed * STREAK_SPEED_MULTIPLIER * 0.95; // 90% tốc độ của vệt gốc
          const dist = Math.max(0, (rodTimeSec - splitRod.startSec) * effectiveSpeed);
          const adv = Math.min(dist, splitRod.advanceMax);

          // Move split rod
          splitRod.mesh.position.z = splitRod.baseZ + adv;

          // Calculate progress for fade
          const progress = splitRod.advanceMax > 0 ? adv / splitRod.advanceMax : 0;

          // Opacity fade similar to main rods
          const inK = Math.min(1, progress / ROD_FADE_IN_PORTION);
          const outK = progress > ROD_FADE_OUT_START ? Math.max(0, 1 - (progress - ROD_FADE_OUT_START) / ROD_FADE_OUT_PORTION) : 1;
          const splitOpacity = rodOpacity * 0.8 * inK * outK;

          const splitMaterial = splitRod.mesh.material as THREE.MeshStandardMaterial;
          splitMaterial.opacity = splitOpacity;

          // Cập nhật emissive intensity cho split rods - Sáng đều và bớt sáng hơn
          const baseSplitIntensity = ROD_EMISSIVE_INTENSITY * SPLIT_ROD_EMISSIVE_BOOST * (splitOpacity / (rodOpacity * 0.8));
          const splitEmissiveIntensity = baseSplitIntensity * ROD_BLOOM_INTENSITY;
          // Giảm pulse effect để sáng đều hơn
          const splitPulseEffect = 1 + 0.1 * Math.sin(Date.now() * 0.003 + progress * 5); // giảm amplitude và frequency
          splitMaterial.emissiveIntensity = splitEmissiveIntensity * splitPulseEffect;

          // Animate lens flares
          if (splitRod.lensFlares) {
            for (let j = 0; j < splitRod.lensFlares.length; j++) {
              const flare = splitRod.lensFlares[j];

              // Show/hide flare based on split rod visibility
              flare.visible = splitOpacity > 0.1;

              if (flare.visible) {
                // Move lens flare với nhiều vị trí để sáng cả chiều dài vệt
                const flareOffset = splitRod.direction.clone().multiplyScalar((rodLengthBase * 0.7 * (j - 0.5)) / LENS_FLARE_COUNT);
                flare.position.copy(splitRod.mesh.position).add(flareOffset);

                // Animate flare opacity - Giảm độ sáng và bớt nhấp nháy
                const flareOpacity = splitOpacity * LENS_FLARE_INTENSITY * (0.6 + 0.1 * Math.sin(Date.now() * 0.002 + j));
                (flare.material as THREE.SpriteMaterial).opacity = Math.min(0.7, flareOpacity);

                // Dynamic scaling với hiệu ứng nhẹ hơn
                const scaleMultiplier = 0.9 + 0.1 * Math.sin(Date.now() * 0.001 + j);
                const baseScale = LENS_FLARE_SIZE * 0.8;
                flare.scale.setScalar(baseScale * scaleMultiplier);
              }
            }
          }

          // Animate sparkles
          if (splitRod.sparkles) {
            for (let j = splitRod.sparkles.length - 1; j >= 0; j--) {
              const sparkle = splitRod.sparkles[j];
              const sparkleAge = rodTimeSec * 1000 - sparkle.startTime; // convert to ms

              if (sparkleAge < sparkle.lifetime && progress > 0.05) {
                sparkle.sprite.visible = true;

                // Move sparkle
                const deltaTime = dtSec;
                sparkle.sprite.position.add(sparkle.velocity.clone().multiplyScalar(deltaTime));

                // Update opacity with fade out
                const ageRatio = sparkleAge / sparkle.lifetime;
                const sparkleOpacity = sparkle.startOpacity * (1 - ageRatio) * splitOpacity;
                (sparkle.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, sparkleOpacity);

                // Slow down velocity over time
                sparkle.velocity.multiplyScalar(0.98);

                // Add some gravitational effect
                sparkle.velocity.y -= 20 * deltaTime;
              } else {
                sparkle.sprite.visible = false;
              }
            }
          }

          // Remove split rod when finished
          if (adv >= splitRod.advanceMax - 1e-3) {
            heartGroup.remove(splitRod.mesh);
            disposeMesh(splitRod.mesh);

            // Remove lens flares
            if (splitRod.lensFlares) {
              for (const flare of splitRod.lensFlares) {
                heartGroup.remove(flare);
                disposeSprite(flare);
              }
            }

            // Remove sparkles
            if (splitRod.sparkles) {
              for (const sparkle of splitRod.sparkles) {
                heartGroup.remove(sparkle.sprite);
                disposeSprite(sparkle.sprite);
              }
            }

            // Remove from parent's splitRods array
            if (splitRod.originalParent.splitRods) {
              const index = splitRod.originalParent.splitRods.indexOf(splitRod);
              if (index > -1) {
                splitRod.originalParent.splitRods.splice(index, 1);
              }
            }

            // Remove from global array
            allSplitRods.splice(i, 1);
          }
        }
      }

      // SMALL HEARTS: 1s appear→disappear + short random travel + soft pulsate
      for (const p of heartParticles) {
        const sm = p.material as THREE.SpriteMaterial;

        // normalized 0..1 within each cycle, desync by tOffset
        const t01 = ((heartsTimeMs + p.tOffset) % p.lifeMs) / p.lifeMs;

        // On cycle wrap (1.0 -> 0.0), randomize direction and spawn position
        if (p.cyclePhase !== undefined && t01 < p.cyclePhase) {
          // new random direction on XY plane
          const ang = Math.random() * TWO_PI;
          p.moveDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0);

          // re-roll travel distance within configured range
          p.moveDist = smallHeartMoveMin + Math.random() * Math.max(0, smallHeartMoveMax - smallHeartMoveMin);

          // pick a nearby point on the heart outline as the new spawn (basePos)
          const jitter = (Math.random() * 2 - 1) * SMALL_HEART_CYCLE_JITTER_RAD; // radians
          const tt = (p.paramT ?? 0) + jitter;
          const heartPoint = getSimpleHeartPoint(tt);
          const hx0 = heartPoint.x;
          const hy0 = heartPoint.y;
          p.basePos.set(hx0 * heartScaleX, hy0 * heartScaleY, 0);
        }
        p.cyclePhase = t01;

        // symmetric ease 0→1→0
        const half = t01 < 0.5 ? t01 / 0.5 : (1 - t01) / 0.5;
        const ease = Math.pow(half, SMALL_HEART_EASE_EXP); // smoother

        // travel out then back along random dir
        const travel = t01 <= 0.5 ? 1 - Math.pow(1 - t01 / 0.5, 2) : 1 - Math.pow(1 - (1 - t01) / 0.5, 2);
        const offsetLen = (p.moveDist ?? 16) * travel;

        p.position.set(p.basePos.x + (p.moveDir?.x ?? 0) * offsetLen, p.basePos.y + (p.moveDir?.y ?? 0) * offsetLen, p.basePos.z);

        // soft pulsate around base scale
        const base = p.baseScale ?? p.scale.x;
        const pulse = 1 + smallHeartPulse * Math.sin(t01 * TWO_PI);
        p.scale.setScalar(base * pulse);

        sm.opacity = ease; // 0→1→0 in lifeMs
        p.visible = sm.opacity > SMALL_HEART_VISIBLE_THRESHOLD;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, RENDERER_MAX_DPR);
      renderer.setPixelRatio(dpr);
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);

      // Cleanup split rods
      for (const splitRod of allSplitRods) {
        disposeMesh(splitRod.mesh);
        // Cleanup lens flares
        if (splitRod.lensFlares) {
          for (const flare of splitRod.lensFlares) {
            disposeSprite(flare);
          }
        }
        // Cleanup sparkles
        if (splitRod.sparkles) {
          for (const sparkle of splitRod.sparkles) {
            disposeSprite(sparkle.sprite);
          }
        }
      }
      allSplitRods = [];

      if (heartGroup) {
        scene.remove(heartGroup);
        for (const p of heartParticles) {
          disposeSprite(p.tip);
          disposeMesh(p.rod);
          p.__dispose?.();
        }
        heartParticles = [];
        heartGroup = null;
      }
      if (markerSprite) {
        disposeSprite(markerSprite);
        markerSprite = null;
      }

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        (renderer.domElement.parentNode as HTMLElement).removeChild(renderer.domElement);
      }
    };
  }, [
    bigHeartWidth,
    bigHeartAspect,
    smallHeartSizePx,
    smallHeartScale,
    smallHeartMoveMin,
    smallHeartMoveMax,
    smallHeartPulse,
    smallHeartLifeMs,
    rodDirectionMode,
    rodLengthBase,
    rodLengthJitter,
    rodWidth,
    rodHeight,
    rodDepthAnimate,
    rodDepthSpeed,
    rodDepthMaxAdvance,
    rodOpacity,
    markerRevsPerSec,
    markerSize,
    targetZ,
  ]);

  return <div ref={mountRef} style={{ ...layerStyle, ...style }} />;
}

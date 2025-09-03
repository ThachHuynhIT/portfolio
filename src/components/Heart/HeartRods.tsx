  import React, { useEffect, useRef } from "react";
  import * as THREE from "three";
  import {
    CAMERA_NEAR,
    CAMERA_FAR,
    CAMERA_Z,
    HEART_BASE_WIDTH,
    SMALL_HEART_MIN_SIZE,
    SMALL_TIP_MIN_SIZE,
    SMALL_HEART_CANVAS_SCALE,
    SMALL_HEART_GLOW_COLOR,
    SMALL_HEART_GLOW_BLUR,
    HEART_COLORS,
    MARKER_CANVAS_SIZE,
    MARKER_Z,
    GROUP_EXTRA_Z_OFFSET,
    ROD_COLOR,
    ROD_BACK_Z_OFFSET,
    NEAR_MARGIN_LOCAL,
    ROD_FADE_IN_PORTION,
    ROD_FADE_OUT_START,
    ROD_FADE_OUT_PORTION,
    SMALL_HEART_VISIBLE_THRESHOLD,
    SMALL_HEART_CYCLE_JITTER_RAD,
    SMALL_HEART_EASE_EXP,
    SIDE_HEARTS_SIZE_VARIATION,
    SIDE_HEARTS_OPACITY_VARIATION,
    STREAK_SPEED_MULTIPLIER,
    MARKER_SPEED_MULTIPLIER,
    ROD_BLOOM_INTENSITY,
    ROD_EMISSIVE_INTENSITY,
    getRandomEmissiveColor,
    SPLIT_ROD_EMISSIVE_BOOST,
    LENS_FLARE_INTENSITY,
    LENS_FLARE_SIZE,
    LENS_FLARE_COUNT,
    SPARKLE_COUNT_PER_ROD,
    SPARKLE_LIFETIME,
    SPARKLE_SPEED,
    SPARKLE_SIZE,
    HEART_APPEAR_DURATION_MS,
    ANIMATION_START_DELAY_MS,
    TWO_PI,
    getPerformanceTier,
    getOptimizedSettings,
    getResponsiveCameraSettings,
    getDotSpeed,
    getSimpleHeartPoint,
    getDeviceTypeByWidth,
  } from "./constants";

  type RodDirectionMode = "toCamera" | "fromCamera" | "radialOut" | "tangent" | "random";

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
    // Random emissive color for split rod
    rodEmissiveColor?: number; // màu emissive riêng cho split rod
  };

  // Sparkle particle type cho hiệu ứng rải tia sáng
  type SparkleParticle = {
    sprite: THREE.Sprite;
    velocity: THREE.Vector3;
    startTime: number;
    lifetime: number;
    startOpacity: number;
  };

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
    // side hearts - trái tim bên cạnh vệt sáng
    sideHearts?: THREE.Sprite[];
    sideHeartsOffsets?: THREE.Vector3[];
    // sweep / activation
    paramT?: number;
    activated?: boolean;
    rodStartSec?: number;
    activationTime?: number; // Thời điểm được kích hoạt (ms)
    // split rods (tách vệt sáng)
    hasSplit?: boolean; // đã tách chưa
    splitRods?: SplitRod[]; // các vệt tách ra
    // Random emissive color for each rod
    rodEmissiveColor?: number; // màu emissive riêng cho từng rod
    // Speed multiplier for different heart layers
    speedMultiplier?: number; // tốc độ cho từng layer trái tim
    // Heart layer index to identify which heart this particle belongs to
    heartLayerIndex?: number; // chỉ số layer trái tim (0, 1, 2)
    __dispose: () => void;
  };

  // ---- Helper functions moved outside useEffect for reuse ----
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

  // Tạo lens flare sprite cho hiệu ứng loá sáng
  const createLensFlare = (size: number, color: THREE.Color, intensity: number) => {
    const canvas = document.createElement("canvas");
    const canvasSize = size * 3; // tăng canvas size để có không gian cho glow rộng hơn
    canvas.width = canvas.height = canvasSize;
    const ctx = canvas.getContext("2d")!;

    // Tạo radial gradient cho lens flare với nhiều layer
    const outerGradient = ctx.createRadialGradient(canvasSize / 2, canvasSize / 2, 0, canvasSize / 2, canvasSize / 2, canvasSize / 2);

    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    outerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.4})`);
    outerGradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${intensity * 0.25})`);
    outerGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity * 0.15})`);
    outerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = outerGradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    // Layer trong - glow chính với intensity cao hơn
    const innerGradient = ctx.createRadialGradient(canvasSize / 2, canvasSize / 2, 0, canvasSize / 2, canvasSize / 2, canvasSize / 3);

    innerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.8})`); // tăng từ 30% lên 80%
    innerGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${intensity * 0.5})`);
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
    sprite.scale.set(size * 1.0, size * 1.0, 1);
    sprite.matrixAutoUpdate = false;

    (sprite as any).__dispose = () => {
      texture.dispose();
      material.dispose();
    };

    return sprite;
  };

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
    isTextAnimating?: boolean;
    style?: React.CSSProperties;
  };

  const layerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    margin: 0,
    padding: 0,
    pointerEvents: "none",
    zIndex: 1,
  };

  export default function HeartRods({
    bigHeartWidth = 520,
    bigHeartAspect = 1.1,

    smallHeartSizePx = 24, // reduced from 48 for smaller hearts
    smallHeartScale = 0.4, // reduced from 0.6 for smaller hearts
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
    markerRevsPerSec = 0.1,
    markerSize = 400, // giảm kích thước để phù hợp với vùng sáng nhỏ hơn
    isTextAnimating = false,
    style,
  }: HeartRodsProps) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

    // Update the `createHeartSprite` function to randomize color and size for streak hearts
    const createHeartSprite = (optimizedSettings: any, sizePx = SMALL_HEART_MIN_SIZE, tint?: string) => {
      const canvas = document.createElement("canvas");
      const s = sizePx * SMALL_HEART_CANVAS_SCALE;
      // Sử dụng kích thước nhỏ hơn cho máy yếu để tiết kiệm memory
      let canvasSize: number;
      canvasSize = Math.pow(2, Math.ceil(Math.log2(s)));
      canvas.width = canvas.height = canvasSize;
      const ctx = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
        desynchronized: true,
      })!;
      ctx.translate(canvasSize / 2, canvasSize / 2);
      // Đơn giản hóa path creation cho máy yếu
      let pathDetail = 80;
      ctx.beginPath();
      const scale = sizePx / HEART_BASE_WIDTH;
      // Optimize path creation for better performance
      const pathPoints = [];
      for (let i = 0; i <= pathDetail; i++) {
        const t = (i / pathDetail) * TWO_PI;
        const point = getSimpleHeartPoint(t);
        pathPoints.push({ x: point.x * scale, y: point.y * scale });
      }
      // Draw optimized path
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = "#ff3366";
      ctx.shadowColor = "rgba(255, 0, 0, 1)";
      ctx.shadowBlur = SMALL_HEART_GLOW_BLUR;
      ctx.fill();
      const tex = new THREE.CanvasTexture(canvas);
      // Tối ưu texture settings cho máy yếu

      tex.minFilter = optimizedSettings.antialias ? THREE.LinearFilter : THREE.NearestFilter;
      tex.magFilter = optimizedSettings.antialias ? THREE.LinearFilter : THREE.NearestFilter;
      tex.generateMipmaps = optimizedSettings.antialias;

      tex.flipY = true;
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        blending: optimizedSettings.useSimpleBlending ? THREE.NormalBlending : THREE.AdditiveBlending,
        toneMapped: false,
        fog: false,
      });
      mat.rotation = Math.PI;
      const sprite = new THREE.Sprite(mat) as HeartParticle;
      sprite.scale.set(canvasSize / 2, canvasSize / 2, 1);
      // Tắt auto matrix updates cho máy yếu
      if (optimizedSettings.disableMatrixUpdates) {
        sprite.matrixAutoUpdate = false;
      }
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

    const getBoxGeometry = (geometryPool: any, width: number, height: number, depth: number) => {
      const key = `${width}_${height}_${depth}`;
      if (!geometryPool.box.has(key)) {
        geometryPool.box.set(key, new THREE.BoxGeometry(width, height, depth));
      }
      return geometryPool.box.get(key)!;
    };

    const createRodMesh = (
      optimizedSettings: any,
      geometryPool: any,
      length: number,
      width: number,
      height: number,
      color = ROD_COLOR,
      opacity = rodOpacity,
      isSplitRod = false,
      emissiveColor?: number
    ) => {
      // Use pooled geometry
      const geom = getBoxGeometry(geometryPool, width, height, length);
      // Tạo material đơn giản hơn cho máy yếu
      let mat: THREE.Material;

      // Material phức tạp hơn cho máy mạnh
      const baseEmissiveIntensity = isSplitRod ? ROD_EMISSIVE_INTENSITY * SPLIT_ROD_EMISSIVE_BOOST : ROD_EMISSIVE_INTENSITY;
      // Reduce emissive intensity for medium devices
      let adjustedIntensity = baseEmissiveIntensity;

      adjustedIntensity *= 0.6;
      mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(1.2),
        transparent: true,
        opacity,
        emissive: optimizedSettings.bloomEnabled ? new THREE.Color(emissiveColor || getRandomEmissiveColor()) : new THREE.Color(0x444444),
        emissiveIntensity: optimizedSettings.bloomEnabled ? adjustedIntensity : 0.3,
        metalness: 0,
        roughness: 0.3,
        toneMapped: false,
        fog: false,
      });
      mat.blending = THREE.AdditiveBlending;
      mat.depthWrite = false;
      mat.depthTest = false;

      const mesh = new THREE.Mesh(geom, mat) as unknown as THREE.Mesh & { __dispose: () => void };
      // Tắt auto matrix updates cho máy yếu
      if (optimizedSettings.disableMatrixUpdates) {
        mesh.matrixAutoUpdate = false;
      }
      // Don't dispose geometry since it's pooled
      (mesh as any).__dispose = () => {
        mat.dispose();
      };
      return mesh;
    };

    useEffect(() => {
      if (!mountRef.current) return;
      // Get performance-optimized settings with text animation consideration
      const optimizedSettings = getOptimizedSettings(isTextAnimating);
      const performanceTier = getPerformanceTier();
      const cameraSettings = getResponsiveCameraSettings();
      const responsiveTargetZ = cameraSettings.targetZ;

      // ----- Renderer with enhanced performance optimizations -----
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "default",
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: false,
        preserveDrawingBuffer: false,
      });

      renderer.shadowMap.enabled = optimizedSettings.shadowEnabled;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      renderer.setPixelRatio(optimizedSettings.pixelRatio);

      // Force full screen size
      const fullWidth = window.innerWidth;
      const fullHeight = window.innerHeight;
      renderer.setSize(fullWidth, fullHeight, false);

      // Set canvas style to ensure full screen
      renderer.domElement.style.position = "fixed";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100vw";
      renderer.domElement.style.height = "100vh";
      renderer.domElement.style.zIndex = "1";

      // Enhanced tone mapping for bloom effect with performance optimization
      if (optimizedSettings.bloomEnabled) {
        renderer.toneMapping = THREE.LinearToneMapping; // thay đổi từ ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.0; // giảm exposure để tránh tối đen
      } else {
        renderer.toneMapping = THREE.LinearToneMapping;
        renderer.toneMappingExposure = 1.0;
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.sortObjects = false; // Disable sorting for better performance
      renderer.info.autoReset = false; // Manual reset for performance monitoring

      // Performance optimizations
      renderer.shadowMap.enabled = optimizedSettings.shadowEnabled;
      if (optimizedSettings.shadowEnabled) {
        renderer.shadowMap.type = THREE.PCFShadowMap; // Faster than PCFSoftShadowMap
      }

      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // ----- Scene -----
      const scene = new THREE.Scene();
      scene.background = null;
      scene.matrixAutoUpdate = false; // Disable automatic matrix updates for performance
      sceneRef.current = scene;

      // ----- Camera -----
      const camera = new THREE.PerspectiveCamera(cameraSettings.fov, fullWidth / fullHeight, CAMERA_NEAR, CAMERA_FAR);
      camera.position.set(0, 0, cameraSettings.z);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xff99bb, 2.0, 3500);
      pointLight.position.copy(camera.position);
      scene.add(pointLight);

      const auxiliaryPointLight = new THREE.PointLight(0xffffff, 1.4, 2800);
      auxiliaryPointLight.position.set(0, 0, CAMERA_Z * 0.7);
      scene.add(auxiliaryPointLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(0, 0, 1);
      scene.add(directionalLight);

      const rimLight = new THREE.DirectionalLight(0xff99bb, 0.8);
      rimLight.position.set(0, 0, -1);
      scene.add(rimLight);

      // Geometry pooling for better performance
      const geometryPool = {
        box: new Map<string, THREE.BoxGeometry>(),
      };
      // Object pooling cho máy yếu để giảm garbage collection
      const objectPool = {
        vectors: [] as THREE.Vector3[],
        quaternions: [] as THREE.Quaternion[],
        colors: [] as THREE.Color[],
      };

      // Tạo split rod từ rod gốc - song song với vệt gốc (không có tip) - với tối ưu performance
      const createSplitRod = (parentParticle: HeartParticle, currentTime: number): SplitRod | null => {
        if (!parentParticle.rod || !heartGroup) return null;

        const parentRod = parentParticle.rod as THREE.Mesh;
        const length = rodLengthBase * 0.7 + (Math.random() * 2 - 1) * (rodLengthJitter * 0.3); // nhỏ hơn rod gốc

        // Chọn màu emissive ngẫu nhiên cho split rod
        const splitEmissiveColor = getRandomEmissiveColor();

        // Tạo rod mới với enhanced glow cho split rod
        const splitMesh = createRodMesh(
          optimizedSettings,
          geometryPool,
          length,
          rodWidth * 0.6,
          rodHeight * 0.6,
          ROD_COLOR,
          rodOpacity * 0.8,
          true,
          splitEmissiveColor
        );

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
        const half = length / 1.5;
        const splitPos = currentPos.clone();
        splitPos.x += offsetX; // offset theo X
        splitPos.y += offsetY; // offset theo Y
        splitPos.add(splitDirection.clone().multiplyScalar(-half));
        splitPos.z += ROD_BACK_Z_OFFSET; // hơi lùi lại so với rod gốc
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

        // Tạo lens flares cho split rod với optimization (chỉ khi được bật)
        const lensFlares: THREE.Sprite[] = [];
        if (optimizedSettings.lensFlareCount > 0) {
          const lensFlareCount = Math.min(optimizedSettings.lensFlareCount, LENS_FLARE_COUNT);

          for (let i = 0; i < lensFlareCount; i++) {
            const flareSize = LENS_FLARE_SIZE * (0.5 + Math.random() * 0.5);
            const flareColor = new THREE.Color(splitEmissiveColor); // sử dụng màu của split rod
            const flareIntensity = LENS_FLARE_INTENSITY * (0.7 + Math.random() * 0.3);
            const lensFlare = createLensFlare(flareSize, flareColor, flareIntensity);

            // Vị trí lens flare gần đầu rod
            const flareOffset = splitDirection.clone().multiplyScalar(length * 0.3 + i * 5);
            lensFlare.position.copy(splitPos).add(flareOffset);
            lensFlare.visible = false; // sẽ hiển thị khi rod active

            heartGroup.add(lensFlare);
            lensFlares.push(lensFlare);
          }
        }

        const splitRod: SplitRod = {
          mesh: splitMesh,
          direction: splitDirection,
          baseZ: baseZ,
          advanceMax: maxAllowed,
          startSec: currentTime,
          originalParent: parentParticle,
          lensFlares,
          // Gán màu emissive cho split rod
          rodEmissiveColor: splitEmissiveColor,
        };

        return splitRod;
      };

      // state
      let heartGroup: THREE.Group | null = null;
      let heartParticles: HeartParticle[] = [];
      let allSplitRods: SplitRod[] = []; // theo dõi tất cả split rods
      // Nhiều marker: mỗi layer một đốm sáng riêng
      let markerSprites: (THREE.Sprite & { __dispose?: () => void })[] = [];
      let markerSharedTexture: THREE.CanvasTexture | null = null;

      // Tạo 3 marker angles riêng biệt cho 3 trái tim với tốc độ khác nhau
      let markerAngles = [0, 0, 0]; // 3 góc marker cho 3 trái tim
      let prevMarkerAngles = [0, 0, 0]; // 3 góc marker trước đó

      let heartScaleX = 1;
      let heartScaleY = 1;
      // Scale riêng cho từng layer để tính vị trí marker chính xác
      const heartScaleXByLayer: number[] = [];
      const heartScaleYByLayer: number[] = [];
      // Tốc độ khác nhau cho marker từng layer
      const LAYER_MARKER_SPEED_MULTIPLIERS = [1.0, 0.9, 0.8];

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
            // Dispose side hearts
            if (p.sideHearts) {
              for (const sideHeart of p.sideHearts) {
                disposeSprite(sideHeart);
              }
            }
            disposeMesh(p.rod);
            p.__dispose?.();
          }
          heartParticles = [];
          heartGroup = null;
        }

        heartGroup = new THREE.Group();

        // Điều chỉnh vị trí cho mobile để tránh thanh tìm kiếm và tai thỏ
        const deviceType = getDeviceTypeByWidth();
        let yOffset = 0;
        if (deviceType === "mobile") {
          // Đẩy trái tim xuống một chút để tránh thanh tìm kiếm và tai thỏ
          // yOffset = -50; // Dịch chuyển xuống 50 units
        }

        heartGroup.position.set(0, yOffset, responsiveTargetZ + GROUP_EXTRA_Z_OFFSET);
        scene.add(heartGroup);

        // Tạo 3 trái tim với kích thước lớn hơn và tốc độ khác nhau
        const heartSizes = [
          { size: bigHeartWidth * 1, zOffset: 50, opacity: 1, speedMultiplier: 1 }, // Trái tim ngoài - chậm nhất
          { size: bigHeartWidth * 1.8, zOffset: 0, opacity: 0.9, speedMultiplier: 0.9 }, // Trái tim trung bình - chậm vừa
          { size: bigHeartWidth * 2.5, zOffset: -50, opacity: 0.8, speedMultiplier: 0.8 }, // Trái tim lớn nhất - tốc độ bình thường
        ];

        for (let heartIndex = 0; heartIndex < heartSizes.length; heartIndex++) {
          const heartConfig = heartSizes[heartIndex];
          const w = heartConfig.size;
          const scaleX = w / HEART_BASE_WIDTH;
          const scaleY = (w / HEART_BASE_WIDTH) * bigHeartAspect;

          if (heartIndex === 0) {
            heartScaleX = scaleX;
            heartScaleY = scaleY;
          }

          heartScaleXByLayer[heartIndex] = scaleX;
          heartScaleYByLayer[heartIndex] = scaleY;
          const count = Math.floor(optimizedSettings.heartParticleCount * (0.7 + heartIndex * 0.15)); // Tăng dần số particles
          for (let i = 0; i < count; i++) {
            const t = (i / count) * (Math.PI * 2);
            // curve point (scaled) - using new heart shape
            const point = getSimpleHeartPoint(t);
            const hx = point.x;
            const hy = point.y;
            const px = hx * scaleX;
            const py = hy * scaleY;
            // SMALL HEART: smaller size + motion parameters
            // Đảm bảo phân phối màu đều bằng cách sử dụng index
            let heartColorIndex;
            if (i % 3 === 0) heartColorIndex = 0; // Đỏ
            else if (i % 3 === 1) heartColorIndex = 1; // Hồng
            else heartColorIndex = 2; // Trắng
            // Thêm một chút ngẫu nhiên để không quá đều
            if (Math.random() < 0.2) {
              heartColorIndex = Math.floor(Math.random() * HEART_COLORS.length);
            }
            // Add random size variation for more organic look (0.5 to 1.2 multiplier)
            const randomSizeMultiplier = 0.5 + Math.random() * 0.7;
            const finalSize = Math.max(SMALL_HEART_MIN_SIZE, smallHeartSizePx * smallHeartScale * randomSizeMultiplier);
            const p = createHeartSprite(optimizedSettings, finalSize, HEART_COLORS[heartColorIndex].tint);
            p.position.set(px, py, heartConfig.zOffset); // Sử dụng zOffset cho mỗi trái tim
            p.basePos = new THREE.Vector3(px, py, heartConfig.zOffset);
            p.baseScale = p.scale.x;

            // Điều chỉnh opacity cho từng layer trái tim
            (p.material as THREE.SpriteMaterial).opacity = heartConfig.opacity;

            // Gán tốc độ và layer index cho từng layer trái tim
            p.speedMultiplier = heartConfig.speedMultiplier;
            p.heartLayerIndex = heartIndex;

            const ang = Math.random() * (Math.PI * 2);
            p.moveDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0);
            p.moveDist = smallHeartMoveMin + Math.random() * Math.max(0, smallHeartMoveMax - smallHeartMoveMin);
            // rods
            p.paramT = t;
            p.activated = false;
            p.rodStartSec = undefined;
            p.activationTime = undefined; // Chưa được kích hoạt
            p.hasSplit = false; // chưa tách
            p.splitRods = []; // mảng chứa các rod tách ra
            // Đánh dấu để chỉ áp dụng delay giữa các layer ở lần kích hoạt đầu tiên
            (p as any).firstActivation = true;
            // Gán màu emissive ngẫu nhiên cho rod
            p.rodEmissiveColor = getRandomEmissiveColor();
            const length = rodLengthBase + (Math.random() * 2 - 1) * rodLengthJitter;
            const rod = createRodMesh(
              optimizedSettings,
              geometryPool,
              length,
              rodWidth,
              rodHeight,
              ROD_COLOR,
              rodOpacity * heartConfig.opacity,
              false,
              p.rodEmissiveColor
            );
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
            const rodPos = new THREE.Vector3(px, py, heartConfig.zOffset).add(dir.clone().multiplyScalar(-half));
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

            // Add random size variation for tip hearts (0.6 to 1.1 multiplier)
            const randomTipSizeMultiplier = 0.6 + Math.random() * 0.5;
            const finalTipSize = Math.max(SMALL_TIP_MIN_SIZE, smallHeartSizePx * Math.min(1, smallHeartScale) * randomTipSizeMultiplier);

            const tip = createHeartSprite(optimizedSettings, finalTipSize);
            tip.position.set(rod.position.x + tipOffset.x, rod.position.y + tipOffset.y, rod.position.z + tipOffset.z);
            p.tip = tip;
            p.tipOffset = tipOffset.clone();

            // Create side hearts - Tạo trái tim bên cạnh (chỉ khi được bật)
            const sideHearts: THREE.Sprite[] = [];
            const sideHeartsOffsets: THREE.Vector3[] = [];

            if (optimizedSettings.sideHeartsEnabled) {
              // Tính vector vuông góc với rod direction để đặt trái tim bên cạnh
              const rodDir = dir.clone().normalize();
              const perpVector1 = new THREE.Vector3();
              const perpVector2 = new THREE.Vector3();

              // Tạo 2 vector vuông góc
              if (Math.abs(rodDir.x) < 0.9) {
                perpVector1.set(1, 0, 0).cross(rodDir).normalize();
              } else {
                perpVector1.set(0, 1, 0).cross(rodDir).normalize();
              }
              perpVector2.copy(rodDir).cross(perpVector1).normalize();

              // Tạo trái tim bên cạnh theo cả 2 phía
              for (let side = -1; side <= 1; side += 2) {
                // Randomly choose 2 or 3 side hearts per side
                const numSideHearts = 2 + Math.round(Math.random());
                for (let i = 1; i <= numSideHearts; i++) {
                  // Kích thước ngẫu nhiên
                  const sizeVariation = 1 + (Math.random() - 0.5) * SIDE_HEARTS_SIZE_VARIATION;
                  const sideHeartSize = Math.max(SMALL_HEART_MIN_SIZE * 0.7, finalTipSize * 0.8 * sizeVariation);
                  const sideHeart = createHeartSprite(optimizedSettings, sideHeartSize);
                  const perpDistance = side * (8 + i * 4); // khoảng cách perpendicular
                  const backwardOffset = -i * 5; // lùi lại một chút
                  // Kết hợp offset từ perpendicular vectors và backward
                  const sideOffset = new THREE.Vector3()
                    .addScaledVector(perpVector1, perpDistance)
                    .addScaledVector(perpVector2, (Math.random() - 0.5) * 6)
                    .addScaledVector(rodDir, backwardOffset);
                  const finalSideOffset = tipOffset.clone().add(sideOffset);
                  sideHeart.position.set(rod.position.x + finalSideOffset.x, rod.position.y + finalSideOffset.y, rod.position.z + finalSideOffset.z);
                  // Thiết lập opacity ban đầu
                  const opacityVariation = 1 - Math.random() * SIDE_HEARTS_OPACITY_VARIATION;
                  (sideHeart.material as THREE.SpriteMaterial).opacity = 0;
                  (sideHeart.material as THREE.SpriteMaterial).userData = { maxOpacity: opacityVariation };
                  sideHeart.visible = false;
                  sideHearts.push(sideHeart);
                  sideHeartsOffsets.push(finalSideOffset);
                  heartGroup.add(sideHeart);
                }
              }
            } // Đóng ngoặc if cho sideHeartsEnabled

            p.sideHearts = sideHearts;
            p.sideHeartsOffsets = sideHeartsOffsets;
            (rod.material as THREE.MeshStandardMaterial).opacity = 0;
            (rod.material as THREE.MeshStandardMaterial).transparent = true;
            rod.visible = false;
            (tip.material as THREE.SpriteMaterial).opacity = 0;
            tip.visible = false;
            heartGroup.add(rod, tip, p);
            heartParticles.push(p);
          } // Đóng vòng lặp cho mỗi particle trong một trái tim
        } // Đóng vòng lặp cho 3 trái tim

        // markers: mỗi layer 1 sprite
        if (markerSprites.length) {
          for (const msOld of markerSprites) {
            heartGroup.remove(msOld);
            disposeSprite(msOld);
          }
          markerSprites = [];
        }
        if (markerSharedTexture) {
          markerSharedTexture.dispose();
          markerSharedTexture = null;
        }
        const markerCanvas = document.createElement("canvas");
        markerCanvas.width = markerCanvas.height = MARKER_CANVAS_SIZE;
        const mctx = markerCanvas.getContext("2d")!;
        const grd = mctx.createRadialGradient(
          MARKER_CANVAS_SIZE / 2,
          MARKER_CANVAS_SIZE / 2,
          0,
          MARKER_CANVAS_SIZE / 2,
          MARKER_CANVAS_SIZE / 2,
          MARKER_CANVAS_SIZE / 2 - 5
        );
        grd.addColorStop(0, "rgba(255,36,167,1)");
        grd.addColorStop(0.02, "rgba(246,1,149,0.85)");
        grd.addColorStop(0.1, "rgba(246,1,149,0.25)");
        grd.addColorStop(0.4, "rgba(246,1,149,0.12)");
        grd.addColorStop(0.8, "rgba(246,1,149,0.05)");
        grd.addColorStop(1, "rgba(246,1,149,0)");
        mctx.filter = "blur(1px)";
        mctx.fillStyle = grd;
        mctx.fillRect(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE);
        markerSharedTexture = new THREE.CanvasTexture(markerCanvas);
        markerSharedTexture.minFilter = THREE.LinearFilter;
        markerSharedTexture.magFilter = THREE.LinearFilter;
        for (let i = 0; i < 3; i++) {
          const mmat = new THREE.SpriteMaterial({
            map: markerSharedTexture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            alphaTest: 0.01,
            opacity: 0.9 - i * 0.15,
          });
          const sprite = new THREE.Sprite(mmat) as any;
          const scaleMul = 1 + i * 0.18;
          sprite.scale.set(markerSize * scaleMul, markerSize * scaleMul, 1);
          sprite.matrixAutoUpdate = false;
          sprite.visible = false;
          markerSprites.push(sprite);
          heartGroup.add(sprite);
        }
        markerAngles = [0, 0, 0];
        prevMarkerAngles = [0, 0, 0];
      };

      buildHeart();

      // ----- Animation with frame skipping -----
      let rafId = 0;
      const clock = new THREE.Clock();
      let rodTimeSec = 0;
      let heartsTimeMs = 0;
      let frameCount = 0; // For frame skipping

      // Intro animation tracking
      let introStartTime = Date.now();
      let introCompleted = false;
      let initialMarkerAngle = 0; // Góc ban đầu của marker
      let hasInitialAngle = false; // Đánh dấu đã lấy góc ban đầu chưa
      let firstPassCompleted = false; // Đánh dấu đã hoàn thành 10% đầu tiên

      // Thêm biến để theo dõi FPS và tự động điều chỉnh
      let adaptiveFrameSkip = optimizedSettings.animationFrameSkip;

      // Hàm tính tốc độ marker dựa trên vị trí (0-1)
      const getMarkerSpeedMultiplier = (normalizedPosition: number): number => {
        const pos = normalizedPosition; // 0-1
        const percentage = pos * 100;
        if ((percentage >= 0 && percentage <= 5) || (percentage >= 45 && percentage <= 55) || (percentage >= 95 && percentage <= 100)) {
          return 3;
        } else {
          return 1;
        }
      };

      const animate = () => {
        rafId = requestAnimationFrame(animate);
        // adjustFrameSkip();

        // Frame skipping for performance optimization - Cải tiến cho máy yếu
        frameCount++;

        // Sử dụng adaptive frame skip thay vì static
        let shouldSkipFrame = false;

        shouldSkipFrame = adaptiveFrameSkip > 0 && frameCount % (adaptiveFrameSkip + 1) !== 0;

        if (shouldSkipFrame) {
          return; // Skip this frame
        }

        const dtMs = clock.getDelta() * 1000;
        const dtSec = dtMs / 1000;

        // Performance optimization: limit delta time, more aggressive for weak devices
        const maxDeltaMs = 33.33; // Cap at ~30fps equivalent
        const clampedDtMs = Math.min(dtMs, maxDeltaMs);
        const clampedDtSec = clampedDtMs / 1000;
        // Intro animation logic
        const currentTime = Date.now();
        const introElapsedMs = currentTime - introStartTime;
        // Only update rod and marker time after intro delay
        if (introElapsedMs >= ANIMATION_START_DELAY_MS) {
          if (!introCompleted) {
            introCompleted = true;
            // Reset time tracking when animation starts
            clock.getDelta(); // consume any accumulated delta
          }
          rodTimeSec += clampedDtSec;
        }
        heartsTimeMs += clampedDtMs;
        // move markers along the curve for each heart layer (only after intro delay)
        if (heartGroup && markerSprites.length === 3 && introElapsedMs >= ANIMATION_START_DELAY_MS) {
          for (let layerIndex = 0; layerIndex < 3; layerIndex++) {
            const currentMarkerAngle = markerAngles[layerIndex];
            const normalizedPosition = currentMarkerAngle / (Math.PI * 2);

            // Lấy góc ban đầu trong frame đầu tiên
            if (!hasInitialAngle) {
              initialMarkerAngle = currentMarkerAngle;
              hasInitialAngle = true;
            }

            // Cập nhật tiến trình lần đầu chỉ khi chưa hoàn thành 5% (chỉ cho layer đầu tiên)
            if (!firstPassCompleted && layerIndex === 0) {
              // Tính góc đã di chuyển từ vị trí ban đầu (theo chiều ngược kim đồng hồ)
              let angleTraveled = initialMarkerAngle - currentMarkerAngle;
              if (angleTraveled < 0) {
                angleTraveled += Math.PI * 2; // Xử lý trường hợp qua 0
              }

              const progressPercent = (angleTraveled / (Math.PI * 2)) * 100;

              // Kiểm tra nếu đã đạt 5%
              if (progressPercent >= 5) {
                firstPassCompleted = true;
              }
            }

            // Lấy multiplier tốc độ dựa trên vị trí
            const speedMultiplier = getMarkerSpeedMultiplier(normalizedPosition);
            // Áp dụng device speed multiplier cho marker
            const deviceSpeedMultiplier = getDotSpeed();
            // Áp dụng tốc độ có điều chỉnh và tốc độ riêng cho từng layer
            const layerSpeed = LAYER_MARKER_SPEED_MULTIPLIERS[layerIndex] || 1;
            const adjustedMarkerSpeed = markerRevsPerSec * MARKER_SPEED_MULTIPLIER * speedMultiplier * deviceSpeedMultiplier * layerSpeed;
            const dAngle = adjustedMarkerSpeed * (Math.PI * 2) * clampedDtSec;
            prevMarkerAngles[layerIndex] = markerAngles[layerIndex];
            markerAngles[layerIndex] = (markerAngles[layerIndex] - dAngle + Math.PI * 2) % (Math.PI * 2); // Thay đổi chiều ngược kim đồng hồ
          }

          // Cập nhật từng marker theo layer riêng
          for (let layerIndex = 0; layerIndex < 3; layerIndex++) {
            const mp = getSimpleHeartPoint(markerAngles[layerIndex]);
            const hx = mp.x;
            const hy = mp.y;
            const scaleXLayer = heartScaleXByLayer[layerIndex] ?? heartScaleX;
            const scaleYLayer = heartScaleYByLayer[layerIndex] ?? heartScaleY;
            const mx = hx * scaleXLayer;
            const my = hy * scaleYLayer;
            const sprite = markerSprites[layerIndex];
            sprite.position.set(mx, my, MARKER_Z + layerIndex * 0.5); // slight Z offset
            sprite.visible = true;
            sprite.updateMatrix();
          }
          // trigger activations when marker sweeps past
          for (const p of heartParticles) {
            const r = p.rod as THREE.Mesh | undefined;
            if (p.activated) continue;
            const t = p.paramT ?? 0;

            // Get the corresponding marker angles for this particle's layer
            const layerIndex = p.heartLayerIndex ?? 0;
            const currentMarkerAngle = markerAngles[layerIndex];
            const prevMarkerAngle = prevMarkerAngles[layerIndex];

            let passed = false;
            // Logic ngược chiều kim đồng hồ: marker di chuyển từ angle lớn về angle nhỏ
            if (currentMarkerAngle <= prevMarkerAngle) passed = t < prevMarkerAngle && t >= currentMarkerAngle;
            else passed = t < prevMarkerAngle || t >= currentMarkerAngle;

            // Chỉ kích hoạt tia bay lên sau khi marker đã chạy được 10% trong lần đầu render
            if (passed && firstPassCompleted) {
              p.activated = true;
              // Thêm delay 600ms giữa các layer CHỈ CHO LẦN KÍCH HOẠT ĐẦU TIÊN
              const layerIndex = p.heartLayerIndex ?? 0;
              const isFirst = (p as any).firstActivation;
              const layerDelaySec = 0; // chỉ delay lần đầu
              p.rodStartSec = rodTimeSec + layerDelaySec;
              if (isFirst) {
                (p as any).firstActivation = false; // các lần sau không delay nữa
              }
              p.activationTime = currentTime; // Lưu thời điểm được kích hoạt

              // Thỉnh thoảng thay đổi màu emissive khi rod được kích hoạt (tạo sự đa dạng màu sắc)
              if (Math.random() < 0.4) {
                // 40% chance để thay đổi màu
                p.rodEmissiveColor = getRandomEmissiveColor();
                // Cập nhật màu emissive cho material của rod
                if (r && r.material) {
                  (r.material as THREE.MeshStandardMaterial).emissive.setHex(p.rodEmissiveColor);
                }
              }

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
              // Activate side hearts
              if (p.sideHearts) {
                for (const sideHeart of p.sideHearts) {
                  sideHeart.visible = true;
                  (sideHeart.material as THREE.SpriteMaterial).opacity = 0;
                }
              }
            }
          }
        }

        // rods/tips motion & fade (only after intro delay)
        if (rodDepthAnimate && heartGroup && introElapsedMs >= ANIMATION_START_DELAY_MS) {
          for (const p of heartParticles) {
            const r = p.rod as THREE.Mesh | undefined;
            const advMax = p.rodAdvanceMax ?? 0;
            if (!r || p.rodBaseZ == null || advMax <= 0) continue;
            const rm = r.material as THREE.MeshStandardMaterial;
            const startSec = p.rodStartSec ?? rodTimeSec;
            // Apply speed multiplier here to make streaks fly faster
            // Also apply device-specific speed multiplier for mobile/tablet
            const effectiveSpeed = rodDepthSpeed * STREAK_SPEED_MULTIPLIER;
            const dist = Math.max(0, (rodTimeSec - startSec) * effectiveSpeed);
            const adv = Math.min(dist, advMax);
            // move
            r.position.z = p.activated ? p.rodBaseZ + adv : p.rodBaseZ;
            // Tính tỷ lệ tiến trình (0-1)
            const progress = advMax > 0 ? adv / advMax : 0;
            // Tách vệt sáng khi đạt 1% và chưa tách - chỉ khi được bật
            // if (progress >= 0.01 && !p.hasSplit && p.activated && optimizedSettings.splitRodCount > 0) {
            //   // Tính vị trí marker hiện tại để kiểm tra vùng tốc độ cao (sử dụng layer đầu tiên)
            //   const normalizedPosition = markerAngles[0] / (Math.PI * 2);
            //   const percentage = normalizedPosition * 100;
            //   // Giảm khả năng tách vệt ở các vùng tốc độ cao
            //   let shouldSplit = true;
            //   let splitReduction = 1;
            //   if ((percentage >= 0 && percentage <= 5) || (percentage >= 45 && percentage <= 55) || (percentage >= 95 && percentage <= 100)) {
            //     // Giảm 70% khả năng tách ở vùng tốc độ cao
            //     shouldSplit = Math.random() > 0.7;
            //     splitReduction = 0; // Giảm số lượng split rods
            //   }
            //   if (shouldSplit) {
            //     p.hasSplit = true;
            //     const baseSplits = Math.floor(Math.random() * 2) + 2;
            //     const adjustedSplits = Math.max(1, Math.floor(baseSplits * splitReduction));
            //     const numSplits = Math.min(optimizedSettings.splitRodCount, adjustedSplits);
            //     for (let i = 0; i < numSplits; i++) {
            //       const splitRod = createSplitRod(p, rodTimeSec);
            //       if (splitRod) {
            //         p.splitRods!.push(splitRod);
            //         allSplitRods.push(splitRod);
            //       }
            //     }
            //   }
            // }

            // opacity: fade in first 20%, out last 15%
            const inK = Math.min(1, progress / ROD_FADE_IN_PORTION);
            const outK = progress > ROD_FADE_OUT_START ? Math.max(0, 1 - (progress - ROD_FADE_OUT_START) / ROD_FADE_OUT_PORTION) : 1;
            rm.opacity = rodOpacity * inK * outK;

            // Update matrix manually if auto updates are disabled
            if (optimizedSettings.disableMatrixUpdates) {
              r.updateMatrix();
            }

            // Chỉ cập nhật emissive intensity cho high-performance devices để tránh overhead
            if (performanceTier === "high" || performanceTier === "medium") {
              const baseIntensity = ROD_EMISSIVE_INTENSITY * Math.max(0.5, rm.opacity / rodOpacity);
              const emissiveIntensity = baseIntensity * ROD_BLOOM_INTENSITY;
              const pulseEffect = 1 + 0.1 * Math.sin(Date.now() * 0.002);
              rm.emissiveIntensity = emissiveIntensity * pulseEffect;
            }

            if (p.tip) {
              const tm = p.tip.material as THREE.SpriteMaterial;
              tm.opacity = Math.min(1, rm.opacity + 0.2);
              p.tip.position.set(r.position.x + p.tipOffset!.x, r.position.y + p.tipOffset!.y, r.position.z + p.tipOffset!.z);
              // Update matrix manually if auto updates are disabled
              if (optimizedSettings.disableMatrixUpdates) {
                p.tip.updateMatrix();
              }
            }

            // Update side hearts - chỉ cho các tier cao hơn để tránh overhead
            if (p.sideHearts && p.sideHeartsOffsets) {
              for (let i = 0; i < p.sideHearts.length; i++) {
                const sideHeart = p.sideHearts[i];
                const sideOffset = p.sideHeartsOffsets[i];
                const sm = sideHeart.material as THREE.SpriteMaterial;

                // Opacity với delay và variation
                const delayFactor = (i % 3) * 0.1;
                const maxOpacity = sm.userData?.maxOpacity || 1;
                const adjustedOpacity = Math.max(0, rm.opacity - delayFactor) * maxOpacity;
                sm.opacity = Math.min(0.8, adjustedOpacity);

                // Position update
                sideHeart.position.set(r.position.x + sideOffset.x, r.position.y + sideOffset.y, r.position.z + sideOffset.z);

                // Visibility
                sideHeart.visible = sm.opacity > SMALL_HEART_VISIBLE_THRESHOLD;

                // Update matrix if needed
                if (optimizedSettings.disableMatrixUpdates) {
                  sideHeart.updateMatrix();
                }
              }
            }

            // end of pass
            if (p.activated && adv >= advMax - 1e-3) {
              p.activated = false;
              p.hasSplit = false; // reset cho lần tiếp theo
              p.activationTime = undefined; // Reset thời điểm kích hoạt
              r.position.z = p.rodBaseZ!;

              // Reset side hearts visibility
              if (p.sideHearts) {
                for (const sideHeart of p.sideHearts) {
                  sideHeart.visible = false;
                  (sideHeart.material as THREE.SpriteMaterial).opacity = 0;
                }
              }
            }
          }

          // Animate split rods
          for (let i = allSplitRods.length - 1; i >= 0; i--) {
            const splitRod = allSplitRods[i];
            const effectiveSpeed = rodDepthSpeed * STREAK_SPEED_MULTIPLIER * 0.99; // slightly slower than main rods
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

            // Chỉ cập nhật emissive cho split rods trên máy mạnh để tránh overhead
            if (performanceTier === "high" || performanceTier === "medium") {
              const baseSplitIntensity = ROD_EMISSIVE_INTENSITY * SPLIT_ROD_EMISSIVE_BOOST * Math.max(0.4, splitOpacity / (rodOpacity * 0.8));
              const splitEmissiveIntensity = baseSplitIntensity * ROD_BLOOM_INTENSITY;
              const splitPulseEffect = 1 + 0.15 * Math.sin(Date.now() * 0.0025 + i * 0.5);
              splitMaterial.emissiveIntensity = splitEmissiveIntensity * splitPulseEffect;
            }

            // Update matrix if needed
            if (optimizedSettings.disableMatrixUpdates) {
              splitRod.mesh.updateMatrix();
            }

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
                  // Update matrix manually since matrixAutoUpdate is disabled
                  flare.updateMatrix();
                  // Animate flare opacity - Tăng độ sáng
                  const flareOpacity = splitOpacity * LENS_FLARE_INTENSITY * (0.8 + 0.2 * Math.sin(Date.now() * 0.003 + j)); // tăng opacity
                  (flare.material as THREE.SpriteMaterial).opacity = Math.min(0.9, flareOpacity);
                  // Dynamic scaling
                  const scaleMultiplier = 0.9 + 0.1 * Math.sin(Date.now() * 0.002 + j);
                  const baseScale = LENS_FLARE_SIZE * 0.9; // tăng base scale
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

                  // Update matrix manually since matrixAutoUpdate is disabled
                  sparkle.sprite.updateMatrix();

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

        // SMALL HEARTS: Intro effect + 1s appear→disappear + short random travel + soft pulsate
        for (const p of heartParticles) {
          const sm = p.material as THREE.SpriteMaterial;

          // Intro effect: hearts only appear after marker has activated them
          let introOpacityMultiplier = 0; // Start with 0 opacity (invisible)
          if (p.activated && introElapsedMs >= ANIMATION_START_DELAY_MS && p.activationTime) {
            // Hearts appear with eased animation only after being activated by marker
            const timeSinceActivation = currentTime - p.activationTime;
            if (timeSinceActivation >= 0 && timeSinceActivation < HEART_APPEAR_DURATION_MS) {
              const heartAppearProgress = timeSinceActivation / HEART_APPEAR_DURATION_MS;
              introOpacityMultiplier = Math.pow(heartAppearProgress, 0.5); // Ease out effect
            } else if (timeSinceActivation >= HEART_APPEAR_DURATION_MS) {
              introOpacityMultiplier = 1; // Full opacity after animation complete
            }
          }

          // normalized 0..1 within each cycle, desync by tOffset
          // Áp dụng speedMultiplier để các layer trái tim có tốc độ khác nhau
          const effectiveTime = heartsTimeMs * (p.speedMultiplier || 1.0);
          const t01 = ((effectiveTime + p.tOffset) % p.lifeMs) / p.lifeMs;

          // On cycle wrap (1.0 -> 0.0), randomize direction and spawn position
          if (p.cyclePhase !== undefined && t01 < p.cyclePhase) {
            // new random direction on XY plane
            const ang = Math.random() * (Math.PI * 2);
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

          // Soft pulsate around base scale - đơn giản hóa cho máy yếu
          const base = p.baseScale ?? p.scale.x;
          let pulse = 1;
          pulse = 1 + smallHeartPulse * Math.sin(t01 * (Math.PI * 2));

          p.scale.setScalar(base * pulse);

          // Update matrix manually if auto updates are disabled
          if (optimizedSettings.disableMatrixUpdates) {
            p.updateMatrix();
          }

          // Apply both normal opacity and intro effect
          const finalOpacity = ease * introOpacityMultiplier;
          sm.opacity = finalOpacity;
          p.visible = sm.opacity > SMALL_HEART_VISIBLE_THRESHOLD;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(rafId);
        // Enhanced cleanup for weak devices - Force garbage collection triggers
        // Cleanup split rods với aggressive cleanup cho máy yếu
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
            // Dispose side hearts
            if (p.sideHearts) {
              for (const sideHeart of p.sideHearts) {
                disposeSprite(sideHeart);
              }
            }
            disposeMesh(p.rod);
            p.__dispose?.();
          }
          heartParticles = [];
          heartGroup = null;
        }
        if (markerSprites.length) {
          for (const ms of markerSprites) disposeSprite(ms);
          markerSprites = [];
        }
        if (markerSharedTexture) {
          markerSharedTexture.dispose();
          markerSharedTexture = null;
        }
        // Cleanup geometry pool
        for (const geometry of geometryPool.box.values()) {
          geometry.dispose();
        }
        geometryPool.box.clear();

        // Cleanup object pools
        objectPool.vectors.length = 0;
        objectPool.quaternions.length = 0;
        objectPool.colors.length = 0;

        renderer.dispose();
        if (renderer.domElement.parentNode) {
          (renderer.domElement.parentNode as HTMLElement).removeChild(renderer.domElement);
        }
      };
    }, [
      bigHeartWidth,
      smallHeartSizePx,
      smallHeartScale,
      smallHeartMoveMin,
      smallHeartMoveMax,
      smallHeartPulse,
      rodLengthBase,
      rodDepthSpeed,
      rodDepthMaxAdvance,
      rodOpacity,
      markerRevsPerSec,
      style,
      getDotSpeed,
    ]);

    return <div ref={mountRef} style={{ ...layerStyle, ...style }} />;
  }

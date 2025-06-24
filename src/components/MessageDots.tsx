/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNTDOWN = ["3", "2", "1"];
const COUNTDOWN_DELAY = 1300;
const MESSAGE_DELAY = 2800;

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_GAP = 4;
const MOBILE_DOT_SIZE = 6;
const MOBILE_DOT_GAP = 3;

// Quality settings configuration
const QUALITY_SETTINGS = {
  low: {
    dotGapMultiplier: 1.5, // More space between dots = fewer dots
    effectIntensity: 0.7, // Reduce visual effects
    blurEnabled: false, // Disable blur effect for performance
    maxFlyingDots: 180, // Limit number of flying dots
  },
  medium: {
    dotGapMultiplier: 1.2,
    effectIntensity: 0.8,
    blurEnabled: true,
    maxFlyingDots: 387,
  },
  high: {
    dotGapMultiplier: 1.0, // Standard quality
    effectIntensity: 0.8,
    blurEnabled: true,
    maxFlyingDots: 850,
  },
};

interface Dot {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  vz: number;
  exploded: boolean;
  opacity: number;
  glowIntensity: number;
  isExtra?: boolean;
  gathering?: boolean;
  delayStart?: number;
  started?: boolean;
  isIndependence?: boolean;
}

interface CountdownProps {
  messages: string[];
  onComplete?: () => void;
  qualityOverride?: "low" | "medium" | "high"; // Optional prop to override auto-detection
}

const Countdown3D: React.FC<CountdownProps> = ({ messages = [], onComplete = null, qualityOverride }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointsRef = useRef<THREE.Points | null>(null);
  const indexRef = useRef(0);
  const phaseRef = useRef<"countdown" | "message">("countdown");
  const glowStartTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGlowingRef = useRef(false);
  const glowIntensityRef = useRef(0);
  const transitionStartTimeRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const dotsBlurRef = useRef<THREE.Points | null>(null);
  const blurVisibleRef = useRef(false);
  const blurFadeRef = useRef(0);
  const flyingDotsRef = React.useRef<Dot[]>([]);
  const lastTimeRef = useRef(0); // Reference for animation timing

  const [dotSize, setDotSize] = React.useState(DEFAULT_DOT_SIZE);
  const [dotGap, setDotGap] = React.useState(DEFAULT_DOT_GAP);
  const [quality, setQuality] = React.useState<"low" | "medium" | "high">("medium");
  const [qualityInitialized, setQualityInitialized] = React.useState(false);

  // First useEffect - initialize quality based on saved preferences or hardware detection
  // This runs only once at the beginning
  React.useEffect(() => {
    if (typeof window !== "undefined" && !qualityInitialized) {
      // First check localStorage for saved preferences
      if (typeof localStorage !== "undefined" && !qualityOverride) {
        const savedQuality = localStorage.getItem("dotsQualityPreference") as "low" | "medium" | "high" | null;
        if (savedQuality && (savedQuality === "low" || savedQuality === "medium" || savedQuality === "high")) {
          setQuality(savedQuality);
          setQualityInitialized(true);
          return;
        }
      }
      // If no saved preference, use quality override if provided
      if (qualityOverride) {
        setQuality(qualityOverride);
      } else {
        // Automatic performance detection as last resort
        let detectedQuality: "low" | "medium" | "high" = "medium"; // Default
        // Try to detect device performance using navigator information
        if ("deviceMemory" in navigator || "hardwareConcurrency" in navigator) {
          const navigatorWithMemory = navigator as unknown as { deviceMemory?: number };
          const memory = navigatorWithMemory.deviceMemory || 4; // Default to 4GB if not available
          const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
          if (memory <= 2 || cores <= 2) {
            detectedQuality = "low";
          } else if (memory >= 8 && cores >= 6) {
            detectedQuality = "high";
          }
        }
        setQuality(detectedQuality);
      }
      setQualityInitialized(true);
    }
  }, [qualityOverride, qualityInitialized]);

  // Second useEffect - Update dot size and gap whenever quality changes
  React.useEffect(() => {
    if (typeof window !== "undefined" && qualityInitialized) {
      // Apply size settings based on device
      const isMobile = window.innerHeight <= 768;
      setDotSize(isMobile ? MOBILE_DOT_SIZE : DEFAULT_DOT_SIZE);

      // Apply gap settings based on quality and device
      const baseGap = isMobile ? MOBILE_DOT_GAP : DEFAULT_DOT_GAP;
      const qualityMultiplier = QUALITY_SETTINGS[qualityOverride || quality].dotGapMultiplier;
      setDotGap(baseGap * qualityMultiplier);

      glowStartTimeRef.current = performance.now();
    }
  }, [quality, qualityInitialized, qualityOverride]);

  const createGlowTexture = (size: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * 4;
    const ctx = canvas.getContext("2d")!;
    const radius = (size * 4) / 2;
    const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(200, 230, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(150, 200, 255, 0.6)");
    gradient.addColorStop(1, "rgba(100, 150, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  };

  const generateDots = (text: string): Dot[] => {
    const canvas = document.createElement("canvas");
    const w = 800;
    const h = 300;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#cce6ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxWidth = w * 0.9;
    let fontSize = 150;
    // Dùng font hệ thống và Arial để đồng nhất trên mọi nền tảng
    ctx.font = `bold ${fontSize}px system-ui, Arial, sans-serif`;
    // Đảm bảo font đã load xong (Firefox cần)
    if (document.fonts && document.fonts.check && !document.fonts.check(ctx.font)) {
      setTimeout(() => {
        setText(text);
      }, 50);
      return [];
    }
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      if (ctx.measureText(testLine).width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    while (lines.length * (fontSize + 10) > h && fontSize > 30) {
      fontSize -= 5;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }
    ctx.clearRect(0, 0, w, h);
    const lineHeight = fontSize + 10;
    const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, startY + i * lineHeight);
    });
    const imageData = ctx.getImageData(0, 0, w, h).data;
    const dots: Dot[] = [];
    const isCountdown = text === "3" || text === "2" || text === COUNTDOWN[2] || text === messages[0];
    const isFinalOne = text === COUNTDOWN[2];
    for (let y = 0; y < h; y += Math.round(dotGap)) {
      for (let x = 0; x < w; x += Math.round(dotGap)) {
        const i = (y * w + x) * 4;
        if (imageData[i + 3] > 128) {
          const tx = x - w / 2;
          const ty = -(y - h / 2);
          const visible = !isFinalOne || Math.random() < 0.3;
          const initialOpacity = text === COUNTDOWN[2] ? 0 : visible ? 1 : 0;
          dots.push({
            x: isCountdown ? 0 : Math.random() * 400 - 200,
            y: isCountdown ? 0 : Math.random() * 400 - 200,
            tx,
            ty,
            vx: 0,
            vy: 0,
            vz: 0,
            exploded: false,
            opacity: initialOpacity,
            glowIntensity: 0,
          });
        }
      }
    }
    return dots;
  };

  const setText = (text: string) => {
    const extraDots = dotsRef.current.filter((d) => d.isExtra);
    const mainDots = generateDots(text);
    dotsRef.current = mainDots.concat(extraDots);
    updateGeometry();
  };

  const updateGeometry = () => {
    const dots = dotsRef.current;
    const positions = new Float32Array(dots.length * 3);
    const opacities = new Float32Array(dots.length);
    const glowIntensities = new Float32Array(dots.length);
    dots.forEach((d, i) => {
      positions[i * 3] = d.x;
      positions[i * 3 + 1] = d.y;
      positions[i * 3 + 2] = 0;
      opacities[i] = d.opacity;
      glowIntensities[i] = d.glowIntensity;
    });
    const geometry = pointsRef.current!.geometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute("glow", new THREE.BufferAttribute(glowIntensities, 1));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;
    geometry.attributes.glow.needsUpdate = true;
  };

  const updateBlurGeometry = () => {
    if (!dotsBlurRef.current) return;
    const dots = dotsRef.current;
    const positions = new Float32Array(dots.length * 3);
    const opacities = new Float32Array(dots.length);
    const glowIntensities = new Float32Array(dots.length);
    dots.forEach((d, i) => {
      positions[i * 3] = d.x;
      positions[i * 3 + 1] = d.y;
      positions[i * 3 + 2] = 0;
      opacities[i] = d.opacity * 0.5;
      glowIntensities[i] = d.glowIntensity * 2.5;
    });
    const geometry = dotsBlurRef.current.geometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute("glow", new THREE.BufferAttribute(glowIntensities, 1));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;
    geometry.attributes.glow.needsUpdate = true;
  };

  const explodeDots = (speed = 0.4) => {
    dotsRef.current.forEach((d) => {
      d.vx = (Math.random() - 0.5) * speed;
      d.vy = (Math.random() - 0.5) * speed;
      d.vz = (Math.random() - 0.5) * speed;
      d.exploded = true;
      d.opacity = Math.random() * 0.7 + 0.3;
      d.glowIntensity = 2.5;
    });
    blurVisibleRef.current = true;
    blurFadeRef.current = 0;
  };

  const transitionToText = async (newText: string, prevText?: string) => {
    const newDots = generateDots(newText);
    if (newText === COUNTDOWN[2]) {
      // Tạo outline dot từ viền số 1, đồng thời cho hiệu ứng bay vào như flydot
      const message0Dots = generateDots(messages[0]);
      // Limit the number of flying dots based on quality settings
      const maxFlyDots = QUALITY_SETTINGS[qualityOverride || quality].maxFlyingDots;
      const flyDotCount = Math.min(maxFlyDots, Math.floor(message0Dots.length * 0.12));
      const outlinePoints = getOutlinePoints(COUNTDOWN[2], dotGap, flyDotCount);
      if (!outlinePoints || outlinePoints.length === 0) {
        console.warn("[transitionToText] outlinePoints is empty! Skipping flyDots for 1.");
        // Optionally: fallback to a default effect or just skip
        return;
      }
      const flyDots: Dot[] = [];
      const totalGroups = 5;
      for (let i = 0; i < flyDotCount; i++) {
        const pt = outlinePoints[i % outlinePoints.length];
        const jitter = 5;
        const jitterX = Math.random() * jitter * 1 - jitter;
        const jitterY = Math.random() * jitter * 1 - jitter;
        const group = Math.floor(Math.random() * totalGroups);
        const dot: Dot = {
          x: pt.x + jitterX,
          y: pt.y + jitterY,
          tx: message0Dots[i % message0Dots.length]?.tx ?? 0,
          ty: message0Dots[i % message0Dots.length]?.ty ?? 0,
          vx: 0,
          vy: 0,
          vz: 0,
          exploded: true,
          opacity: Math.random() * 0.15 + 0.85,
          glowIntensity: 0,
          isExtra: true,
          delayStart: group * 120,
          started: false,
        };
        let speed: number;
        switch (group) {
          case 0:
            speed = Math.random() * 1.2 + 1.8;
            break;
          case 1:
            speed = Math.random() * 1.8 + 1.2;
            break;
          case 2:
            speed = Math.random() * 1.5 + 1.8;
            break;
          case 3:
            speed = Math.random() * 1.5 + 1.5;
            break;
          default:
            speed = Math.random() * 1.8 + 1.0;
        }
        // Generate fully random movement angles instead of just outward angles
        const randomAngle = Math.random() * Math.PI * 2; // Random angle in all directions
        dot.vx = Math.cos(randomAngle) * speed * (0.5 + Math.random());
        dot.vy = Math.sin(randomAngle) * speed * (0.5 + Math.random());
        // Add more dynamic movement with varied speeds
        dot.opacity = Math.random() * 0.7 + 0.3;
        dot.glowIntensity = Math.random() * 2.0 + 0.5;
        // Random speed multipliers for unpredictable motion
        dot.vx += (Math.random() - 0.5) * 1.5;
        dot.vy += (Math.random() - 0.5) * 1.5;
        // Add a small z-velocity component for depth variation
        dot.vz = (Math.random() - 0.5) * 0.3;
        flyDots.push(dot);
      }

      const oldDots = dotsRef.current;
      const indices = Array.from({ length: newDots.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      newDots.forEach((d, i) => {
        const fromIdx = indices[i % indices.length];
        if (oldDots[fromIdx]) {
          d.x = oldDots[fromIdx].x;
          d.y = oldDots[fromIdx].y;
        }
      });
      dotsRef.current = newDots;
      updateGeometry();
      transitionStartTimeRef.current = performance.now();
      isTransitioningRef.current = true;
      isTransitioningRef.current = false;
      // Đảm bảo flying dots được khởi động ngay lập tức và có vận tốc
      setTimeout(() => {
        flyingDotsRef.current = flyDots.map((dot) => ({
          ...dot,
          started: true,
          vx: dot.vx || (Math.random() - 0.5) * 1.5,
          vy: dot.vy || (Math.random() - 0.5) * 1.5,
        }));
      }, 1600);
      // Đảm bảo update geometry để dot outline xuất hiện ngay khi chuyển sang 1
      updateGeometry();
      return;
    } else if (prevText === COUNTDOWN[2] && messages.length > 0 && newText === messages[0]) {
      // Optimize the transition from "1" to first message
      // Reduce the kept ratio for lower quality settings
      const keepRatioByQuality = {
        low: 0.5,
        medium: 0.8,
        high: 0.8,
      };
      const currentQuality = qualityOverride || quality;
      const keepRatio = keepRatioByQuality[currentQuality];
      const total = newDots.length;
      const keepCount = Math.floor(total * (keepRatio + 0.11));
      const indicesArr = Array.from({ length: total }, (_, i) => i);
      for (let i = indicesArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indicesArr[i], indicesArr[j]] = [indicesArr[j], indicesArr[i]];
      }
      const keepIndicesSet = new Set(indicesArr.slice(0, keepCount));
      // Limit missing indices based on quality setting
      const maxMissingDots = QUALITY_SETTINGS[currentQuality].maxFlyingDots;
      const missingIndices = indicesArr.slice(keepCount, keepCount + maxMissingDots);

      // Áp dụng hiệu ứng chuyển động từ dot cũ sang dot mới cho dots được giữ lại
      const oldDots = dotsRef.current;
      const indices = Array.from({ length: keepCount }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      newDots.forEach((d, i) => {
        if (keepIndicesSet.has(i)) {
          const fromIdx = indices[i % indices.length];
          if (oldDots[fromIdx]) {
            d.x = oldDots[fromIdx].x;
            d.y = oldDots[fromIdx].y;
          }
        }
      });

      // Giữ lại dot dựa theo keepRatio, lưu missingIndices để sử dụng tiếp
      dotsRef.current = newDots.filter((_, i) => keepIndicesSet.has(i));
      updateGeometry();
      setTimeout(() => {
        // Clear any existing flying dots that are no longer relevant
        flyingDotsRef.current = flyingDotsRef.current.filter((dot) => dot.gathering || dot.opacity > 0.4 || dot.isIndependence);

        const flyingDots = flyingDotsRef.current;
        for (let i = 0; i < Math.min(flyingDots.length, missingIndices.length); i++) {
          const targetIdx = missingIndices[i];
          flyingDots[i].tx = newDots[targetIdx].tx;
          flyingDots[i].ty = newDots[targetIdx].ty;
          flyingDots[i].gathering = true;
          flyingDots[i].opacity = Math.min(flyingDots[i].opacity + 0.3, 1.0);
        }
        setTimeout(() => {
          const allDots: Dot[] = [];
          dotsRef.current.forEach((dot) => {
            if (!dot.isIndependence) {
              allDots.push(dot);
            }
          });

          // Track filled positions more efficiently with a Set
          const filledPositions = new Set<string>();
          dotsRef.current.forEach((dot) => {
            if (!dot.isIndependence) {
              filledPositions.add(`${dot.tx},${dot.ty}`);
            }
          });

          // Only consider flying dots that are actually gathering and visible
          flyingDotsRef.current.forEach((dot) => {
            if (!dot.isIndependence && dot.gathering && dot.opacity > 0.2) {
              filledPositions.add(`${dot.tx},${dot.ty}`);
            }
          });

          // Limit the number of additional dots to add based on quality setting
          const qualitySetting = QUALITY_SETTINGS[qualityOverride || quality];
          const maxMissingDots = Math.min(qualitySetting.maxFlyingDots, Math.floor(newDots.length * 0.3));

          // Find missing positions (limit by quality)
          const missingPositions = [];
          for (let i = 0; i < newDots.length && missingPositions.length < maxMissingDots; i++) {
            const posKey = `${newDots[i].tx},${newDots[i].ty}`;
            if (!filledPositions.has(posKey)) {
              missingPositions.push(i);
            }
          }

          // Update dots array one time instead of in a loop
          dotsRef.current = allDots;
          updateGeometry();

          // Only launch additional cleanup for flying dots if needed
          if (flyingDotsRef.current.length > 0) {
            setTimeout(() => {
              // Only keep flying dots that are visible and independent
              const remainingFlyingDots = flyingDotsRef.current.filter((d) => !d.isIndependence && d.opacity > 0.2);

              // Limit the number of remaining dots that get repurposed
              const maxRemainingToConvert = Math.min(remainingFlyingDots.length, qualitySetting.maxFlyingDots / 2);

              for (let i = 0; i < maxRemainingToConvert; i++) {
                if (!remainingFlyingDots[i].gathering && Math.random() > 0.6) {
                  remainingFlyingDots[i].isExtra = true;

                  // Only convert some dots to gathering mode
                  if (Math.random() > 0.5 && newDots.length > 0) {
                    const randIdx = Math.floor(Math.random() * newDots.length);
                    remainingFlyingDots[i].tx = newDots[randIdx].tx;
                    remainingFlyingDots[i].ty = newDots[randIdx].ty;
                    remainingFlyingDots[i].gathering = true;
                  }
                }
              }

              // For low quality, remove more flying dots to improve performance
              if (quality === "low") {
                flyingDotsRef.current = flyingDotsRef.current.filter((d) => d.gathering || d.opacity > 0.6 || d.isIndependence);
              }
            }, 1000); // Reduced from 4000ms to 1000ms for faster cleanup
          }
        }, 200); // Reduced from 400ms to 200ms for snappier response
      }, 1500);
    } else {
      const oldDots = dotsRef.current;
      const indices = Array.from({ length: newDots.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      newDots.forEach((d, i) => {
        const fromIdx = indices[i % indices.length];
        if (oldDots[fromIdx]) {
          d.x = oldDots[fromIdx].x;
          d.y = oldDots[fromIdx].y;
        }
      });
      if (messages.length > 0 && newText === messages[messages.length - 2]) {
        const flyDotsCount = Math.max(10, Math.floor(newDots.length * 0.08));
        const flyDots = [];
        for (let i = 0; i < flyDotsCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 350 + 100;
          flyDots.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            tx: 0,
            ty: 0,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            vz: (Math.random() - 0.5) * 0.3,
            exploded: true,
            opacity: Math.random() * 0.7 + 0.3,
            glowIntensity: 1.5,
            isExtra: true,
            isIndependence: true,
          });
        }
        flyingDotsRef.current = flyDots;
        dotsRef.current = newDots;
      } else {
        dotsRef.current = newDots;
        // flyingDotsRef.current = [];
      }
      updateGeometry();
      return;
    }
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 260;
    try {
    } catch (error) {}
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    const container = containerRef.current;
    container?.appendChild(renderer.domElement);
    const geometry = new THREE.BufferGeometry();
    const vertexShader = `
            attribute float alpha;
            attribute float glow;
            varying float vAlpha;
            varying float vGlow;
            void main() {
                vAlpha = alpha;
                vGlow = glow;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = ${dotSize.toFixed(1)} * (300.0 / -mvPosition.z) * (1.0 + glow * 0.3);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
    const fragmentShader = `
            varying float vAlpha;
            varying float vGlow;
            uniform sampler2D pointTexture;
            uniform float uTime;
            void main() {
                vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                float pulse = 0.5 + 0.5 * sin(uTime * 5.0);
                float glow = smoothstep(0.5, 1.0, vAlpha) * (1.0 + pulse * 0.5 + vGlow * 2.0);
                vec3 baseColor = mix(
                    vec3(0.7, 0.8, 1.0), 
                    vec3(0.4, 0.6, 1.5), 
                    smoothstep(1.0, 3.0, glow)
                );
                float alpha = vAlpha * texColor.a * (1.0 + glow * 2.0);
                gl_FragColor = vec4(baseColor * (1.0 + glow * 0.8), alpha);
            }
        `;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: createGlowTexture(dotSize) },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    // Check if blur should be enabled based on quality settings
    const blurEnabled = QUALITY_SETTINGS[quality].blurEnabled;

    if (blurEnabled) {
      const blurGeometry = new THREE.BufferGeometry();
      const blurMaterial = new THREE.ShaderMaterial({
        uniforms: {
          pointTexture: { value: createGlowTexture(dotSize * 2.5) },
          uTime: { value: 0 },
        },
        vertexShader: vertexShader.replace(
          /gl_PointSize = ([^;]+);/,
          `gl_PointSize = (${(dotSize * 2.5).toFixed(1)}) * (300.0 / -mvPosition.z) * (1.0 + glow * 0.3);`
        ),
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const blurPoints = new THREE.Points(blurGeometry, blurMaterial);
      blurPoints.renderOrder = -1;
      scene.add(blurPoints);
      dotsBlurRef.current = blurPoints;
    }
    const animate = (time: number) => {
      const now = performance.now();
      // Limit framerate based on quality settings to improve performance
      const frameSkip = quality === "low" ? 2 : 1; // Skip frames on low quality
      if (frameSkip > 1 && now - (lastTimeRef.current || 0) < 16.67 * frameSkip) {
        requestAnimationFrame(animate);
        return;
      }

      const deltaTime = Math.min(1.5, (now - (lastTimeRef.current || now)) / 16.67); // Normalize to 60 FPS with limit
      lastTimeRef.current = now;

      material.uniforms.uTime.value = time * 0.001;
      const dots = dotsRef.current;
      const positions = pointsRef.current!.geometry.attributes.position;
      const alphas = pointsRef.current!.geometry.attributes.alpha;
      const glows = pointsRef.current!.geometry.attributes.glow;
      let globalGlowFactor = 0;
      if (isGlowingRef.current) {
        const elapsed = now - glowStartTimeRef.current;
        globalGlowFactor = glowIntensityRef.current * Math.max(0, 1 - elapsed / 800);
      }
      let transitionGlowFactor = 0;
      if (isTransitioningRef.current) {
        const elapsed = now - transitionStartTimeRef.current;
        transitionGlowFactor = Math.max(0, 1 - elapsed / 1000);
      }
      dots.forEach((d, i) => {
        if (d.isExtra) {
          d.x += d.vx * deltaTime;
          d.y += d.vy * deltaTime;
          d.opacity *= Math.pow(0.97, deltaTime);
          d.glowIntensity *= Math.pow(0.96, deltaTime);
          if (d.opacity < 0.05) d.opacity = 0;
        } else if (!d.exploded) {
          const factor = 0.05 * deltaTime;
          d.x += (d.tx - d.x) * factor;
          d.y += (d.ty - d.y) * factor;
        } else {
          d.x += d.vx * deltaTime;
          d.y += d.vy * deltaTime;
        } // Kiểm tra nếu đang hiển thị số 1 thì không áp dụng hiệu ứng glow
        const isDisplayingNumberOne = COUNTDOWN[indexRef.current] === COUNTDOWN[2];
        if (isDisplayingNumberOne) {
          // Không áp dụng hiệu ứng glow cho số 1
          d.glowIntensity = 0;
        } else if (isTransitioningRef.current) {
          d.glowIntensity = transitionGlowFactor * 2.0;
        } else {
          d.glowIntensity *= Math.pow(0.95, deltaTime);
        }
        positions.setXYZ(i, d.x, d.y, 0);
        const baseOpacity = d.exploded ? d.opacity : 1;
        const glowEffect = globalGlowFactor * (0.5 + 0.5 * Math.sin(time * 0.005));
        alphas.setX(i, Math.min(2.0, baseOpacity + glowEffect + d.glowIntensity * 0.5));
        glows.setX(i, d.glowIntensity);
      });
      if (flyingDotsRef.current.length > 0) {
        let flyingPoints = scene.getObjectByName("flyingDots") as THREE.Points | null;
        if (!flyingPoints) {
          const flyingGeometry = new THREE.BufferGeometry();
          flyingPoints = new THREE.Points(flyingGeometry, material);
          flyingPoints.name = "flyingDots";
          scene.add(flyingPoints);
        }

        // Set a hard limit on flying dots based on quality setting
        const maxFlyingDots = QUALITY_SETTINGS[qualityOverride || quality].maxFlyingDots;
        if (flyingDotsRef.current.length > maxFlyingDots) {
          // Keep only the most visible dots
          flyingDotsRef.current.sort((a, b) => b.opacity - a.opacity);
          flyingDotsRef.current = flyingDotsRef.current.slice(0, maxFlyingDots);
        }

        const flyingDots = flyingDotsRef.current;
        const dotsToAdd: Dot[] = [];
        const dotsToRemove = new Set<number>();

        flyingDots.forEach((dot, index) => {
          if (dot.gathering) {
            // Tăng tốc độ hội tụ khi gần đến điểm đích (nhanh hơn)
            const distance = Math.sqrt(Math.pow(dot.tx - dot.x, 2) + Math.pow(dot.ty - dot.y, 2));
            const speedFactor = Math.max(0.1, Math.min(0.2, 20 / (distance + 20))) * deltaTime;
            dot.x += (dot.tx - dot.x) * speedFactor;
            dot.y += (dot.ty - dot.y) * speedFactor;

            // Khi đến gần điểm đích, hợp nhất với thông điệp
            if (Math.abs(dot.x - dot.tx) < 2 && Math.abs(dot.y - dot.ty) < 2) {
              dotsToAdd.push({
                x: dot.tx,
                y: dot.ty,
                tx: dot.tx,
                ty: dot.ty,
                vx: 0,
                vy: 0,
                vz: 0,
                exploded: false,
                opacity: 1,
                glowIntensity: -0.6,
                isExtra: false,
                gathering: false,
              });
              dotsToRemove.add(index);
            }
          } else {
            if (dot.started !== false) {
              dot.x += dot.vx * deltaTime;
              dot.y += dot.vy * deltaTime;

              // Reduce the jitter effect for better performance
              const jitterFactor = quality === "low" ? 0.01 : 0.03;
              dot.vx += (Math.random() - 0.5) * jitterFactor * deltaTime;
              dot.vy += (Math.random() - 0.5) * jitterFactor * deltaTime;

              // Giới hạn tốc độ tối đa
              const maxSpeed = 2.5;
              const currentSpeed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
              if (currentSpeed > maxSpeed) {
                dot.vx = (dot.vx / currentSpeed) * maxSpeed;
                dot.vy = (dot.vy / currentSpeed) * maxSpeed;
              }
            }

            // Làm cho opacity giảm nhanh hơn để giải phóng dot sớm hơn
            const opacityFactor = quality === "low" ? 0.95 : 0.998;
            dot.opacity *= Math.pow(opacityFactor, deltaTime);

            // Remove dots that are nearly invisible
            if (dot.opacity < 0.01) {
              dotsToRemove.add(index);
            }
          }
          dot.glowIntensity *= Math.pow(0.9995, deltaTime);

          // Also remove dots that are far off screen
          if (Math.abs(dot.x) > 800 || Math.abs(dot.y) > 600) {
            dotsToRemove.add(index);
          }
        });

        // Add new dots
        if (dotsToAdd.length > 0) {
          dotsRef.current = [...dotsRef.current, ...dotsToAdd];
          updateGeometry();
        }

        // Remove dots that should be removed
        flyingDotsRef.current = flyingDots.filter((_, i) => !dotsToRemove.has(i));

        // Only update geometry if there are any flying dots left
        if (flyingDotsRef.current.length > 0) {
          const positions = new Float32Array(flyingDotsRef.current.length * 3);
          const opacities = new Float32Array(flyingDotsRef.current.length);
          const glows = new Float32Array(flyingDotsRef.current.length);

          flyingDotsRef.current.forEach((d, i) => {
            positions[i * 3] = d.x;
            positions[i * 3 + 1] = d.y;
            positions[i * 3 + 2] = 0;
            opacities[i] = d.opacity;
            glows[i] = d.glowIntensity;
          });

          const flyingGeometry = flyingPoints.geometry as THREE.BufferGeometry;
          flyingGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          flyingGeometry.setAttribute("alpha", new THREE.BufferAttribute(opacities, 1));
          flyingGeometry.setAttribute("glow", new THREE.BufferAttribute(glows, 1));
          flyingGeometry.attributes.position.needsUpdate = true;
          flyingGeometry.attributes.alpha.needsUpdate = true;
          flyingGeometry.attributes.glow.needsUpdate = true;
          flyingPoints.visible = true;
        } else {
          flyingPoints.visible = false;
        }
      } else {
        const obj = scene.getObjectByName("flyingDots");
        if (obj) scene.remove(obj);
      }
      if (blurVisibleRef.current && dotsBlurRef.current && QUALITY_SETTINGS[quality].blurEnabled) {
        if (blurFadeRef.current < 1) blurFadeRef.current += 0.05 * deltaTime;
        const blurAlpha = Math.min(1, blurFadeRef.current);
        updateBlurGeometry();
        (dotsBlurRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time * 0.001;
        const blurAttr = dotsBlurRef.current.geometry.attributes.alpha;
        for (let i = 0; i < blurAttr.count; i++) {
          blurAttr.setX(i, blurAttr.getX(i) * blurAlpha * QUALITY_SETTINGS[quality].effectIntensity);
        }
        blurAttr.needsUpdate = true;
        dotsBlurRef.current.visible = true;
      } else if (dotsBlurRef.current) {
        dotsBlurRef.current.visible = false;
      }
      positions.needsUpdate = true;
      alphas.needsUpdate = true;
      glows.needsUpdate = true;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    const cleanupAll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dotsRef.current = [];
      flyingDotsRef.current = [];
      if (container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (dotsBlurRef.current) scene.remove(dotsBlurRef.current);
      if (pointsRef.current) scene.remove(pointsRef.current);
      // Dispose all geometries/materials
      scene.traverse((obj: THREE.Object3D) => {
        // Dispose geometry if present
        if ("geometry" in obj && (obj as THREE.Mesh).geometry && typeof (obj as THREE.Mesh).geometry.dispose === "function") {
          (obj as THREE.Mesh).geometry.dispose();
        }
        // Dispose material if present
        if ("material" in obj && (obj as THREE.Mesh).material) {
          const material = (obj as THREE.Mesh).material;
          if (Array.isArray(material)) {
            material.forEach((mat) => {
              if (mat && typeof mat.dispose === "function") {
                mat.dispose();
              }
            });
          } else if (typeof material.dispose === "function") {
            material.dispose();
          }
        }
      });
    };
    const next = async () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (phaseRef.current === "countdown") {
        indexRef.current++;
        if (indexRef.current >= COUNTDOWN.length) {
          phaseRef.current = "message";
          indexRef.current = 0;
          if (messages.length > 0) {
            await transitionToText(messages[0], COUNTDOWN[2]);
            timeoutRef.current = setTimeout(next, MESSAGE_DELAY);
          } else {
            explodeDots(1.2);
            onComplete?.();
          }
          return;
        }
        const currentText = COUNTDOWN[indexRef.current];
        const prevText = COUNTDOWN[indexRef.current - 1] || undefined;
        await transitionToText(currentText, prevText);
        if (currentText === COUNTDOWN[2]) {
          timeoutRef.current = setTimeout(next, 1500);
        } else {
          timeoutRef.current = setTimeout(next, COUNTDOWN_DELAY);
        }
      } else if (phaseRef.current === "message") {
        indexRef.current++;
        if (indexRef.current >= messages.length) {
          explodeDots(1.2);
          setTimeout(() => {
            onComplete?.();
          }, 1200);
          return;
        }
        const currentMessage = messages[indexRef.current];
        if (currentMessage !== undefined) {
          await transitionToText(currentMessage, messages[indexRef.current - 1]);
          timeoutRef.current = setTimeout(next, MESSAGE_DELAY);
        }
      }
    };
    phaseRef.current = "countdown";
    indexRef.current = 0;
    setText(COUNTDOWN[0]);
    timeoutRef.current = setTimeout(next, COUNTDOWN_DELAY);
    requestAnimationFrame(animate);
    return () => {
      cleanupAll();
    };
  }, [messages, dotSize, dotGap]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        background: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
        zIndex: 9999,
        touchAction: "none",
      }}
    />
  );
};

export default Countdown3D;

function getOutlinePoints(text: string, dotGap: number, sampleCount: number = 120) {
  const w = 800,
    h = 300;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = 150;
  ctx.font = `900 ${fontSize}px 'Roboto Mono', Arial Black, Arial, sans-serif`;
  ctx.clearRect(0, 0, w, h);
  ctx.fillText(text, w / 2, h / 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#fff";
  ctx.strokeText(text, w / 2, h / 2);

  const imageData = ctx.getImageData(0, 0, w, h);
  const outline: { x: number; y: number }[] = [];

  // For optimal performance, increase the gap between scanned pixels based on sample count
  // This reduces the total number of pixels we need to check
  const effectiveDotGap = Math.max(2, Math.floor(4 * (150 / sampleCount)));
  const alphaThreshold = 8;

  // Pre-calculate edge detection offsets
  const edgeOffsets = [];
  for (let dy = -effectiveDotGap; dy <= effectiveDotGap; dy += effectiveDotGap) {
    for (let dx = -effectiveDotGap; dx <= effectiveDotGap; dx += effectiveDotGap) {
      if (dx !== 0 || dy !== 0) {
        edgeOffsets.push({ dx, dy });
      }
    }
  }

  // Only scan every nth pixel row/column for better performance
  const scanGap = sampleCount < 80 ? 1 : 2; // Skip rows/columns for larger sample counts

  for (let y = effectiveDotGap; y < h - effectiveDotGap; y += effectiveDotGap * scanGap) {
    for (let x = effectiveDotGap; x < w - effectiveDotGap; x += effectiveDotGap * scanGap) {
      const idx = (y * w + x) * 4;
      if (imageData.data[idx + 3] > alphaThreshold) {
        let isEdge = false;

        // Check surrounding pixels using pre-calculated offsets
        for (let i = 0; i < edgeOffsets.length && !isEdge; i++) {
          const { dx, dy } = edgeOffsets[i];
          const ny = y + dy;
          const nx = x + dx;

          if (ny < 0 || ny >= h || nx < 0 || nx >= w) {
            isEdge = true;
          } else {
            const ni = (ny * w + nx) * 4;
            if (imageData.data[ni + 3] <= alphaThreshold) {
              isEdge = true;
            }
          }
        }

        if (isEdge) {
          outline.push({ x, y });
          // Break early if we have enough points
          if (outline.length >= sampleCount * 2) {
            break;
          }
        }
      }
    }
    // Break early if we have enough points
    if (outline.length >= sampleCount * 2) {
      break;
    }
  }

  // If we have too many points, sample evenly
  if (outline.length > sampleCount) {
    const step = Math.floor(outline.length / sampleCount);
    return outline
      .filter((_, i) => i % step === 0)
      .slice(0, sampleCount)
      .map((pt) => ({
        x: pt.x - w / 2,
        y: -(pt.y - h / 2),
      }));
  }

  return outline.map((pt) => ({ x: pt.x - w / 2, y: -(pt.y - h / 2) }));
}

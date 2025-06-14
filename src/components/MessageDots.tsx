/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNTDOWN = ["3", "2", "1"];
const COUNTDOWN_DELAY = 1300;
const MESSAGE_DELAY = 3000;

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_GAP = 4;
const MOBILE_DOT_SIZE = 3;
const MOBILE_DOT_GAP = 4;

// Quality settings configuration
const QUALITY_SETTINGS = {
  low: {
    dotGapMultiplier: 1.5, // More space between dots = fewer dots
    effectIntensity: 0.7, // Reduce visual effects
    blurEnabled: false, // Disable blur effect for performance
  },
  medium: {
    dotGapMultiplier: 1.2,
    effectIntensity: 0.85,
    blurEnabled: true,
  },
  high: {
    dotGapMultiplier: 1.0, // Standard quality
    effectIntensity: 1.0,
    blurEnabled: true,
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
    ctx.font = `bold ${fontSize}px sans-serif`;
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
    const isCountdown = text === "3" || text === "2" || text === "1" || text === messages[0];
    const isFinalOne = text === "1";
    for (let y = 0; y < h; y += dotGap) {
      for (let x = 0; x < w; x += dotGap) {
        const i = (y * w + x) * 4;
        if (imageData[i + 3] > 128) {
          const tx = x - w / 2;
          const ty = -(y - h / 2);
          const visible = !isFinalOne || Math.random() < 0.3;
          const initialOpacity = text === "1" ? 0 : visible ? 1 : 0;
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

  const enableGlow = (intensity = 1.0, duration = 800) => {
    glowStartTimeRef.current = performance.now();
    // Apply quality setting to glow intensity
    glowIntensityRef.current = intensity * QUALITY_SETTINGS[quality].effectIntensity;
    isGlowingRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      isGlowingRef.current = false;
    }, duration);
  };

  const startTransition = () => {
    transitionStartTimeRef.current = performance.now();
    isTransitioningRef.current = true;
    dotsRef.current.forEach((dot) => {
      dot.glowIntensity = 2.0;
    });
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 1000);
  };

  const setText = (text: string) => {
    startTransition();
    const extraDots = dotsRef.current.filter((d) => d.isExtra);
    const mainDots = generateDots(text);
    dotsRef.current = mainDots.concat(extraDots);
    updateGeometry();
    enableGlow(2.0, 1000);
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
    enableGlow(3.0, 1200);
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
    if (newText === "1") {
      const oneDots = generateDots("1");
      const message0Dots = generateDots(messages[0]);
      const flyDotCount = Math.floor(message0Dots.length * 0.35);
      const outlinePoints = getOutlinePoints("1", dotGap, flyDotCount);
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
        let angle: number;
        let speed: number;
        switch (group) {
          case 0:
            angle = Math.random() * Math.PI * 2;
            speed = Math.random() * 1.2 + 1.8;
            break;
          case 1:
            angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
            speed = Math.random() * 1.8 + 1.2;
            break;
          case 2:
            angle = Math.PI + (Math.random() * Math.PI) / 2 - Math.PI / 4;
            speed = Math.random() * 1.5 + 1.8;
            break;
          case 3:
            angle = (Math.random() * Math.PI) / 2 + Math.PI / 4;
            speed = Math.random() * 1.5 + 1.5;
            break;
          default:
            angle = Math.PI + (Math.random() * Math.PI) / 2 + Math.PI / 4;
            speed = Math.random() * 1.8 + 1.0;
        }
        dot.vx = Math.cos(angle) * speed + Math.random() * 0.1 - 0.25;
        dot.vy = Math.sin(angle) * speed + Math.random() * 0.1 - 0.25;
        flyDots.push(dot);
      } // Gán các dots cho số 1 mà không áp dụng hiệu ứng glow
      dotsRef.current = oneDots;

      // Đảm bảo không có glowing cho số 1
      dotsRef.current.forEach((dot) => {
        dot.glowIntensity = 0;
      });
      updateGeometry();
      // Bắt đầu transition nhưng không gọi startTransition() để tránh hiệu ứng glow
      transitionStartTimeRef.current = performance.now();
      isTransitioningRef.current = true;
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1000);
      // Không gọi enableGlow để tránh hiệu ứng glow trên số 1
      flyingDotsRef.current = flyDots;
      return;
    } else if (prevText === "1" && messages.length > 0 && newText === messages[0]) {
      const keepRatio = 0.8;
      const total = newDots.length;
      const keepCount = Math.floor(total * keepRatio);
      const indicesArr = Array.from({ length: total }, (_, i) => i);
      for (let i = indicesArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indicesArr[i], indicesArr[j]] = [indicesArr[j], indicesArr[i]];
      }
      const keepIndicesSet = new Set(indicesArr.slice(0, keepCount));
      const missingIndices = indicesArr.slice(keepCount);
      dotsRef.current = newDots.filter((_, i) => keepIndicesSet.has(i));
      updateGeometry();
      setTimeout(() => {
        const flyingDots = flyingDotsRef.current;
        for (let i = 0; i < flyingDots.length; i++) {
          if (i < missingIndices.length) {
            const targetIdx = missingIndices[i];
            flyingDots[i].tx = newDots[targetIdx].tx;
            flyingDots[i].ty = newDots[targetIdx].ty;
            flyingDots[i].gathering = true;
            flyingDots[i].opacity = Math.min(flyingDots[i].opacity + 0.3, 1.0);
          } else {
            const randomTargetIdx = Math.floor(Math.random() * total);
            flyingDots[i].tx = newDots[randomTargetIdx].tx;
            flyingDots[i].ty = newDots[randomTargetIdx].ty;
            flyingDots[i].gathering = true;
            flyingDots[i].opacity = Math.min(flyingDots[i].opacity + 0.3, 1.0);
          }
        }
        setTimeout(() => {
          const allDots: Dot[] = [];
          dotsRef.current.forEach((dot) => {
            allDots.push(dot);
          });
          const filledPositions = new Set<string>();
          dotsRef.current.forEach((dot) => {
            filledPositions.add(`${dot.tx},${dot.ty}`);
          });
          flyingDotsRef.current.forEach((dot) => {
            if (dot.gathering && dot.opacity > 0.2) {
              filledPositions.add(`${dot.tx},${dot.ty}`);
            }
          });
          for (let i = 0; i < newDots.length; i++) {
            const posKey = `${newDots[i].tx},${newDots[i].ty}`;
            if (!filledPositions.has(posKey)) {
              const edge = Math.floor(Math.random() * 4);
              let x = 0,
                y = 0;
              const margin = 100;
              const w = 800,
                h = 300;
              if (edge === 0) {
                x = Math.random() * w - w / 2;
                y = h / 2 + margin;
              } else if (edge === 1) {
                x = Math.random() * w - w / 2;
                y = -h / 2 - margin;
              } else if (edge === 2) {
                x = -w / 2 - margin;
                y = Math.random() * h - h / 2;
              } else {
                x = w / 2 + margin;
                y = Math.random() * h - h / 2;
              }
              allDots.push({
                x,
                y,
                tx: newDots[i].tx,
                ty: newDots[i].ty,
                vx: 0,
                vy: 0,
                vz: 0,
                exploded: false,
                opacity: 1,
                glowIntensity: 0,
                isExtra: false,
                gathering: true,
              });
              filledPositions.add(posKey);
            }
          }
          dotsRef.current = allDots;
          updateGeometry();
          setTimeout(() => {
            const remainingFlyingDots = flyingDotsRef.current;
            for (let i = 0; i < remainingFlyingDots.length; i++) {
              if (!remainingFlyingDots[i].gathering) {
                remainingFlyingDots[i].gathering = false;
                remainingFlyingDots[i].isExtra = true;
                if (Math.random() > 0.7) {
                  const randIdx = Math.floor(Math.random() * newDots.length);
                  remainingFlyingDots[i].tx = newDots[randIdx].tx;
                  remainingFlyingDots[i].ty = newDots[randIdx].ty;
                  remainingFlyingDots[i].gathering = true;
                }
              }
            }
          }, 4000);
        }, 400);
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
      if (messages.length > 0 && newText === messages[messages.length - 1]) {
        const extraDotsCount = Math.max(10, Math.floor(newDots.length * 0.08));
        const extraDots = [];
        for (let i = 0; i < extraDotsCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 350 + 100;
          extraDots.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            tx: 0,
            ty: 0,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            vz: (Math.random() - 0.5) * 0.3,
            exploded: true,
            opacity: Math.random() * 0.7 + 0.3,
            glowIntensity: 2.5,
            isExtra: true,
            delayStart: i * 80,
            started: false,
          });
        }
        dotsRef.current = newDots.concat(extraDots);
      } else {
        dotsRef.current = newDots;
      }
      flyingDotsRef.current = [];
      updateGeometry();
      startTransition();
      enableGlow(2.0, 800);
      return;
    }
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 260;
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
          `gl_PointSize = (${dotSize * 2.5}.0) * (300.0 / -mvPosition.z) * (1.0 + glow * 0.3);`
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
      const deltaTime = Math.min(1, (now - (lastTimeRef.current || now)) / 16.67); // Normalize to 60 FPS
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
        const isDisplayingNumberOne = COUNTDOWN[indexRef.current] === "1";
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
          const flyingMaterial = material.clone();
          flyingPoints = new THREE.Points(flyingGeometry, flyingMaterial);
          flyingPoints.name = "flyingDots";
          scene.add(flyingPoints);
        }
        const flyingDots = flyingDotsRef.current;
        flyingDots.forEach((dot) => {
          if (dot.delayStart !== undefined && dot.started === false) {
            dot.delayStart -= 16.67 * deltaTime;
            if (dot.delayStart <= 0) {
              dot.started = true;
            } else {
              dot.x += (Math.random() - 0.5) * 0.2 * deltaTime;
              dot.y += (Math.random() - 0.5) * 0.2 * deltaTime;
              return;
            }
          }
          if (dot.gathering) {
            const factor = 0.05 * deltaTime;
            dot.x += (dot.tx - dot.x) * factor;
            dot.y += (dot.ty - dot.y) * factor;
            if (Math.abs(dot.x - dot.tx) < 2 && Math.abs(dot.y - dot.ty) < 2) {
              const addToDots = {
                x: dot.tx,
                y: dot.ty,
                tx: dot.tx,
                ty: dot.ty,
                vx: 0,
                vy: 0,
                vz: 0,
                exploded: false,
                opacity: 1,
                glowIntensity: dot.glowIntensity,
                isExtra: false,
                gathering: false,
              };
              dotsRef.current = [...dotsRef.current, addToDots];
              updateGeometry();
              dot.opacity = 0;
            } else {
              dot.opacity = Math.min(dot.opacity + 0.01 * deltaTime, 1.0);
            }
          } else {
            if (dot.started !== false) {
              dot.x += dot.vx * deltaTime;
              dot.y += dot.vy * deltaTime;
            }
            dot.opacity *= Math.pow(0.9995, deltaTime);
            const bound = 500;
            if (dot.x < -bound || dot.x > bound) dot.vx *= -0.95;
            if (dot.y < -bound || dot.y > bound) dot.vy *= -0.95;
          }
          dot.glowIntensity *= Math.pow(0.9995, deltaTime);
        });
        flyingDotsRef.current = flyingDots.filter((d) => {
          if (d.opacity > 0.005) return true;
          const onScreen = Math.abs(d.x) < 600 && Math.abs(d.y) < 500;
          return onScreen;
        });
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
        flyingPoints.visible = flyingDotsRef.current.length > 0;
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
    const next = async () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (phaseRef.current === "countdown") {
        indexRef.current++;
        if (indexRef.current >= COUNTDOWN.length) {
          phaseRef.current = "message";
          indexRef.current = 0;
          if (messages.length > 0) {
            await transitionToText(messages[0], "1");
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
        if (currentText === "1") {
          timeoutRef.current = setTimeout(next, 1500);
        } else {
          timeoutRef.current = setTimeout(next, COUNTDOWN_DELAY);
        }
      } else if (phaseRef.current === "message") {
        indexRef.current++;
        if (indexRef.current >= messages.length) {
          explodeDots(1.2);
          onComplete?.();
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      renderer.dispose();
      if (container) {
        container.removeChild(renderer.domElement);
      }
      if (dotsBlurRef.current) scene.remove(dotsBlurRef.current);
    };
  }, [messages, dotSize, dotGap, quality, setText, transitionToText, explodeDots, onComplete]);

  // Add quality selector UI
  const QualitySelector = () => {
    return (
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          background: "rgba(0,0,0,0.5)",
          padding: "5px",
          borderRadius: "4px",
          color: "white",
          fontSize: "12px",
          userSelect: "none",
        }}
      >
        <div style={{ marginBottom: "5px" }}>Animation Quality:</div>
        <div style={{ display: "flex", gap: "5px" }}>
          {(["low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              style={{
                padding: "3px 8px",
                background: quality === q ? "#4a90e2" : "#333",
                border: "none",
                borderRadius: "3px",
                color: "white",
                cursor: "pointer",
              }}
              onClick={() => {
                // Save preference to localStorage
                if (typeof localStorage !== "undefined") {
                  localStorage.setItem("dotsQualityPreference", q);
                }

                // Update quality state
                setQuality(q);
              }}
            >
              {q.charAt(0).toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  };
  // Quality preference is now handled in the initialization useEffect

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <QualitySelector />
    </div>
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
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.clearRect(0, 0, w, h);
  ctx.fillText(text, w / 2, h / 2);
  const imageData = ctx.getImageData(0, 0, w, h);
  const outline: { x: number; y: number }[] = [];
  for (let y = dotGap; y < h - dotGap; y += dotGap) {
    for (let x = dotGap; x < w - dotGap; x += dotGap) {
      const idx = (y * w + x) * 4;
      if (imageData.data[idx + 3] > 128) {
        let isEdge = false;
        for (let dy = -dotGap; dy <= dotGap && !isEdge; dy += dotGap) {
          for (let dx = -dotGap; dx <= dotGap && !isEdge; dx += dotGap) {
            if (dx === 0 && dy === 0) continue;
            const ni = ((y + dy) * w + (x + dx)) * 4;
            if (y + dy < 0 || y + dy >= h || x + dx < 0 || x + dx >= w || imageData.data[ni + 3] < 128) {
              isEdge = true;
            }
          }
        }
        if (isEdge) outline.push({ x, y });
      }
    }
  }
  if (outline.length > sampleCount) {
    const step = Math.floor(outline.length / sampleCount);
    return outline
      .filter((_, i) => i % step === 0)
      .map((pt) => ({
        x: pt.x - w / 2,
        y: -(pt.y - h / 2),
      }));
  }
  return outline.map((pt) => ({ x: pt.x - w / 2, y: -(pt.y - h / 2) }));
}

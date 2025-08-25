import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import styles from "./responsive.module.css";

export type TextOverlayProps = {
  texts?: string[];
  color?: string;
  fontSize?: number;
  moveDurationMs?: number;
  staggerMs?: number;
  holdDurationMs?: number;
  vanishDurationMs?: number;
  targetZ?: number;
  style?: React.CSSProperties;
  wordSpacing?: number;
  maxLineWidth?: number;
  lineHeight?: number;
  onAllTextsCompleted?: () => void;
  /** Force performance mode. Default 'auto' */
  performanceMode?: "auto" | "low" | "high";
};

const layerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

// --- Heuristics to tier devices ---
function detectTier(): "low" | "high" {
  try {
    const cores = (navigator as any).hardwareConcurrency ?? 2;
    const mem = (navigator as any).deviceMemory ?? 2; // GB
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|huawei/.test(ua);
    // simple heuristic: few cores OR low mem OR mobile -> low tier
    if (cores <= 4 || mem <= 3 || isMobile) return "low";
    return "high";
  } catch {
    return "low";
  }
}

// Small moving average helper for FPS
class FPS {
  private last = performance.now();
  private acc = 0;
  private n = 0;
  fps = 60;
  tick() {
    const now = performance.now();
    const dt = now - this.last;
    this.last = now;
    const inst = dt > 0 ? 1000 / dt : 60;
    this.acc += inst;
    this.n += 1;
    if (this.n >= 20) {
      this.fps = this.acc / this.n;
      this.acc = 0;
      this.n = 0;
    }
  }
}

// Helper function to validate and normalize color
function validateColor(color: string): string {
  // Remove # if present
  let hex = color.replace("#", "");

  // Handle 3-digit hex colors by expanding them
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Check if it's a valid 6-digit hex color
  if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
    return `#${hex}`;
  }

  // Try to handle named colors or other formats
  if (color.startsWith("rgb") || color === "white" || color === "black" || color === "red" || color === "blue" || color === "green") {
    return color;
  }

  // Fallback to white
  console.warn(`Invalid color "${color}", using white as fallback`);
  return "#ffffff";
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  // Validate and normalize color first
  const validColor = validateColor(color);

  // If it's not a hex color, return the original
  if (!validColor.startsWith("#")) {
    return validColor;
  }

  // Remove # and ensure 6-digit hex
  let hex = validColor.replace("#", "");

  // Parse RGB values
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));

  // Convert back to hex with proper padding
  const rHex = Math.round(r).toString(16).padStart(2, "0");
  const gHex = Math.round(g).toString(16).padStart(2, "0");
  const bHex = Math.round(b).toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

// Helper function to add texture noise
function addTextureNoise(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      // Only apply to non-transparent pixels
      const noise = (Math.random() - 0.5) * intensity * 255;
      data[i] = Math.max(0, Math.min(255, data[i] + noise)); // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export default function TextOverlay({
  texts,
  color = "#fff",
  fontSize = 150,
  moveDurationMs = 400,
  staggerMs = 150,
  holdDurationMs = 1000,
  targetZ = -120,
  style,
  wordSpacing = 2,
  maxLineWidth = 500,
  lineHeight = 1.2,
  onAllTextsCompleted,
  performanceMode = "auto",
}: TextOverlayProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tier = useMemo(() => (performanceMode === "auto" ? detectTier() : performanceMode), [performanceMode]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Wait for fonts to load before starting
    const initializeRenderer = async () => {
      try {
        // Ensure Mali font is loaded
        await document.fonts.load(`bold 16px "Mali", Arial, Helvetica, sans-serif`);
        // Add a small delay to ensure font rendering is ready
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Font loading failed, using fallback fonts');
      }

      if (!mountRef.current) return;

    // ---- Renderer (adaptive) ----
    const renderer = new THREE.WebGLRenderer({
      antialias: tier === "high", // disable on low
      alpha: true,
      powerPreference: tier === "high" ? "high-performance" : "low-power",
      stencil: false,
      depth: false,
      premultipliedAlpha: true,
    });

    // Dynamic pixel ratio (will auto-scale by fps later)
    const baseDPR = Math.min(window.devicePixelRatio || 1, tier === "high" ? 2 : 1);
    renderer.setPixelRatio(baseDPR);
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.sortObjects = false;

    // Attach canvas
    mountRef.current.appendChild(renderer.domElement);

    // ---- Scene & Camera ----
    const scene = new THREE.Scene();
    scene.background = null;
    scene.matrixAutoUpdate = false;

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 8000);

    const setCameraZ = () => {
      const sw = window.innerWidth;
      let z = 900;
      if (sw < 400) z = 600;
      else if (sw < 650) z = 700;
      else if (sw < 1024) z = 800;
      camera.position.set(0, 0, z);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    setCameraZ();

    const startZ = camera.position.z + 300;

    type WordSprite = THREE.Sprite & {
      wordPixelWidth: number;
      wordPixelHeight: number;
      startPos?: THREE.Vector3;
      targetPos?: THREE.Vector3;
      delay?: number;
      arrivedAt?: number | null;
      __dispose: () => void;
    };

    type Particle = THREE.Sprite & {
      velocity: THREE.Vector3;
      life: number;
      maxLife: number;
      initialScale: number;
      initialOpacity: number;
    };

    // ---- Text cache (big win for low devices) ----
    const cache = new Map<string, { tex: THREE.CanvasTexture; mat: THREE.SpriteMaterial; w: number; h: number }>();

    const makeKey = (word: string, px: number, colorStr: string) => `${word}|${px}|${colorStr}`;

    const createWordSprite = (word: string, colorStr: string, px: number): WordSprite => {
      const sw = window.innerWidth;
      let adjusted = px;
      if (sw < 400) adjusted = Math.max(px * 0.8, 60);
      else if (sw < 650) adjusted = Math.max(px * 0.85, 70);
      if (tier === "low") adjusted = Math.max(adjusted * 0.85, 56);

      const key = makeKey(word, Math.round(adjusted), colorStr);
      let c = cache.get(key);

      if (!c) {
        const padding = 20; // Reduced padding for tighter glow
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: true })!;
        
        // Ensure font is available before measuring
        const fontString = `bold ${adjusted}px "Mali", Arial, Helvetica, sans-serif`;
        ctx.font = fontString;
        
        // Check if Mali font is available, fallback to system fonts if not
        const testText = "M";
        ctx.font = 'bold 20px "Mali"';
        const maliWidth = ctx.measureText(testText).width;
        ctx.font = 'bold 20px Arial';
        const arialWidth = ctx.measureText(testText).width;
        
        // If widths are the same, Mali font is likely not loaded
        const isMaliLoaded = Math.abs(maliWidth - arialWidth) > 0.1;
        
        if (!isMaliLoaded) {
          console.warn('Mali font not fully loaded, text may use fallback font');
        }
        
        // Reset to desired font
        ctx.font = fontString;
        const w = Math.max(1, ctx.measureText(word).width);
        canvas.width = Math.ceil(w + padding * 2);
        canvas.height = Math.ceil(adjusted + padding * 2);
        ctx.font = fontString; // Reapply font after canvas resize
        ctx.textBaseline = "top";

        // Create 3D bevel effect - draw multiple layers with slight offsets
        const bevelLayers = [
          { x: 4, y: 4, color: "rgba(0,0,0,0.6)", blur: 0 }, // Deep shadow
          { x: 3, y: 3, color: "rgba(50,50,50,0.5)", blur: 0 }, // Medium shadow
          { x: 2, y: 2, color: "rgba(100,100,100,0.4)", blur: 0 }, // Light shadow
          { x: 1, y: 1, color: "rgba(150,150,150,0.3)", blur: 0 }, // Highlight shadow
        ];

        // Draw bevel layers first (from back to front)
        bevelLayers.forEach((layer) => {
          ctx.save();
          ctx.fillStyle = layer.color;
          if (layer.blur > 0) {
            ctx.shadowColor = layer.color;
            ctx.shadowBlur = layer.blur;
          }
          ctx.fillText(word, padding + layer.x, padding + layer.y);
          ctx.restore();
        });

        // Create compact glow layers focused around text
        const glowLayers = [
          { blur: 8, color: colorStr, alpha: 0.25 },
          { blur: 5, color: colorStr, alpha: 0.4 },
          { blur: 3, color: colorStr, alpha: 0.6 },
          { blur: 1, color: "#ffffff", alpha: 0.8 },
        ];

        // Draw glow layers
        glowLayers.forEach((layer) => {
          ctx.save();
          ctx.shadowColor = layer.color;
          ctx.shadowBlur = layer.blur;
          ctx.globalAlpha = layer.alpha;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillStyle = "transparent";
          ctx.fillText(word, padding, padding);
          ctx.restore();
        });

        // Create 3D gradient for the main text
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + adjusted);
        try {
          gradient.addColorStop(0, colorStr); // Top color (brighter)
          gradient.addColorStop(0.3, colorStr); // Mid-top
          gradient.addColorStop(0.7, adjustBrightness(colorStr, -30)); // Mid-bottom (darker)
          gradient.addColorStop(1, adjustBrightness(colorStr, -50)); // Bottom color (darkest)
        } catch (error) {
          // Fallback to solid color if gradient fails
          console.warn("Gradient creation failed, using solid color:", error);
          gradient.addColorStop(0, colorStr);
          gradient.addColorStop(1, colorStr);
        }

        // Draw the main text with compact glow
        ctx.save();
        ctx.shadowColor = colorStr;
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = gradient;
        ctx.fillText(word, padding, padding);
        ctx.restore();

        // Add highlight on top edge for 3D effect
        ctx.save();
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = -1;
        try {
          ctx.fillStyle = adjustBrightness(colorStr, 40);
        } catch (error) {
          // Fallback to white highlight if color adjustment fails
          ctx.fillStyle = "#ffffff";
        }
        ctx.globalAlpha = 0.6;
        // Create a clipping path for just the top portion
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, padding, canvas.width, adjusted * 0.3);
        ctx.clip();
        ctx.fillText(word, padding, padding);
        ctx.restore();
        ctx.restore();

        // Add texture noise for more realistic 3D look
        if (tier === "high") {
          addTextureNoise(ctx, canvas.width, canvas.height, 0.1);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.flipY = true;

        // Create a material with enhanced 3D appearance
        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          fog: false,
          blending: THREE.NormalBlending,
          opacity: 0.85,
          // Add slight rotation for 3D effect
          rotation: Math.sin(Date.now() * 0.001) * 0.02,
        });
        c = { tex, mat, w: canvas.width, h: canvas.height };
        cache.set(key, c);
      }

      const sprite = new THREE.Sprite(c.mat) as unknown as WordSprite;

      let scaleDiv = 2.8;
      const sw2 = window.innerWidth;
      if (sw2 < 400) scaleDiv = 2.2;
      else if (sw2 < 650) scaleDiv = 2.4;
      else if (sw2 < 1024) scaleDiv = 2.6;
      if (tier === "low") scaleDiv *= 0.93; // slightly larger scale to keep readability when DPR is lower

      sprite.scale.set(c.w / scaleDiv, c.h / scaleDiv, 1);
      (sprite as any).wordPixelWidth = c.w / scaleDiv;
      (sprite as any).wordPixelHeight = c.h / scaleDiv;
      (sprite as any).__dispose = () => {
        /* shared mats/tex kept in cache */
      };
      return sprite;
    };

    let currentSentenceIndex = 0;
    let wordSprites: WordSprite[] = [];
    let particles: Particle[] = [];
    let hasCompletedAllTexts = false;
    let rafId = 0;
    const clock = new THREE.Clock();
    let phase: "move" | "hold" | "vanish" = "move";
    let phaseTime = 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const textsList = texts && texts.length ? texts : [""];

    // Create particle material (small squares that look like pixels)
    const createParticleMaterial = (): THREE.SpriteMaterial => {
      const canvas = document.createElement("canvas");
      const size = 4;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Convert hex color to RGB values
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 255, g: 255, b: 255 };
      };

      const rgb = hexToRgb(color);

      // Create a small glowing dot with proper rgba format
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`);
      gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      return new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
    };

    const particleMaterial = createParticleMaterial();

    // Create particles from a word sprite
    const createParticlesFromWord = (wordSprite: WordSprite, particleCount: number = 20) => {
      const wordParticles: Particle[] = [];
      const bounds = {
        width: wordSprite.wordPixelWidth,
        height: wordSprite.wordPixelHeight,
      };
      for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Sprite(particleMaterial) as unknown as Particle;
        // Random position within the word bounds
        const offsetX = (Math.random() - 0.5) * bounds.width * 0.8;
        const offsetY = (Math.random() - 0.5) * bounds.height * 0.8;
        particle.position.copy(wordSprite.position);
        particle.position.x += offsetX;
        particle.position.y += offsetY;
        // Random velocity (particles flying away)
        const speed = 30 + Math.random() * 80; // Reduced speed for better visual
        const angle = Math.random() * Math.PI * 2;
        const upwardBias = -0.2; // Slight upward tendency
        particle.velocity = new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed + upwardBias * speed, (Math.random() - 0.5) * 15);
        // Particle properties - start big then shrink
        particle.life = 0;
        particle.maxLife = 300 + Math.random() * 200; // Much shorter: 0.3-0.5 seconds
        particle.initialScale = 3 + Math.random() * 4; // Start bigger (3-7x)
        particle.initialOpacity = 0.9 + Math.random() * 0.1;
        // Start with big scale
        particle.scale.set(particle.initialScale, particle.initialScale, 1);
        particle.material.opacity = particle.initialOpacity;
        scene.add(particle);
        wordParticles.push(particle);
      }

      return wordParticles;
    };

    // Update particles
    const updateParticles = (deltaTime: number) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.life += deltaTime;
        // Increase maxLife by 500ms for slower vanish
        const extendedMaxLife = particle.maxLife + 500;
        const lifeRatio = particle.life / extendedMaxLife;
        if (lifeRatio >= 1) {
          // Remove dead particles
          scene.remove(particle);
          particles.splice(i, 1);
          continue;
        }
        // Update position with velocity
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 0.001));
        // Apply gravity and air resistance
        particle.velocity.y -= 25 * deltaTime * 0.001; // gravity
        particle.velocity.multiplyScalar(0.995); // air resistance
        // Scale animation: start big, shrink over time with different phases
        let scaleMultiplier = 1;
        if (lifeRatio < 0.1) {
          // Initial expansion phase (first 10% of life)
          const expandProgress = lifeRatio / 0.1;
          scaleMultiplier = 0.3 + expandProgress * 0.7; // Start at 30%, grow to 100%
        } else if (lifeRatio < 0.3) {
          // Brief stable phase (10%-30% of life)
          scaleMultiplier = 1.0;
        } else {
          // Shrinking phase (30%-100% of life)
          const shrinkProgress = (lifeRatio - 0.3) / 0.7;
          const easeInQuart = (t: number) => t * t * t * t; // Smooth shrinking
          scaleMultiplier = 1.0 - easeInQuart(shrinkProgress) * 0.95; // Shrink to 5% of original
        }
        const currentScale = particle.initialScale * Math.max(0.05, scaleMultiplier);
        particle.scale.set(currentScale, currentScale, 1);
        // Opacity animation: fade out more gradually
        let opacityMultiplier = 1;
        if (lifeRatio > 0.4) {
          // Start fading after 40% of life
          const fadeProgress = (lifeRatio - 0.4) / 0.6;
          const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t); // Smooth fade
          opacityMultiplier = 1 - easeOutQuad(fadeProgress);
        }
        particle.material.opacity = particle.initialOpacity * Math.max(0, opacityMultiplier);
        particle.updateMatrix();
      }
    };

    const buildSentence = (sentence: string) => {
      for (const s of wordSprites) scene.remove(s);
      wordSprites = [];

      const words = sentence.trim().split(/\s+/).filter(Boolean);
      const tmpSprites = words.map((w) => createWordSprite(w, color, fontSize));

      // responsive max line width
      const sw = window.innerWidth;
      let adjustedMaxLineWidth = maxLineWidth;
      if (sw < 400) adjustedMaxLineWidth = Math.min(maxLineWidth * 0.8, sw * 0.8);
      else if (sw < 650) adjustedMaxLineWidth = Math.min(maxLineWidth * 0.85, sw * 0.85);
      else if (sw < 1024) adjustedMaxLineWidth = Math.min(maxLineWidth * 0.9, sw * 0.9);
      if (tier === "low") adjustedMaxLineWidth *= 0.95;

      let lines: WordSprite[][] = [[]];
      let currentWidth = 0;
      tmpSprites.forEach((s) => {
        const w = s.wordPixelWidth;
        const extra = lines[lines.length - 1].length > 0 ? wordSpacing : 0;
        if (currentWidth + w + extra > adjustedMaxLineWidth) {
          lines.push([]);
          currentWidth = 0;
        }
        lines[lines.length - 1].push(s);
        currentWidth += w + wordSpacing;
      });

      const totalHeight = lines.reduce((h, line) => h + (line[0]?.wordPixelHeight || 0) * lineHeight, 0);
      let cursorY = totalHeight / 2;

      let delayCounter = 0;
      lines.forEach((line) => {
        const totalWidth = line.reduce((sum, s) => sum + s.wordPixelWidth, 0);
        const spacing = wordSpacing;
        const totalSpacing = spacing * Math.max(0, line.length - 1);
        const lineWidth = totalWidth + totalSpacing;
        let cursorX = -lineWidth / 2;
        line.forEach((s) => {
          const w = s.wordPixelWidth;
          const targetX = cursorX + w / 2;
          const targetY = cursorY - (s.wordPixelHeight * lineHeight) / 2;
          cursorX += w + spacing;
          s.position.set(targetX, targetY, startZ);
          s.startPos = new THREE.Vector3(targetX, targetY, startZ);
          s.targetPos = new THREE.Vector3(targetX, targetY, targetZ);
          s.delay = delayCounter * staggerMs;
          delayCounter++;
          s.arrivedAt = null;
          s.visible = false;
          s.updateMatrix();
          scene.add(s);
        });
        cursorY -= (line[0]?.wordPixelHeight || 0) * lineHeight;
      });

      wordSprites = tmpSprites;
      phase = "move";
      phaseTime = 0;
    };

    buildSentence(textsList[currentSentenceIndex]);

    const proceedToNextSentence = () => {
      const nextIndex = currentSentenceIndex + 1;
      if (nextIndex >= textsList.length && !hasCompletedAllTexts) {
        hasCompletedAllTexts = true;
        onAllTextsCompleted?.();
        return;
      }
      if (nextIndex < textsList.length) {
        currentSentenceIndex = nextIndex;
        buildSentence(textsList[currentSentenceIndex]);
      }
    };

    // ---- Dynamic Resolution Scaling (DRS) & 30fps cap on low ----
    const fps = new FPS();
    let dpr = baseDPR;
    let frameSkip = tier === "low" ? 1 : 0; // render every other frame on low (≈30fps)
    let skip = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // simple frame skip for low tier
      if (frameSkip && (skip = 1 - skip)) {
        return; // skip this frame's work
      }

      const dt = clock.getDelta() * 1000; // ms
      phaseTime += dt;

      let needsRender = false;

      if (phase === "move") {
        let allArrived = true;
        for (let i = 0; i < wordSprites.length; i++) {
          const s = wordSprites[i];
          const d = Math.max(0, phaseTime - (s.delay || 0));
          const t = Math.min(1, d / moveDurationMs);
          if (d <= 0) {
            if (s.visible) s.visible = false;
            allArrived = false;
            continue;
          } else if (!s.visible) s.visible = true;

          const k = easeOutCubic(t);
          s.position!.lerpVectors(s.startPos!, s.targetPos!, k);
          s.updateMatrix();
          needsRender = true;

          if (t < 1) allArrived = false;
          else if (s.arrivedAt == null) s.arrivedAt = phaseTime;
        }
        if (allArrived) {
          phase = "hold";
          phaseTime = 0;
          needsRender = true;
        }
      } else if (phase === "hold") {
        // During hold: render only first frame and then every ~10th frame on low tier
        if (phaseTime === dt) needsRender = true; // first tick of hold
        else if (tier === "low" && Math.floor(phaseTime / 100) % 10 === 0) needsRender = true;
        if (phaseTime >= holdDurationMs) {
          phase = "vanish";
          phaseTime = 0;

          // Create particles from each word immediately without stagger
          for (let i = 0; i < wordSprites.length; i++) {
            const s = wordSprites[i];

            // Create particles immediately
            const particleCount = tier === "high" ? 25 : 15; // Adjust based on performance
            const wordParticles = createParticlesFromWord(s, particleCount);
            particles.push(...wordParticles);

            // Hide the original word immediately after particles are created
            s.visible = false;
          }

          needsRender = true;
        }
      } else if (phase === "vanish") {
        // Update particles
        updateParticles(dt);

        // Check if any word sprites are still visible
        const visibleSprites = wordSprites.filter((s) => s.visible);

        // Render if we have particles or visible sprites
        if (particles.length > 0 || visibleSprites.length > 0) {
          needsRender = true;
        }

        // Proceed to next sentence after 200ms delay once particles are gone
        if (particles.length === 0 && visibleSprites.length === 0 && phaseTime >= 200) {
          proceedToNextSentence();
          needsRender = true;
        }
      }

      if (needsRender) renderer.render(scene, camera);

      // measure & adapt DPR every ~0.5s
      fps.tick();
      if ((performance.now() | 0) % 500 < 17) {
        if (fps.fps < 28 && dpr > 0.6) {
          dpr = Math.max(0.6, dpr - 0.1);
          renderer.setPixelRatio(dpr);
          renderer.setSize(mountRef.current!.clientWidth ?? 1, mountRef.current!.clientHeight ?? 1, false);
        } else if (fps.fps > 55 && dpr < baseDPR) {
          dpr = Math.min(baseDPR, dpr + 0.1);
          renderer.setPixelRatio(dpr);
          renderer.setSize(mountRef.current!.clientWidth ?? 1, mountRef.current!.clientHeight ?? 1, false);
        }
      }
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = (clientWidth ?? 1) / (clientHeight ?? 1);
      setCameraZ();
      renderer.setSize(clientWidth ?? 1, clientHeight ?? 1, false);
      // Rebuild to respect responsive metrics
      buildSentence(textsList[currentSentenceIndex]);
      renderer.render(scene, camera);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      // Clean up word sprites
      for (const s of wordSprites) scene.remove(s);
      // Clean up particles
      for (const p of particles) scene.remove(p);
      particles.length = 0;
      // Dispose particle material
      particleMaterial.dispose();
      if (particleMaterial.map) particleMaterial.map.dispose();
      // keep cache for reuse across unmount/mount? We'll dispose here to be safe
      cache.forEach(({ tex, mat }) => {
        tex.dispose();
        mat.dispose();
      });
      cache.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        (renderer.domElement.parentNode as HTMLElement).removeChild(renderer.domElement);
      }
    };
    };

    initializeRenderer();
  }, []);

  return <div ref={mountRef} className={styles.textGlow} style={{ ...layerStyle, ...style }} />;
}

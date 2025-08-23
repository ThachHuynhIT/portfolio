import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Fullscreen container styles
const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100vh",
  background: "#f0f0f0",
};

/**
 * TextScene — words fly in sequentially (space-delimited),
 * start from BEHIND the camera (invisible) and fly forward to form the sentence.
 * Hold for 1s, vanish, then proceed to the next sentence.
 *
 * Hearts outline at the target position (big heart) is composed of many tiny hearts (sprites).
 * Each tiny heart pulses in opacity; tails are static rods placed BEHIND the hearts (farther from camera).
 *
 * New (per user):
 * - Tiny & big hearts have the TIP pointing DOWN.
 * - Camera is FIXED (no OrbitControls).
 * - Rods are LONGER with slight randomness, evenly distributed, and provide multiple direction modes.
 */

type RodDirectionMode = "toCamera" | "fromCamera" | "radialOut" | "tangent" | "random";

type TextSceneProps = {
  texts?: string[];
  color?: string; // text color
  fontSize?: number; // text font size (px for Canvas2D)
  moveDurationMs?: number; // time for a word to travel from start to end
  staggerMs?: number; // delay between words
  holdDurationMs?: number; // how long to hold the full sentence
  vanishDurationMs?: number; // gap before next sentence

  // Rod (tail) options
  rodDirectionMode?: RodDirectionMode; // default: 'toCamera'
  rodLengthBase?: number; // base length in world units (depth of the box)
  rodLengthJitter?: number; // +/- random length add
  rodWidth?: number; // box width (thin)
  rodHeight?: number; // box height (thin)

  // Heart sizes/orientation
  bigHeartWidth?: number; // fixed width of the big heart outline in world units (independent of text)
  bigHeartAspect?: number; // scale factor for Y relative to X
  smallHeartSizePx?: number; // fixed pixel size for tiny heart sprites

  // Rod depth animation (only Z changes)
  rodDepthAnimate?: boolean; // move rods toward camera along Z
  rodDepthSpeed?: number; // units per second
  rodDepthMaxAdvance?: number; // max distance a rod can move toward camera before wrapping
};

export default function TextScene({
  texts = ["chúc mừng năm mới", "song hỉ lâm môn"],
  color = "#006699",
  fontSize = 96,
  moveDurationMs = 1000000,
  staggerMs = 500,
  holdDurationMs = 1000,
  vanishDurationMs = 250,
  rodDirectionMode = "toCamera",
  rodLengthBase = 130,
  rodLengthJitter = 40,
  rodWidth = 5,
  rodHeight = 1.6,
  bigHeartWidth = 520,
  bigHeartAspect = 1.1,
  smallHeartSizePx = 48,
  rodDepthAnimate = true,
  rodDepthSpeed = 220, // world units per second
  rodDepthMaxAdvance = 1200, // cap forward travel (allow reaching near the camera)
}: TextSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const textsList = texts && texts.length ? texts : [""];

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Scene ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // === Camera (FIXED) ===
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 8000);
    camera.position.set(0, 0, 900);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // === Positions ===
    const startZ = camera.position.z + 300; // behind camera (not visible)
    const targetZ = -120; // in front of camera

    // === Word sprite type + factory (no external font) ===
    type WordSprite = THREE.Sprite & {
      wordPixelWidth: number;
      startPos?: THREE.Vector3;
      targetPos?: THREE.Vector3;
      delay?: number;
      arrivedAt?: number | null;
      __dispose: () => void;
    };

    const createWordSprite = (word: string): WordSprite => {
      const padding = 24;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
      const w = Math.max(1, ctx.measureText(word).width);
      canvas.width = Math.ceil(w + padding * 2);
      canvas.height = Math.ceil(fontSize + padding * 2);
      ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(word, padding, padding);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material) as unknown as WordSprite;
      const scaleDiv = 2.8;
      sprite.scale.set(canvas.width / scaleDiv, canvas.height / scaleDiv, 1);
      (sprite as any).wordPixelWidth = canvas.width / scaleDiv;
      (sprite as any).__dispose = () => {
        texture.dispose();
        material.dispose();
      };
      return sprite;
    };

    // === HEARTS (tiny sprites) + RODS (static) ===
    type HeartParticle = THREE.Sprite & {
      basePos: THREE.Vector3;
      lifeMs: number;
      tOffset: number;
      rod?: THREE.Mesh; // static box rod
      rodBaseZ?: number; // initial Z of the rod in group space
      rodAdvanceMax?: number; // allowed maximum forward advance toward camera
      tip?: THREE.Sprite; // heart tip at rod head
      tipOffset?: THREE.Vector3; // offset from rod center to head in group space
      paramT?: number; // parameter t on heart curve (0..2pi)
      activated?: boolean; // whether this rod has been triggered by the marker
      rodStartSec?: number; // timeSec when activation happened
      __dispose: () => void;
    };

    let heartGroup: THREE.Group | null = null;
    let heartParticles: HeartParticle[] = [];

    // Heart scale values (for marker path mapping)
    let heartScaleX = 1;
    let heartScaleY = 1;
    const TWO_PI = Math.PI * 2;

    // Moving glow marker that circles the heart CCW
    let markerSprite: (THREE.Sprite & { __dispose?: () => void }) | null = null;
    let markerAngle = 0; // 0..2pi
    let prevMarkerAngle = 0;
    const markerRevsPerSec = 0.08; // 0.08 rps (~12.5s per lap)

    // Create a static rod points in chosen direction
    const createRodMesh = (length: number, width: number, height: number, color = 0xff99bb) => {
      const geom = new THREE.BoxGeometry(width, height, length);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geom, mat);
      (mesh as any).__dispose = () => {
        geom.dispose();
        mat.dispose();
      };
      // Cast via unknown to appease TS structural typing
      return mesh as unknown as THREE.Mesh & { __dispose: () => void };
    };

    // TIP DOWN tiny heart (rotate material 180deg)
    const createHeartSprite = (sizePx = 48, tint = "#ff3366") => {
      const canvas = document.createElement("canvas");
      const s = sizePx * 2;
      canvas.width = canvas.height = s;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(s / 2, s / 2);

      // heart parametric (y positive = top lobe). We'll draw upright then rotate sprite 180°.
      ctx.beginPath();
      const scale = sizePx / 32;
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        if (i === 0) ctx.moveTo(x * scale, y * scale);
        else ctx.lineTo(x * scale, y * scale);
      }
      ctx.closePath();
      ctx.fillStyle = tint;
      ctx.shadowColor = "rgba(255,60,120,0.55)";
      ctx.shadowBlur = 12;
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      // Flip 180° so TIP points DOWN relative to screen
      mat.rotation = Math.PI;
      const sprite = new THREE.Sprite(mat) as HeartParticle;
      sprite.scale.set(s / 2, s / 2, 1);
      (sprite as any).__dispose = () => {
        tex.dispose();
        mat.dispose();
        (sprite.rod as any)?.__dispose?.();
      };
      sprite.basePos = new THREE.Vector3();
      sprite.lifeMs = 1200 + 1 * 600;
      sprite.tOffset = 1 * 1000;
      // sprite.lifeMs = 1200 + Math.random() * 600;
      // sprite.tOffset = Math.random() * 1000;
      return sprite;
    };

    // Build big heart outline with tiny hearts (TIP DOWN) and rods
    const buildHeartOutline = () => {
      // cleanup
      if (heartGroup) {
        scene.remove(heartGroup);
        for (const p of heartParticles) {
          (p.tip as any)?.__dispose?.();
          (p.rod as any)?.__dispose?.();
          p.__dispose();
        }
        heartParticles = [];
        heartGroup = null;
      }

      heartGroup = new THREE.Group();
      heartGroup.position.set(0, 0, targetZ);
      scene.add(heartGroup);

      // Fixed big heart width independent of text length
      const w = bigHeartWidth;
      const baseWidth = 32; // param x span ~[-16..16]
      const scaleX = w / baseWidth;
      const scaleY = (w / baseWidth) * bigHeartAspect;
      heartScaleX = scaleX;
      heartScaleY = scaleY;

      const count = 120; // evenly spaced
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        // BIG heart: map y directly so the bottom tip (negative y) points downward on screen
        const px = hx * scaleX;
        const py = hy * scaleY;

        // Fixed small heart size
        const p = createHeartSprite(smallHeartSizePx);
        p.position.set(px, py, 0);
        p.basePos = new THREE.Vector3(px, py, 0);
        p.paramT = t;
        p.activated = false;
        p.rodStartSec = undefined;

        // ROD (static): length with slight randomness, positioned BEHIND the heart (farther from camera)
        const length = rodLengthBase + (1 * 2 - 1) * rodLengthJitter;
        // const length = rodLengthBase + (Math.random() * 2 - 1) * rodLengthJitter;
        const rod = createRodMesh(length, rodWidth, rodHeight);

        // Direction modes
        // Compute base vectors
        const toCamera = new THREE.Vector3(0, 0, 1); // +Z in group space points toward camera
        const fromCamera = new THREE.Vector3(0, 0, -1);
        const radialOut = new THREE.Vector3(px, py, 0).normalize(); // XY outward
        // Curve tangent approximation via derivative of parametric heart
        const dx_dt = 48 * Math.pow(Math.sin(t), 2) * Math.cos(t);
        const dy_dt = -13 * Math.sin(t) + 10 * Math.sin(2 * t) + 6 * Math.sin(3 * t) + 4 * Math.sin(4 * t);
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

        // Orient rod so its local +Z aligns with chosen dir
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
        rod.quaternion.copy(q);

        // Place the rod so that its NEAR end is at the heart, and it extends BEHIND (away from camera) if toCamera is chosen, or along dir generally.
        // In box geometry, center is at the middle; we offset by half-length along -dir so near tip meets the heart.
        const half = length / 2;
        const rodPos = new THREE.Vector3(px, py, 0).add(dir.clone().multiplyScalar(-half));

        // Ensure rod is BEHIND heart relative to camera (farther from camera):
        // If the dir has a positive Z (toward camera), we shift additional -length to push it behind.
        const dirTowardCamera = dir.z > 0.5; // heuristic
        if (dirTowardCamera) rodPos.add(new THREE.Vector3(0, 0, -length * 0.6));
        // Always push a little back to avoid z-fighting
        rodPos.z -= 40;

        rod.position.copy(rodPos);

        // Store base Z and compute how far we can move toward camera.
        // Allow rods to travel from behind the heart (negative z) through the heart plane (z=0)
        // up to a point near the camera in world space.
        const baseZ = rod.position.z; // local/group space
        const nearMarginLocal = 100; // keep a margin from the camera
        const groupZ = heartGroup!.position.z; // world Z of group
        // Max local Z so that worldZ = groupZ + localZ <= cameraZ - margin
        const allowedLocalMaxByCamera = camera.position.z - nearMarginLocal - groupZ;
        const maxAllowed = Math.max(0, Math.min(rodDepthMaxAdvance, allowedLocalMaxByCamera - baseZ));

        p.rod = rod as any;
        p.rodBaseZ = baseZ;
        p.rodAdvanceMax = maxAllowed;

        // Create a heart tip sprite at the rod head (nearest to camera)
        const localHalf = new THREE.Vector3(0, 0, length / 2);
        const headA = localHalf.clone().applyQuaternion(rod.quaternion);
        const headB = localHalf.clone().multiplyScalar(-1).applyQuaternion(rod.quaternion);
        const worldZ_A = heartGroup!.position.z + rod.position.z + headA.z;
        const worldZ_B = heartGroup!.position.z + rod.position.z + headB.z;
        const tipOffset = worldZ_A >= worldZ_B ? headA : headB;
        const tip = createHeartSprite(Math.max(24, smallHeartSizePx * 0.6));
        tip.position.set(rod.position.x + tipOffset.x, rod.position.y + tipOffset.y, rod.position.z + tipOffset.z);
        p.tip = tip;
        p.tipOffset = tipOffset.clone();

        // Initially hide rods and tips until marker triggers them
        (rod.material as THREE.MeshBasicMaterial).opacity = 0;
        rod.visible = false;
        (tip.material as THREE.SpriteMaterial).opacity = 0;
        tip.visible = false;
        heartGroup!.add(rod);
        heartGroup!.add(tip);
        heartGroup!.add(p);
        heartParticles.push(p);
      }

      // Tests
      console[heartParticles.length === count ? "debug" : "error"](`[TEST] Heart particles count: ${heartParticles.length} (expected ${count})`);
      const rodsOk = heartParticles.every((h) => !!h.rod);
      console[rodsOk ? "debug" : "error"](`[TEST] Rods exist for all hearts: ${rodsOk}`);

      // Create the glow marker once
      if (markerSprite) {
        heartGroup.remove(markerSprite);
        (markerSprite as any)?.__dispose?.();
      }
      const markerCanvas = document.createElement("canvas");
      markerCanvas.width = markerCanvas.height = 128;
      const mctx = markerCanvas.getContext("2d")!;
      const grd = mctx.createRadialGradient(64, 64, 6, 64, 64, 50);
      grd.addColorStop(0, "rgba(255,200,230,1)");
      grd.addColorStop(0.5, "rgba(255,120,180,0.6)");
      grd.addColorStop(1, "rgba(255,120,180,0)");
      mctx.fillStyle = grd;
      mctx.beginPath();
      mctx.arc(64, 64, 56, 0, Math.PI * 2);
      mctx.fill();
      const mtex = new THREE.CanvasTexture(markerCanvas);
      mtex.minFilter = THREE.LinearFilter;
      mtex.magFilter = THREE.LinearFilter;
      const mmat = new THREE.SpriteMaterial({ map: mtex, transparent: true, depthWrite: false });
      const ms = new THREE.Sprite(mmat) as any;
      ms.scale.set(90, 90, 1);
      ms.__dispose = () => {
        mtex.dispose();
        mmat.dispose();
      };
      markerSprite = ms;
      heartGroup.add(markerSprite as THREE.Sprite);
      markerAngle = 0;
      prevMarkerAngle = 0;
    };

    // === Sentence lifecycle ===

    let currentSentenceIndex = 0;
    let wordSprites: WordSprite[] = [];

    let rafId = 0;
    const clock = new THREE.Clock();
    let phase: "move" | "hold" | "vanish" = "move";
    let phaseTime = 0; // ms
    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const eps = 0.6;
    let arrivalTimes: number[] = [];

    const buildSentence = (sentence: string) => {
      for (const s of wordSprites) {
        scene.remove(s);
        s.__dispose?.();
      }
      wordSprites = [];

      const capped = sentence.slice(0, 20); // NOTE: keep current cap unless user asks to remove
      const words = capped.trim().split(/\s+/).filter(Boolean);

      const tmpSprites = words.map(createWordSprite);
      const totalWidth = tmpSprites.reduce((sum, s) => sum + s.wordPixelWidth, 0);
      const spacing = 14;
      const totalSpacing = spacing * Math.max(0, tmpSprites.length - 1);
      const lineWidth = totalWidth + totalSpacing;
      const xStart = -lineWidth / 2;

      let cursorX = xStart;
      tmpSprites.forEach((s, i) => {
        const w = s.wordPixelWidth;
        const targetX = cursorX + w / 2;
        cursorX += w + spacing;
        s.position.set(targetX, 0, startZ);
        s.startPos = new THREE.Vector3(targetX, 0, startZ);
        s.targetPos = new THREE.Vector3(targetX, 0, targetZ);
        s.delay = i * staggerMs;
        s.arrivedAt = null;
        s.visible = false;
        scene.add(s);
      });

      wordSprites = tmpSprites;
      buildHeartOutline();
      phase = "move";
      phaseTime = 0;
      arrivalTimes = new Array(wordSprites.length).fill(NaN);
    };

    buildSentence(textsList[currentSentenceIndex]);

    const proceedToNextSentence = () => {
      currentSentenceIndex = (currentSentenceIndex + 1) % textsList.length;
      buildSentence(textsList[currentSentenceIndex]);
    };

    let rodTimeSec = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta() * 1000; // ms
      phaseTime += dt;
      rodTimeSec += dt / 1000;

      // Tiny hearts pulse only (no rotation, no movement of rods)
      if (heartGroup) {
        for (const p of heartParticles) {
          const t = (phaseTime + p.tOffset) % p.lifeMs;
          const k = t / p.lifeMs; // 0..1
          const opacity = Math.sin(Math.PI * k);
          (p.material as THREE.SpriteMaterial).opacity = opacity;
          // Keep orientation TIP DOWN
          (p.material as THREE.SpriteMaterial).rotation = Math.PI;
        }
      }

      if (phase === "move") {
        let allArrived = true;
        for (let i = 0; i < wordSprites.length; i++) {
          const s = wordSprites[i];
          const d = Math.max(0, phaseTime - (s.delay || 0));
          const t = Math.min(1, d / moveDurationMs);
          if (d <= 0) {
            s.visible = false;
            allArrived = false;
            continue;
          } else {
            s.visible = true;
          }
          const k = easeInOutQuad(t);
          s.position!.lerpVectors(s.startPos!, s.targetPos!, k);
          if (t < 1) allArrived = false;
          else if (s.arrivedAt == null) {
            s.arrivedAt = phaseTime;
            arrivalTimes[i] = s.arrivedAt;
          }
        }
        if (allArrived) {
          phase = "hold";
          phaseTime = 0;
        }
      } else if (phase === "hold") {
        for (const s of wordSprites) {
          s.position.copy(s.targetPos!);
          s.visible = true;
        }
        if (phaseTime >= holdDurationMs) {
          phase = "vanish";
          phaseTime = 0;
          for (const s of wordSprites) s.visible = false;
        }
      } else if (phase === "vanish") {
        if (phaseTime >= vanishDurationMs) {
          proceedToNextSentence();
        }
      }

      // Move the glow marker CCW along the heart and trigger rods
      if (heartGroup && markerSprite) {
        const dAngle = markerRevsPerSec * TWO_PI * (dt / 1000);
        prevMarkerAngle = markerAngle;
        markerAngle = (markerAngle + dAngle) % TWO_PI;

        const hx = 16 * Math.pow(Math.sin(markerAngle), 3);
        const hy = 13 * Math.cos(markerAngle) - 5 * Math.cos(2 * markerAngle) - 2 * Math.cos(3 * markerAngle) - Math.cos(4 * markerAngle);
        const mx = hx * heartScaleX;
        const my = hy * heartScaleY;
        markerSprite.position.set(mx, my, -10);

        for (const p of heartParticles) {
          const r = p.rod as THREE.Mesh | undefined;
          if (p.activated) continue;
          const t = p.paramT ?? 0;
          let passed = false;
          if (markerAngle >= prevMarkerAngle) {
            passed = t > prevMarkerAngle && t <= markerAngle;
          } else {
            // wrap-around: prev -> 2pi and 0 -> markerAngle
            passed = t > prevMarkerAngle || t <= markerAngle;
          }
          if (passed) {
            p.activated = true;
            p.rodStartSec = rodTimeSec;
            // show rod and tip with fade-in
            if (r) {
              r.visible = true;
              const rm = r.material as THREE.MeshBasicMaterial;
              rm.opacity = 0;
            }
            if (p.tip) {
              p.tip.visible = true;
              const tm = p.tip.material as THREE.SpriteMaterial;
              tm.opacity = 0;
            }
          }
        }
      }

      // Animate rods along depth (Z) only; constant speed toward camera and wrap; start when activated
      if (rodDepthAnimate && heartGroup) {
        const elapsedSec = rodTimeSec;
        for (const p of heartParticles) {
          const r = p.rod as THREE.Mesh | undefined;
          const advMax = p.rodAdvanceMax ?? 0;
          if (!r || p.rodBaseZ == null || advMax <= 0) continue;
          const rm = r.material as THREE.MeshBasicMaterial;
          const cycle = advMax;
          const startSec = p.activated ? p.rodStartSec ?? elapsedSec : elapsedSec;
          const dist = p.activated ? ((elapsedSec - startSec + (p.tOffset || 0) / 1000) * rodDepthSpeed) % cycle : 0;
          r.position.z = p.rodBaseZ + dist;
          // fade in after activation
          if (p.activated) {
            rm.opacity = Math.min(1, rm.opacity + dt / 300);
            if (p.tip) {
              const tm = p.tip.material as THREE.SpriteMaterial;
              tm.opacity = Math.min(1, tm.opacity + dt / 300);
            }
          }
          if (p.tip && p.tipOffset) {
            p.tip.position.set(r.position.x + p.tipOffset.x, r.position.y + p.tipOffset.y, r.position.z + p.tipOffset.z);
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", handleResize);

    // Initial tests
    console.debug(`[TEST] Camera fixed at ${camera.position.toArray()}`);
    console.debug(`[TEST] startZ=${startZ} (behind camera), targetZ=${targetZ} (in front)`);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      if (heartGroup) {
        scene.remove(heartGroup);
        for (const p of heartParticles) {
          (p.rod as any)?.__dispose?.();
          p.__dispose();
        }
        heartParticles = [];
        heartGroup = null;
        if (markerSprite) {
          (markerSprite as any)?.__dispose?.();
          markerSprite = null;
        }
      }
      for (const s of wordSprites) {
        scene.remove(s);
        s.__dispose?.();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        (renderer.domElement.parentNode as HTMLElement).removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div style={containerStyle} ref={mountRef}></div>;
}

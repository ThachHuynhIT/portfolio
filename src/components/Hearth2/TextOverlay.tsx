import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export type TextOverlayProps = {
  texts?: string[];
  color?: string;
  fontSize?: number;
  moveDurationMs?: number; // ↓ tốc độ bay nhanh hơn
  staggerMs?: number; // ↓ khoảng thời gian trễ giữa các chữ
  holdDurationMs?: number;
  vanishDurationMs?: number;
  targetZ?: number; // should match HeartRods targetZ for alignment
  style?: React.CSSProperties;

  wordSpacing?: number; // khoảng cách giữa các chữ
  maxLineWidth?: number; // giới hạn chiều rộng để tự xuống hàng
  lineHeight?: number; // khoảng cách giữa các dòng
};

const layerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

export default function TextOverlay({
  texts = [
    "chúc mừng năm mới chúc mừng năm mới chúc mừng năm mới chúc mừng năm mới",
    "song hỉ lâm môn chúc mừng năm mới chúc mừng năm mới chúc mừng năm mới",
    "anh yêu em",
    "anh nhớ em nhiều",
  ],
  color = "#fff",
  fontSize = 150,
  moveDurationMs = 400, // CHANGED: nhanh hơn (từ 600 → 400)
  staggerMs = 150, // CHANGED: xuất hiện nhanh hơn (từ 200 → 150)
  holdDurationMs = 1000,
  vanishDurationMs = 250,
  targetZ = -120,
  style,
  wordSpacing = 2,
  maxLineWidth = 500,
  lineHeight = 1.2,
}: TextOverlayProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 1, 8000);
    camera.position.set(0, 0, 900);
    camera.lookAt(0, 0, 0);

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

    const createWordSprite = (word: string, colorStr: string, px: number): WordSprite => {
      const padding = 16;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.font = `bold ${px}px Arial, Helvetica, sans-serif`;
      const w = Math.max(1, ctx.measureText(word).width);
      canvas.width = Math.ceil(w + padding * 1);
      canvas.height = Math.ceil(px + padding * 1);
      ctx.font = `bold ${px}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = colorStr;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(word, padding, padding);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(material) as unknown as WordSprite;
      const scaleDiv = 2.8;
      sprite.scale.set(canvas.width / scaleDiv, canvas.height / scaleDiv, 1);
      (sprite as any).wordPixelWidth = canvas.width / scaleDiv;
      (sprite as any).wordPixelHeight = canvas.height / scaleDiv;
      (sprite as any).__dispose = () => {
        texture.dispose();
        material.dispose();
      };
      return sprite;
    };

    let currentSentenceIndex = 0;
    let wordSprites: WordSprite[] = [];

    let rafId = 0;
    const clock = new THREE.Clock();
    let phase: "move" | "hold" | "vanish" = "move";
    let phaseTime = 0; // ms
    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    let arrivalTimes: number[] = [];

    const buildSentence = (sentence: string) => {
      for (const s of wordSprites) {
        scene.remove(s);
        s.__dispose?.();
      }
      wordSprites = [];

      const words = sentence.trim().split(/\s+/).filter(Boolean);
      const tmpSprites = words.map((w) => createWordSprite(w, color, fontSize));

      let lines: WordSprite[][] = [[]];
      let currentWidth = 0;

      tmpSprites.forEach((s) => {
        const w = s.wordPixelWidth;
        if (currentWidth + w + (lines[lines.length - 1].length > 0 ? wordSpacing : 0) > maxLineWidth) {
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
          scene.add(s);
        });
        cursorY -= (line[0]?.wordPixelHeight || 0) * lineHeight;
      });

      wordSprites = tmpSprites;
      phase = "move";
      phaseTime = 0;
      arrivalTimes = new Array(wordSprites.length).fill(NaN);
    };

    const textsList = texts && texts.length ? texts : [""];
    buildSentence(textsList[currentSentenceIndex]);

    const proceedToNextSentence = () => {
      currentSentenceIndex = (currentSentenceIndex + 1) % textsList.length;
      buildSentence(textsList[currentSentenceIndex]);
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta() * 1000; // ms
      phaseTime += dt;

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

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      renderer.render(scene, camera);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      for (const s of wordSprites) {
        scene.remove(s);
        s.__dispose?.();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        (renderer.domElement.parentNode as HTMLElement).removeChild(renderer.domElement);
      }
    };
  }, [texts, color, fontSize, moveDurationMs, staggerMs, holdDurationMs, vanishDurationMs, targetZ, wordSpacing, maxLineWidth, lineHeight]);

  return <div ref={mountRef} style={{ ...layerStyle, ...style }} />;
}

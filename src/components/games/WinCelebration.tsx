"use client";

import { useEffect, useRef, useState } from "react";
import { playSound } from "./sound";

const DURATION = 4200;
const COLORS = ["#fbbf24", "#f87171", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#fde68a", "#ffffff"];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  shape: 0 | 1;
}

/**
 * Victory effect shared by every game table: confetti burst + banner when a game just ended.
 * - `playing`: the game is in progress (status !== "ended" and a game exists). The celebration only fires on the
 *   playing -> ended transition seen by this mounted component, so a reconnect / refresh onto an already-ended game
 *   (or a re-render of the same result) never replays it.
 * - `show`: the game has ended.
 * - `won`: I am a winner -> confetti + "Bạn thắng!". Otherwise (loser / spectator) only a small banner with `title`.
 * Pointer-events-none fixed overlay (z-40, below modals), ~4 s then fades. prefers-reduced-motion: banner only.
 */
export function WinCelebration({ show, playing, won, title }: { show: boolean; playing: boolean; won: boolean; title?: string }) {
  const [run, setRun] = useState(0);
  const wasPlaying = useRef(false);
  const wasShow = useRef(false);

  useEffect(() => {
    if (show && !wasShow.current && wasPlaying.current) setRun((r) => r + 1);
    if (playing && !show) wasPlaying.current = true;
    if (!playing && !show) wasPlaying.current = false;
    wasShow.current = show;
  }, [show, playing]);

  if (!run) return null;
  return <Burst key={run} won={won} title={title} />;
}

function Burst({ won, title }: { won: boolean; title?: string }) {
  useEffect(() => playSound(won ? "win" : "lose"), [won]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [alive, setAlive] = useState(true);
  const [fading, setFading] = useState(false);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), DURATION - 700);
    const t2 = setTimeout(() => setAlive(false), DURATION);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!won || reduced || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = (cv.width = window.innerWidth);
    let h = (cv.height = window.innerHeight);
    const onResize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    const pieces: Piece[] = [];
    const burst = (cx: number, cy: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 4 + Math.random() * 9;
        pieces.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 5,
          size: 5 + Math.random() * 6,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          shape: Math.random() < 0.5 ? 0 : 1,
        });
      }
    };
    burst(w * 0.25, h * 0.55, 70);
    burst(w * 0.75, h * 0.55, 70);
    burst(w * 0.5, h * 0.4, 90);
    const later = setTimeout(() => {
      burst(w * 0.35, h * 0.35, 50);
      burst(w * 0.65, h * 0.35, 50);
    }, 700);
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      const fade = t > DURATION - 900 ? Math.max(0, (DURATION - t) / 900) : 1;
      ctx.globalAlpha = fade;
      for (const p of pieces) {
        p.vy += 0.22;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (t < DURATION) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(later);
      window.removeEventListener("resize", onResize);
    };
  }, [won, reduced]);

  if (!alive) return null;
  const text = won ? "🏆 Bạn thắng!" : title;
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-40 overflow-hidden transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      {won && !reduced && <canvas ref={canvas} className="absolute inset-0 h-full w-full" />}
      {text && (
        <div className={`absolute inset-x-0 flex justify-center ${won ? "top-[22%]" : "top-16"}`}>
          <div
            className={
              won
                ? "animate-bounce rounded-2xl border border-amber-300/60 bg-black/70 px-6 py-3 text-3xl font-black text-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.5)] motion-reduce:animate-none"
                : "rounded-full border border-amber-300/30 bg-black/65 px-4 py-1.5 text-sm font-bold text-amber-200"
            }
          >
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

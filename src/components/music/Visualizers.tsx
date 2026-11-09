"use client";

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMusic } from "@/context/MusicContext";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SPECTRUM BARS VISUALIZER (Real-time 36-band Audio Spectrum)
// ─────────────────────────────────────────────────────────────────────────────
export function SpectrumBarsVisualizer() {
  const { isPlaying, audioFrequencyData } = useMusic();
  const reducedMotion = useReducedMotion();

  return (
    <div className="music-spectrum-bars" aria-hidden="true">
      {audioFrequencyData.map((val, i) => {
        // Minimum height 6% so bars look sleek even when low, scaling up to 100%
        const height = isPlaying && !reducedMotion ? Math.max(6, Math.min(100, val)) : 6;

        return (
          <div
            key={i}
            className={cn("music-spectrum-bar bg-portfolio-accretion", isPlaying && !reducedMotion && "music-spectrum-bar--live")}
            style={
              {
                "--idx": i,
                height: `${height}%`,
                opacity: Math.max(0.35, height / 100),
                transition: "height 0.08s ease-out, background 0.15s ease",
              } as React.CSSProperties
            }
          >
            {/* Peak indicator dot */}
            {height > 15 && isPlaying && !reducedMotion && (
              <span
                className="music-bar-peak"
                style={{
                  opacity: Math.min(1, height / 70),
                  background: "var(--portfolio-dust)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WAVE VISUALIZER (Real-time Canvas Waveform responding to Bass & Mids)
// ─────────────────────────────────────────────────────────────────────────────
export function WaveVisualizer() {
  const { isPlaying, audioMetrics } = useMusic();
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playbackRef = useRef({ isPlaying, audioMetrics });
  playbackRef.current = { isPlaying, audioMetrics };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = getComputedStyle(canvas);
    const accretion = colors.getPropertyValue("--portfolio-accretion").trim();
    const dust = colors.getPropertyValue("--portfolio-dust").trim();
    let animId: number | undefined;
    let phase = 0;

    const render = () => {
      if (!reducedMotion) animId = requestAnimationFrame(render);
      const { isPlaying: playing, audioMetrics } = playbackRef.current;
      const isPlaying = playing && !reducedMotion;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const bassAmp = isPlaying ? audioMetrics.bass * 45 + 10 : 3;
      const midAmp = isPlaying ? audioMetrics.mid * 35 + 8 : 2;
      const trebleFreq = isPlaying ? 0.015 + audioMetrics.treble * 0.015 : 0.012;

      phase += isPlaying ? 0.04 + audioMetrics.avgVolume * 0.05 : 0.01;

      // Wave 1: Accretion Primary Wave (Bass-driven)
      ctx.beginPath();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = accretion;

      for (let x = 0; x < width; x += 3) {
        // Sine wave modulated by audio harmonics
        const angle = x * trebleFreq + phase;
        const envelope = Math.sin((x / width) * Math.PI); // Pinches at edges
        const y =
          centerY +
          (Math.sin(angle) * bassAmp + Math.cos(angle * 0.6 + phase) * (midAmp * 0.8)) *
            envelope;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Wave 2: Dust Harmonic Wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = dust;

      for (let x = 0; x < width; x += 4) {
        const angle = x * (trebleFreq * 1.3) - phase * 1.2;
        const envelope = Math.sin((x / width) * Math.PI);
        const y =
          centerY +
          (Math.sin(angle + 1.2) * (midAmp * 1.1) + Math.cos(angle * 0.8) * (bassAmp * 0.4)) *
            envelope;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Wave 3: Background harmonic mesh
      if (isPlaying && audioMetrics.avgVolume > 0.05) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = dust;
        ctx.globalAlpha = Math.min(0.4, audioMetrics.treble * 0.6);

        for (let x = 0; x < width; x += 6) {
          const angle = x * 0.03 + phase * 1.8;
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(angle) * (midAmp * 0.6) * envelope;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    render();
    return () => { if (animId !== undefined) cancelAnimationFrame(animId); };
  }, [reducedMotion]);

  return (
    <div className="music-wave-container" aria-hidden="true">
      <canvas ref={canvasRef} className="music-wave-canvas" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PULSAR VISUALIZER (Real-time Bass Reactive Concentric Rings)
// ─────────────────────────────────────────────────────────────────────────────
export function PulsarVisualizer() {
  const { isPlaying, audioMetrics } = useMusic();
  const reducedMotion = useReducedMotion();

  const bassScale1 = isPlaying && !reducedMotion ? 1 + audioMetrics.bass * 0.45 : 1;
  const bassScale2 = isPlaying && !reducedMotion ? 1 + audioMetrics.bass * 0.75 : 1;
  const bassScale3 = isPlaying && !reducedMotion ? 1 + audioMetrics.bass * 1.1 : 1;

  const glowOpacity = isPlaying && !reducedMotion ? 0.4 + audioMetrics.avgVolume * 0.6 : 0.2;
  const coreScale = isPlaying && !reducedMotion ? 1 + audioMetrics.bass * 0.3 : 1;

  return (
    <div
      className={cn("music-pulsar-wrap", isPlaying && !reducedMotion && "music-pulsar--live")}
      aria-hidden="true"
    >
      {/* Central Reactive Core */}
      <div
        className="music-pulsar-core bg-portfolio-accretion"
        style={{
          transform: `scale(${coreScale})`,
          opacity: glowOpacity,
          transition: "transform 0.08s ease-out, opacity 0.08s ease-out",
        }}
      />

      {/* Ring 1 - Inner Bass Ring */}
      <div
        className="music-pulsar-ring ring-1"
        style={{
          transform: `scale(${bassScale1})`,
          borderColor: "var(--portfolio-accretion)",
          opacity: isPlaying && !reducedMotion ? 0.5 + audioMetrics.bass * 0.5 : 0.5,
          transition: "transform 0.08s ease-out, border-color 0.08s ease-out",
        }}
      />

      {/* Ring 2 - Mid Dust Ring */}
      <div
        className="music-pulsar-ring ring-2"
        style={{
          transform: `scale(${bassScale2})`,
          borderColor: "var(--portfolio-dust)",
          opacity: isPlaying && !reducedMotion ? 0.4 + audioMetrics.mid * 0.5 : 0.4,
          transition: "transform 0.1s ease-out, border-color 0.1s ease-out",
        }}
      />

      {/* Ring 3 - Outer Treble Ring */}
      <div
        className="music-pulsar-ring ring-3"
        style={{
          transform: `scale(${bassScale3})`,
          borderColor: "var(--portfolio-accretion)",
          opacity: isPlaying && !reducedMotion ? 0.3 + audioMetrics.treble * 0.5 : 0.3,
          transition: "transform 0.12s ease-out, border-color 0.12s ease-out",
        }}
      />
    </div>
  );
}

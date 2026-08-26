"use client";

import React, { useEffect, useRef } from "react";
import { useMusic } from "@/context/MusicContext";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SPECTRUM BARS VISUALIZER (Real-time 36-band Audio Spectrum)
// ─────────────────────────────────────────────────────────────────────────────
export function SpectrumBarsVisualizer() {
  const { isPlaying, audioFrequencyData, audioMetrics } = useMusic();

  return (
    <div className="music-spectrum-bars" aria-hidden="true">
      {audioFrequencyData.map((val, i) => {
        // Minimum height 6% so bars look sleek even when low, scaling up to 100%
        const height = isPlaying ? Math.max(6, Math.min(100, val)) : 6;
        const isBassBin = i < 8;
        const isMidBin = i >= 8 && i < 24;

        // Dynamic color hue shift based on frequency index and bass drop
        let barColor = "var(--music-primary)";
        if (isBassBin) {
          barColor = `rgba(168, 85, 247, ${0.7 + audioMetrics.bass * 0.3})`;
        } else if (isMidBin) {
          barColor = `rgba(6, 182, 212, ${0.7 + audioMetrics.mid * 0.3})`;
        } else {
          barColor = `rgba(236, 72, 153, ${0.7 + audioMetrics.treble * 0.3})`;
        }

        return (
          <div
            key={i}
            className={`music-spectrum-bar ${isPlaying ? "music-spectrum-bar--live" : ""}`}
            style={
              {
                "--idx": i,
                height: `${height}%`,
                background:
                  height > 75
                    ? "linear-gradient(to top, #06b6d4, #a855f7 60%, #ec4899)"
                    : height > 40
                    ? "linear-gradient(to top, #8b5cf6, #06b6d4)"
                    : "linear-gradient(to top, rgba(139, 92, 246, 0.4), #8b5cf6)",
                boxShadow:
                  height > 60
                    ? "0 0 12px rgba(168, 85, 247, 0.6), 0 0 24px rgba(6, 182, 212, 0.4)"
                    : "none",
                transition: "height 0.08s ease-out, background 0.15s ease",
              } as React.CSSProperties
            }
          >
            {/* Peak indicator dot */}
            {height > 15 && isPlaying && (
              <span
                className="music-bar-peak"
                style={{
                  opacity: Math.min(1, height / 70),
                  background: height > 75 ? "#ec4899" : "#38bdf8",
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
// 2. NEON WAVE VISUALIZER (Real-time Canvas Waveform responding to Bass & Mids)
// ─────────────────────────────────────────────────────────────────────────────
export function WaveVisualizer() {
  const { isPlaying, audioMetrics } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      animId = requestAnimationFrame(render);

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

      // Wave 1: Neon Purple / Cyan Primary Wave (Bass-driven)
      ctx.beginPath();
      ctx.lineWidth = 3.5;
      const grad1 = ctx.createLinearGradient(0, 0, width, 0);
      grad1.addColorStop(0, "rgba(168, 85, 247, 0)");
      grad1.addColorStop(0.2, "#a855f7");
      grad1.addColorStop(0.5, "#06b6d4");
      grad1.addColorStop(0.8, "#ec4899");
      grad1.addColorStop(1, "rgba(236, 72, 153, 0)");

      ctx.strokeStyle = grad1;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = isPlaying ? 16 + audioMetrics.bass * 16 : 4;

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

      // Wave 2: Secondary Cyan Harmonic Wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      const grad2 = ctx.createLinearGradient(0, 0, width, 0);
      grad2.addColorStop(0, "rgba(6, 182, 212, 0)");
      grad2.addColorStop(0.3, "rgba(6, 182, 212, 0.8)");
      grad2.addColorStop(0.7, "rgba(168, 85, 247, 0.8)");
      grad2.addColorStop(1, "rgba(168, 85, 247, 0)");

      ctx.strokeStyle = grad2;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = isPlaying ? 10 : 2;

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

      // Wave 3: Background glow mesh
      if (isPlaying && audioMetrics.avgVolume > 0.05) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(236, 72, 153, ${Math.min(0.4, audioMetrics.treble * 0.6)})`;
        ctx.shadowBlur = 0;

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

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, audioMetrics]);

  return (
    <div className="music-wave-container" aria-hidden="true">
      <canvas ref={canvasRef} className="music-wave-canvas" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PULSAR VISUALIZER (Real-time Bass Reactive Glowing Concentric Rings)
// ─────────────────────────────────────────────────────────────────────────────
export function PulsarVisualizer() {
  const { isPlaying, audioMetrics } = useMusic();

  const bassScale1 = isPlaying ? 1 + audioMetrics.bass * 0.45 : 1;
  const bassScale2 = isPlaying ? 1 + audioMetrics.bass * 0.75 : 1;
  const bassScale3 = isPlaying ? 1 + audioMetrics.bass * 1.1 : 1;

  const glowOpacity = isPlaying ? 0.4 + audioMetrics.avgVolume * 0.6 : 0.2;
  const coreScale = isPlaying ? 1 + audioMetrics.bass * 0.3 : 1;

  return (
    <div
      className={`music-pulsar-wrap ${isPlaying ? "music-pulsar--live" : ""}`}
      aria-hidden="true"
    >
      {/* Central Pulsing Core */}
      <div
        className="music-pulsar-core"
        style={{
          transform: `scale(${coreScale})`,
          opacity: glowOpacity,
          boxShadow: `0 0 ${20 + audioMetrics.bass * 40}px rgba(168, 85, 247, ${0.6 + audioMetrics.bass * 0.4}), 0 0 ${40 + audioMetrics.bass * 60}px rgba(6, 182, 212, 0.4)`,
          transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
        }}
      />

      {/* Ring 1 - Inner Bass Ring */}
      <div
        className="music-pulsar-ring ring-1"
        style={{
          transform: `scale(${bassScale1})`,
          borderColor: `rgba(168, 85, 247, ${0.5 + audioMetrics.bass * 0.5})`,
          boxShadow: `0 0 ${15 + audioMetrics.bass * 25}px rgba(168, 85, 247, 0.5)`,
          transition: "transform 0.08s ease-out, border-color 0.08s ease-out",
        }}
      />

      {/* Ring 2 - Mid Cyan Ring */}
      <div
        className="music-pulsar-ring ring-2"
        style={{
          transform: `scale(${bassScale2})`,
          borderColor: `rgba(6, 182, 212, ${0.4 + audioMetrics.mid * 0.5})`,
          boxShadow: `0 0 ${20 + audioMetrics.mid * 30}px rgba(6, 182, 212, 0.4)`,
          transition: "transform 0.1s ease-out, border-color 0.1s ease-out",
        }}
      />

      {/* Ring 3 - Outer Treble / Glow Halo */}
      <div
        className="music-pulsar-ring ring-3"
        style={{
          transform: `scale(${bassScale3})`,
          borderColor: `rgba(236, 72, 153, ${0.3 + audioMetrics.treble * 0.5})`,
          boxShadow: `0 0 ${30 + audioMetrics.bass * 40}px rgba(236, 72, 153, 0.3)`,
          transition: "transform 0.12s ease-out, border-color 0.12s ease-out",
        }}
      />
    </div>
  );
}

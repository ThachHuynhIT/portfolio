"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { EngineStats } from "@/components/3d/blackhole/engine";

const BlackHoleCanvas = dynamic(
  () => import("@/components/3d/blackhole/BlackHoleCanvas"),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Physics HUD — driven by live engine stats (fps/quality/consumed/observer)
// ---------------------------------------------------------------------------
function HudMetrics({ stats }: { stats: EngineStats | null }) {
  const rows: [string, string][] = [
    ["observer", stats ? `${stats.observerR.toFixed(1)} rs` : "—"],
    ["photon sphere", "1.50 rs"],
    ["isco", "3.00 rs"],
    ["disk v max", "0.50 c"],
    ["particles", stats ? stats.particles.toLocaleString() : "—"],
    ["consumed", stats ? stats.consumed.toLocaleString() : "—"],
    ["render", stats ? `${Math.round(stats.fps)} fps · ${stats.quality.toFixed(2)}x` : "—"],
  ];

  return (
    <div className="text-right pointer-events-none" aria-hidden="true">
      <table className="ml-auto border-separate" style={{ borderSpacing: "0 1px" }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td
                className="pr-6 text-right"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.38)",
                }}
              >
                {label}
              </td>
              <td
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sound toggle button
// ---------------------------------------------------------------------------
function SoundToggle() {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      aria-label={on ? "Mute sound" : "Unmute sound"}
      style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "10px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: on ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0",
        transition: "color 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = on ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)"; }}
    >
      ■ {on ? "SOUND ON" : "SOUND OFF"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Hook: hide global nav & footer while mounted, restore on unmount
// ---------------------------------------------------------------------------
function useHideGlobalChrome() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "not-found-hide-chrome";
    style.textContent = `
      /* Hide global nav & footer on 404 page */
      body > * > nav,
      body > * > footer,
      header,
      [data-testid="nav"],
      [data-testid="footer"],
      nav { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function NotFound() {
  useHideGlobalChrome();
  const [stats, setStats] = useState<EngineStats | null>(null);

  return (
    <section
      className="relative overflow-hidden bg-black"
      style={{ width: "100vw", height: "100dvh", position: "fixed", top: 0, left: 0, zIndex: 9999 }}
    >
      {/* ── Fullscreen raymarched black hole ── */}
      <BlackHoleCanvas className="absolute inset-0" onStats={setStats} />

      {/* ── Readability scrim: the lensed disk's bright band drifts through this
          zone as the camera auto-orbits, so the 404 copy/CTA and HUD need a
          floor of contrast independent of where the render happens to be ── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "52%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 100%)",
          zIndex: 5,
        }}
        aria-hidden="true"
      />

      {/* ── Top-left: signal lost badge ── */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{ padding: "clamp(14px, 2.5vw, 28px)", zIndex: 10 }}
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          ■ SIGNAL LOST — HTTP 404
        </span>
      </div>

      {/* ── Top-right: orbit hint + sound toggle ── */}
      <div
        className="absolute top-0 right-0 flex items-center gap-5"
        style={{ padding: "clamp(14px, 2.5vw, 28px)", zIndex: 10 }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          DRAG TO ORBIT · SCROLL TO APPROACH
        </span>
        <SoundToggle />
      </div>

      {/* ── Bottom-left: 404 heading + copy + CTA ── */}
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{ padding: "clamp(20px, 4vw, 52px)", zIndex: 10 }}
      >
        <h1
          aria-label="404"
          style={{
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            fontSize: "clamp(7rem, 16vw, 15rem)",
            fontWeight: 200,
            lineHeight: 1,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            fontSize: "clamp(0.8rem, 1.2vw, 1rem)",
            color: "rgba(255,255,255,0.55)",
            marginTop: "0.5rem",
            maxWidth: "360px",
          }}
        >
          The page you&apos;re looking for fell past the event horizon.
        </p>
        <Link
          href="/"
          className="pointer-events-auto"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            padding: "0.6rem 1.4rem",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "transparent",
            textDecoration: "none",
            transition: "background 0.2s, color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background  = "rgba(255,255,255,1)";
            el.style.color       = "#000000";
            el.style.borderColor = "rgba(255,255,255,1)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background  = "transparent";
            el.style.color       = "rgba(255,255,255,0.85)";
            el.style.borderColor = "rgba(255,255,255,0.25)";
          }}
        >
          ← RETURN HOME
        </Link>
      </div>

      {/* ── Bottom-right: physics HUD ── */}
      <div
        className="absolute bottom-0 right-0"
        style={{ padding: "clamp(20px, 4vw, 52px)", zIndex: 10 }}
      >
        <HudMetrics stats={stats} />
      </div>
    </section>
  );
}

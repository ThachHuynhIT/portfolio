"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
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
    <div className="rounded-lg bg-portfolio-hull border border-portfolio-hairline p-3 text-right pointer-events-none" aria-hidden="true">
      <table className="ml-auto border-separate" style={{ borderSpacing: "0 1px" }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td
                className="pr-6 text-right"
                style={{
                  fontFamily: "inherit",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--portfolio-dust)",
                }}
              >
                {label}
              </td>
              <td
                style={{
                  fontFamily: "inherit",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  color: "var(--portfolio-ink)",
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
      className="min-w-11 min-h-11 focus-visible:outline-2 focus-visible:outline-portfolio-accretion"
      style={{
        fontFamily: "inherit",
        fontSize: "10px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: on ? "var(--portfolio-ink)" : "var(--portfolio-dust)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0",
        transition: "color 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--portfolio-ink)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = on ? "var(--portfolio-ink)" : "var(--portfolio-dust)"; }}
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
    <div
      className="portfolio-theme portfolio-page overflow-hidden bg-portfolio-void"
      data-portfolio-dark="true"
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
        className="absolute top-0 left-0 pointer-events-none max-w-[40%]"
        style={{ padding: "clamp(14px, 2.5vw, 28px)", zIndex: 10 }}
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: "inherit",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--portfolio-dust)",
          }}
        >
          ■ SIGNAL LOST — HTTP 404
        </span>
      </div>

      {/* ── Top-right: orbit hint + sound toggle ── */}
      <div
        className="absolute top-0 right-0 flex flex-wrap justify-end items-center gap-3 max-w-[60%]"
        style={{ padding: "clamp(14px, 2.5vw, 28px)", zIndex: 10 }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: "inherit",
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--portfolio-dust)",
          }}
        >
          DRAG TO ORBIT · SCROLL TO APPROACH
        </span>
        <SoundToggle />
      </div>

      {/* ── Bottom-left: 404 heading + copy + CTA ── */}
      <section
        className="portfolio-section absolute bottom-0 left-0 pointer-events-none max-w-full"
        style={{ padding: "clamp(20px, 4vw, 52px)", zIndex: 10 }}
      >
        <div className="portfolio-column">
          <PageHeader className="[&_h1]:text-portfolio-accretion [&_h1]:text-[clamp(7rem,16vw,15rem)] [&_h1]:font-extralight [&_h1]:leading-none [&_.portfolio-page-intro]:text-portfolio-ink [&_.portfolio-page-intro]:font-medium" title="404" intro={<>The page you&apos;re looking for fell past the event horizon.</>} />
          <Link href="/" className="portfolio-action portfolio-action-primary pointer-events-auto mt-6">← RETURN HOME</Link>
        </div>
      </section>

      {/* ── Bottom-right: physics HUD ── */}
      <div
        className="absolute top-24 sm:top-auto sm:bottom-0 right-0"
        style={{ padding: "clamp(20px, 4vw, 52px)", zIndex: 10 }}
      >
        <HudMetrics stats={stats} />
      </div>
    </div>
  );
}

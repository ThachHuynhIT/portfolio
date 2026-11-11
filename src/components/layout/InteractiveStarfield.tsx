"use client";

import { useEffect, useRef, useState } from "react";
import { COLLAPSE_LIFE, cometPath, cometSpawn, createStars, gravityInfluence, implosionInfluence, infallToRim, parallaxOffset, pointerInfluence, rippleInfluence, stepSpring } from "@/lib/starfield";

/**
 * Canvas starfield behind public pages; not mounted under reduced motion (the
 * static CSS `.portfolio-stars` layer stays instead).
 * - "page": the pointer pushes stars away and links nearby ones into
 *   constellations; clicks send out a ring. Twinkles while visible.
 * - "home": the pointer is a gravity well that pulls stars into a swirl. Every
 *   second a star leaves the cursor (or, with no mouse on the page, the
 *   left/top/bottom edge) and spirals onto the rim of the black
 *   hole (`.portfolio-hero-canvas`); a click on the background makes a
 *   small collapse (a ring shrinks onto the point, nearby stars are pulled in
 *   and let go, then a flash). No twinkle; the frame loop only runs while
 *   something moves.
 */
type Variant = "page" | "home";
const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role='button'], [contenteditable]";
const COMET_LIFE = 2.4;
const COMET_EVERY = 1000;
// The hole's shadow inside `.portfolio-hero-canvas`, as fractions of that box
// (measured against the rendered black hole at 1280, 1920 and 375px wide).
const HOLE = { cx: .515, cy: .37, rx: .17, ry: .19 };

export default function InteractiveStarfield({ variant = "page" }: { variant?: Variant }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return enabled ? <StarCanvas variant={variant} /> : null;
}

function StarCanvas({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Home only: comets are drawn above the black hole frame, so they stay
  // visible as they fall onto the disk.
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const simulation = useRef({
    pointer: { x: 0, y: 0, ex: 0, ey: 0, active: false, last: 0 },
    stars: createStars(1, 1, 71).map(s => ({ ...s, dx: 0, dy: 0, vx: 0, vy: 0 })),
    scroll: 0, easedScroll: 0,
    ripples: [] as { x: number; y: number; time: number }[],
    comets: [] as { x: number; y: number; time: number; rEnd: number; turn: number; trail: { x: number; y: number }[] }[],
    collapses: [] as { x: number; y: number; time: number }[],
  });
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const overlay = overlayRef.current, octx = overlay?.getContext("2d") ?? null;
    const wrapper = canvas.parentElement!;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let width = 1, height = 1, ink = "", accent = "", light = false;
    const state = simulation.current;
    const pointer = state.pointer;
    state.scroll = state.easedScroll = window.scrollY;
    state.ripples = []; state.comets = []; state.collapses = [];
    const home = variant === "home";
    let frame = 0, last = 0, resizeTimer: ReturnType<typeof setTimeout>, cometTimer: ReturnType<typeof setTimeout> | undefined, cometSeed = 1;
    let settled = false;
    const colors = () => {
      const style = getComputedStyle(canvas);
      ink = style.getPropertyValue("--portfolio-ink").trim();
      accent = style.getPropertyValue("--portfolio-accretion").trim();
      light = document.documentElement.dataset.theme === "light" && wrapper.dataset.portfolioDark !== "true";
    };
    const resize = () => {
      width = wrapper.clientWidth; height = wrapper.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (overlay && octx) { overlay.width = width * dpr; overlay.height = height * dpr; octx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      state.stars = createStars(width, height, 71).map(s => ({ ...s, dx: 0, dy: 0, vx: 0, vy: 0 }));
      settled = false; kick();
    };
    const move = (e: PointerEvent) => {
      if (!fine.matches || e.pointerType !== "mouse") return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.last = performance.now(); kick();
    };
    const leave = () => { pointer.active = false; };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target instanceof Element && e.target.closest(home ? INTERACTIVE : "input, textarea, select, [contenteditable]"))) return;
      kick();
      if (home) { state.collapses = [...state.collapses.slice(-2), { x: e.clientX, y: e.clientY, time: performance.now() }]; return; }
      state.ripples = [...state.ripples.slice(-2), { x: e.clientX, y: e.clientY, time: performance.now() }];
    };
    const onScroll = () => { state.scroll = window.scrollY; settled = false; kick(); };
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!home && now - pointer.last > 2500 && settled && !state.ripples.length && now - last < 50) return;
      const dt = Math.min(.05, (now - (last || now - 16)) / 1000); last = now;
      const ease = 1 - Math.exp(-8 * dt);
      const interactive = pointer.active && fine.matches;
      pointer.ex += ((interactive ? pointer.x : width / 2) - pointer.ex) * ease;
      pointer.ey += ((interactive ? pointer.y : height / 2) - pointer.ey) * ease;
      state.easedScroll += (state.scroll - state.easedScroll) * ease;
      settled = Math.abs(state.scroll - state.easedScroll) < .1 && Math.hypot((interactive ? pointer.x : width / 2) - pointer.ex, (interactive ? pointer.y : height / 2) - pointer.ey) < .2;
      ctx.clearRect(0, 0, width, height);
      if (interactive) {
        const halo = ctx.createRadialGradient(pointer.ex, pointer.ey, 0, pointer.ex, pointer.ey, home ? 190 : 220);
        halo.addColorStop(0, accent); halo.addColorStop(1, "transparent");
        ctx.globalAlpha = home ? (light ? .1 : .16) : light ? .08 : .12; ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
      }
      state.ripples = state.ripples.filter(r => now - r.time < 900);
      state.collapses = state.collapses.filter(c => now - c.time < COLLAPSE_LIFE * 1000);
      const nearby: { x: number; y: number; glow: number }[] = [];
      state.stars.forEach((s, i) => {
        const offset = parallaxOffset(s.layer, fine.matches ? pointer.ex / width * 2 - 1 : 0, fine.matches ? pointer.ey / height * 2 - 1 : 0, state.easedScroll);
        const x = ((s.x + offset.dx) % width + width) % width;
        const y = ((s.y + offset.dy) % height + height) % height;
        const gravity = home && interactive ? gravityInfluence(x, y, pointer.ex, pointer.ey) : null;
        const influence = gravity ? { push: gravity.pull, glow: gravity.glow } : interactive ? pointerInfluence(x, y, pointer.ex, pointer.ey) : { push: { x: 0, y: 0 }, glow: 0 };
        let tx = influence.push.x, ty = influence.push.y;
        for (const r of state.ripples) {
          const d = Math.hypot(x - r.x, y - r.y);
          const push = rippleInfluence(x, y, r.x, r.y, (now - r.time) / 1000);
          if (d) { tx += (x - r.x) / d * push; ty += (y - r.y) / d * push; }
        }
        let collapseGlow = 0;
        for (const c of state.collapses) {
          const d = Math.hypot(c.x - x, c.y - y), pull = implosionInfluence(x, y, c.x, c.y, (now - c.time) / 1000);
          if (d && pull) { tx += (c.x - x) / d * pull; ty += (c.y - y) / d * pull; collapseGlow = Math.max(collapseGlow, pull / 30); }
        }
        const sx = stepSpring(s.dx, tx, s.vx, dt), sy = stepSpring(s.dy, ty, s.vy, dt);
        s.dx = sx.value; s.vx = sx.velocity; s.dy = sy.value; s.vy = sy.velocity;
        if (Math.abs(s.dx - tx) + Math.abs(s.dy - ty) + Math.abs(s.vx) + Math.abs(s.vy) > .1) settled = false;
        const base = light ? .08 + s.layer * .03 : s.baseAlpha;
        const twinkle = !home && i % 5 === 0 ? .85 + .15 * Math.sin(now / 1000 * s.twinkleSpeed + s.twinklePhase) : 1;
        const glowAll = Math.min(1, influence.glow + collapseGlow);
        const alpha = Math.min(.95, base * twinkle + glowAll * (light ? .35 : .75));
        ctx.globalAlpha = alpha; ctx.fillStyle = ink;
        ctx.beginPath(); ctx.arc(x + s.dx, y + s.dy, s.radius * (1 + 1.6 * glowAll), 0, Math.PI * 2); ctx.fill();
        if (glowAll > 0) {
          ctx.fillStyle = accent; ctx.globalAlpha = alpha * glowAll; ctx.fill();
          if (!home) nearby.push({ x: x + s.dx, y: y + s.dy, glow: influence.glow });
        }
      });
      ctx.strokeStyle = accent; ctx.lineWidth = .7;
      for (let i = 0; i < nearby.length; i++) for (let j = i + 1; j < nearby.length; j++) {
        const a = nearby[i], b = nearby[j], distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= 110) continue;
        ctx.globalAlpha = (light ? .35 : .5) * Math.min(a.glow, b.glow) * (1 - distance / 110);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // Click ripples: a thin expanding Accretion ring that matches the push wave.
      ctx.lineWidth = 1;
      for (const r of state.ripples) {
        const age = (now - r.time) / 1000;
        ctx.globalAlpha = (light ? .25 : .35) * (1 - age / .9);
        ctx.beginPath(); ctx.arc(r.x, r.y, age * 600, 0, Math.PI * 2); ctx.stroke();
      }
      const fx = octx ?? ctx;
      if (octx) octx.clearRect(0, 0, width, height);
      // Home clicks: a ring shrinks onto the point, then a short flash.
      for (const c of state.collapses) {
        const u = (now - c.time) / 1000 / COLLAPSE_LIFE;
        fx.strokeStyle = accent; fx.lineWidth = 1.2;
        fx.globalAlpha = (light ? .4 : .55) * Math.sin(Math.PI * Math.min(1, u / .8));
        fx.beginPath(); fx.arc(c.x, c.y, 2 + 150 * (1 - Math.min(1, u / .8)) ** 1.6, 0, Math.PI * 2); fx.stroke();
        if (u > .7) {
          const k = (u - .7) / .3, r = 8 + 34 * k, flash = fx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
          flash.addColorStop(0, accent); flash.addColorStop(1, "transparent");
          fx.globalAlpha = (light ? .45 : .6) * (1 - k); fx.fillStyle = flash; fx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
        }
      }
      // Home: automatic comets spiral into the black hole, trailing Accretion.
      if (state.comets.length) {
        const target = document.querySelector(".portfolio-hero-canvas")?.getBoundingClientRect();
        const centre = target ? { x: target.left + target.width * HOLE.cx, y: target.top + target.height * HOLE.cy } : { x: width / 2, y: height / 2 };
        const radii = target ? { rx: target.width * HOLE.rx, ry: target.height * HOLE.ry } : { rx: width * .15, ry: height * .15 };
        state.comets = state.comets.filter(c => now - c.time < COMET_LIFE * 1000);
        fx.lineCap = "round"; fx.strokeStyle = accent;
        for (const c of state.comets) {
          const t = (now - c.time) / 1000 / COMET_LIFE, head = infallToRim(c, centre, radii, t, c.rEnd, c.turn);
          c.trail = [...c.trail.slice(-27), head];
          const fade = t < .85 ? 1 : (1 - t) / .15;
          for (let k = 1; k < c.trail.length; k++) {
            fx.globalAlpha = (light ? .45 : .7) * fade * k / c.trail.length; fx.lineWidth = 3 * k / c.trail.length;
            fx.beginPath(); fx.moveTo(c.trail[k - 1].x, c.trail[k - 1].y); fx.lineTo(c.trail[k].x, c.trail[k].y); fx.stroke();
          }
          const glow = fx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 14);
          glow.addColorStop(0, accent); glow.addColorStop(1, "transparent");
          fx.globalAlpha = fade * (light ? .35 : .5); fx.fillStyle = glow; fx.fillRect(head.x - 14, head.y - 14, 28, 28);
          fx.globalAlpha = fade; fx.fillStyle = light ? accent : ink;
          fx.beginPath(); fx.arc(head.x, head.y, 2.6 * (1 - t * .6), 0, Math.PI * 2); fx.fill();
        }
      }
      ctx.globalAlpha = 1; fx.globalAlpha = 1;
      if (home && settled && !state.comets.length && !state.collapses.length) { cancelAnimationFrame(frame); frame = 0; }
    };
    function kick() {
      if (!frame && !document.hidden) { last = 0; frame = requestAnimationFrame(draw); }
    }
    const visibility = () => {
      cancelAnimationFrame(frame); frame = 0; settled = false; kick();
    };
    // Home: one comet a second from the cursor (edge when there is no mouse
    // on the page); skipped while hidden.
    const scheduleComet = (delay: number) => {
      cometTimer = setTimeout(() => {
        if (!document.hidden) {
          const start = pointer.active && fine.matches ? { x: pointer.x, y: pointer.y } : cometSpawn(cometSeed++, width, height);
          state.comets = [...state.comets.slice(-2), { ...start, ...cometPath(cometSeed++), time: performance.now(), trail: [] }];
          kick();
        }
        scheduleComet(COMET_EVERY);
      }, delay);
    };
    if (home) scheduleComet(COMET_EVERY);
    colors(); resize(); wrapper.dataset.starfield = "live";
    const observer = new MutationObserver(() => { colors(); settled = false; kick(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("blur", leave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      cancelAnimationFrame(frame); clearTimeout(resizeTimer); clearTimeout(cometTimer); observer.disconnect(); delete wrapper.dataset.starfield;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", down);
      document.documentElement.removeEventListener("pointerleave", leave); window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [variant]);
  return <>
    <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    {variant === "home" && <canvas ref={overlayRef} className="absolute inset-0 z-[1] h-full w-full" aria-hidden="true" />}
  </>;
}

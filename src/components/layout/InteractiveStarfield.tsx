"use client";

import { useEffect, useRef, useState } from "react";
import { createStars, parallaxOffset, pointerInfluence, rippleInfluence, stepSpring } from "@/lib/starfield";

export default function InteractiveStarfield() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return enabled ? <StarCanvas /> : null;
}

function StarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const simulation = useRef({
    pointer: { x: 0, y: 0, ex: 0, ey: 0, active: false, last: 0 },
    stars: createStars(1, 1, 71).map(s => ({ ...s, dx: 0, dy: 0, vx: 0, vy: 0 })),
    scroll: 0, easedScroll: 0,
    ripples: [] as { x: number; y: number; time: number }[],
  });
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const wrapper = canvas.parentElement!;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let width = 1, height = 1, ink = "", accent = "", light = false;
    const state = simulation.current;
    const pointer = state.pointer;
    state.scroll = state.easedScroll = window.scrollY;
    state.ripples = [];
    let frame = 0, last = 0, resizeTimer: ReturnType<typeof setTimeout>;
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
      state.stars = createStars(width, height, 71).map(s => ({ ...s, dx: 0, dy: 0, vx: 0, vy: 0 }));
      settled = false;
    };
    const move = (e: PointerEvent) => {
      if (!fine.matches || e.pointerType !== "mouse") return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.last = performance.now();
    };
    const leave = () => { pointer.active = false; };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable]"))) return;
      state.ripples = [...state.ripples.slice(-2), { x: e.clientX, y: e.clientY, time: performance.now() }];
    };
    const onScroll = () => { state.scroll = window.scrollY; settled = false; };
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (now - pointer.last > 2500 && settled && !state.ripples.length && now - last < 50) return;
      const dt = Math.min(.05, (now - (last || now - 16)) / 1000); last = now;
      const ease = 1 - Math.exp(-8 * dt);
      const interactive = pointer.active && fine.matches;
      pointer.ex += ((interactive ? pointer.x : width / 2) - pointer.ex) * ease;
      pointer.ey += ((interactive ? pointer.y : height / 2) - pointer.ey) * ease;
      state.easedScroll += (state.scroll - state.easedScroll) * ease;
      settled = Math.abs(state.scroll - state.easedScroll) < .1 && Math.hypot((interactive ? pointer.x : width / 2) - pointer.ex, (interactive ? pointer.y : height / 2) - pointer.ey) < .2;
      ctx.clearRect(0, 0, width, height);
      if (interactive) {
        const halo = ctx.createRadialGradient(pointer.ex, pointer.ey, 0, pointer.ex, pointer.ey, 220);
        halo.addColorStop(0, accent); halo.addColorStop(1, "transparent");
        ctx.globalAlpha = light ? .08 : .12; ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
      }
      state.ripples = state.ripples.filter(r => now - r.time < 900);
      const nearby: { x: number; y: number; glow: number }[] = [];
      state.stars.forEach((s, i) => {
        const offset = parallaxOffset(s.layer, fine.matches ? pointer.ex / width * 2 - 1 : 0, fine.matches ? pointer.ey / height * 2 - 1 : 0, state.easedScroll);
        const x = ((s.x + offset.dx) % width + width) % width;
        const y = ((s.y + offset.dy) % height + height) % height;
        const influence = interactive ? pointerInfluence(x, y, pointer.ex, pointer.ey) : { push: { x: 0, y: 0 }, glow: 0 };
        let tx = influence.push.x, ty = influence.push.y;
        for (const r of state.ripples) {
          const d = Math.hypot(x - r.x, y - r.y);
          const push = rippleInfluence(x, y, r.x, r.y, (now - r.time) / 1000);
          if (d) { tx += (x - r.x) / d * push; ty += (y - r.y) / d * push; }
        }
        const sx = stepSpring(s.dx, tx, s.vx, dt), sy = stepSpring(s.dy, ty, s.vy, dt);
        s.dx = sx.value; s.vx = sx.velocity; s.dy = sy.value; s.vy = sy.velocity;
        if (Math.abs(s.dx - tx) + Math.abs(s.dy - ty) + Math.abs(s.vx) + Math.abs(s.vy) > .1) settled = false;
        const base = light ? .08 + s.layer * .03 : s.baseAlpha;
        const twinkle = i % 5 === 0 ? .85 + .15 * Math.sin(now / 1000 * s.twinkleSpeed + s.twinklePhase) : 1;
        const alpha = Math.min(.95, base * twinkle + influence.glow * (light ? .35 : .75));
        ctx.globalAlpha = alpha; ctx.fillStyle = ink;
        ctx.beginPath(); ctx.arc(x + s.dx, y + s.dy, s.radius * (1 + 1.6 * influence.glow), 0, Math.PI * 2); ctx.fill();
        if (influence.glow > 0) {
          ctx.fillStyle = accent; ctx.globalAlpha = alpha * influence.glow; ctx.fill();
          nearby.push({ x: x + s.dx, y: y + s.dy, glow: influence.glow });
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
      ctx.globalAlpha = 1;
    };
    const visibility = () => {
      cancelAnimationFrame(frame); last = 0;
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    colors(); resize(); wrapper.dataset.starfield = "live";
    const observer = new MutationObserver(colors);
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
      cancelAnimationFrame(frame); clearTimeout(resizeTimer); observer.disconnect(); delete wrapper.dataset.starfield;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", down);
      document.documentElement.removeEventListener("pointerleave", leave); window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

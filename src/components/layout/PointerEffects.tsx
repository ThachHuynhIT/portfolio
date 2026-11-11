"use client";

import { useEffect } from "react";

export default function PointerEffects() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let active: HTMLElement | null = null, frame = 0;
    let pending: { card: HTMLElement; x: number; y: number } | null = null;
    const removals = new Set<() => void>();
    const reset = () => {
      if (active) {
        for (const key of ["--fx-x", "--fx-y", "--fx-rx", "--fx-ry"]) active.style.removeProperty(key);
        delete active.dataset.fxActive; active = null;
      }
      pending = null;
    };
    const move = (event: PointerEvent) => {
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".portfolio-fx-card") : null;
      if (event.pointerType !== "mouse" || reduced.matches || !fine.matches || !card) { reset(); return; }
      if (active !== card) reset();
      active = card; pending = { card, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const { card, x, y } = pending, rect = card.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (x - rect.left) / (rect.width || 1) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, (y - rect.top) / (rect.height || 1) * 2 - 1));
        card.style.setProperty("--fx-x", `${x - rect.left}px`);
        card.style.setProperty("--fx-y", `${y - rect.top}px`);
        if (!card.hasAttribute("data-fx-no-tilt")) {
          card.style.setProperty("--fx-rx", `${-ny * 5}deg`);
          card.style.setProperty("--fx-ry", `${nx * 5}deg`);
        }
        card.dataset.fxActive = "true";
      });
    };
    const out = (event: PointerEvent) => {
      if (active && (!(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) reset();
    };
    const down = (event: PointerEvent) => {
      if (reduced.matches || event.button !== 0 || !(event.target instanceof Element)) return;
      const host = event.target.closest<HTMLElement>(".portfolio-fx-ripple, .portfolio-action, .portfolio-chip");
      if (!host || host.matches(":disabled, [aria-disabled='true']") || host.closest("[inert], fieldset:disabled")) return;
      const rect = host.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      const size = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2;
      const clip = document.createElement("span"), ripple = document.createElement("span");
      clip.className = "portfolio-ripple-clip"; clip.setAttribute("aria-hidden", "true");
      ripple.className = "portfolio-ripple";
      Object.assign(ripple.style, { width: `${size}px`, height: `${size}px`, left: `${x - size / 2}px`, top: `${y - size / 2}px` });
      clip.append(ripple); host.append(clip);
      const remove = () => { clearTimeout(timer); clip.remove(); removals.delete(remove); };
      const timer = setTimeout(remove, 1000);
      removals.add(remove); ripple.addEventListener("animationend", remove, { once: true });
    };
    const preferences = () => { reset(); if (reduced.matches) for (const remove of removals) remove(); };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("blur", reset);
    reduced.addEventListener("change", preferences); fine.addEventListener("change", preferences);
    return () => {
      cancelAnimationFrame(frame); reset(); for (const remove of removals) remove();
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerout", out);
      document.removeEventListener("pointerdown", down); window.removeEventListener("blur", reset);
      reduced.removeEventListener("change", preferences); fine.removeEventListener("change", preferences);
    };
  }, []);
  return null;
}

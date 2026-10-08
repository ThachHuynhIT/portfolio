"use client";

import { useSyncExternalStore } from "react";

/**
 * Game sound effects, synthesised with the Web Audio API (no audio files, no licences, ~0 KB of assets).
 * Off by default: the player turns it on with the 🔊 button in the games top bar (`SoundToggle`); the choice lives in
 * localStorage["games:sound"]. `playSound(name)` is a no-op while off, with prefers-reduced-motion users untouched
 * (sound is opt-in anyway) and before the browser allows audio (the first click / key press unlocks it).
 */
export type SoundName = "roll" | "buy" | "build" | "coin" | "pay" | "card" | "turn" | "win" | "lose" | "jail" | "click" | "error";

const KEY = "games:sound";
const listeners = new Set<() => void>();
let enabled = false;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    enabled = window.localStorage.getItem(KEY) === "1";
  } catch {
    /* storage blocked: stay off */
  }
}

export const isSoundOn = () => {
  load();
  return enabled;
};

export function setSoundOn(on: boolean) {
  load();
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
  if (on) playSound("click");
}

/** `[on, setOn]` for the toggle button; server render says off. */
export function useSoundOn(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    isSoundOn,
    () => false,
  );
  return [on, setSoundOn];
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

interface Tone {
  f: number;
  /** Seconds from now. */
  at?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  /** Glide to this frequency over the tone. */
  to?: number;
}

function tones(list: Tone[]) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime;
  for (const t of list) {
    const o = c.createOscillator();
    const g = c.createGain();
    const start = t0 + (t.at ?? 0);
    o.type = t.type ?? "sine";
    o.frequency.setValueAtTime(t.f, start);
    if (t.to) o.frequency.exponentialRampToValueAtTime(t.to, start + t.dur);
    const peak = t.gain ?? 0.16;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
    o.connect(g).connect(c.destination);
    o.start(start);
    o.stop(start + t.dur + 0.02);
  }
}

/** A short burst of filtered noise (dice rattle, card flick). */
function noise(opts: { at?: number; dur: number; freq: number; gain?: number; q?: number }) {
  const c = audio();
  if (!c) return;
  const start = c.currentTime + (opts.at ?? 0);
  const len = Math.max(1, Math.floor(c.sampleRate * opts.dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = opts.freq;
  f.Q.value = opts.q ?? 1.2;
  const g = c.createGain();
  g.gain.value = opts.gain ?? 0.35;
  src.connect(f).connect(g).connect(c.destination);
  src.start(start);
}

const EFFECTS: Record<SoundName, () => void> = {
  roll: () => {
    for (let i = 0; i < 7; i++) noise({ at: i * 0.07 + Math.random() * 0.02, dur: 0.05, freq: 1800 + Math.random() * 2200, gain: 0.3 });
    tones([{ f: 180, at: 0.52, dur: 0.12, type: "triangle", gain: 0.12, to: 120 }]);
  },
  buy: () => tones([{ f: 660, dur: 0.1, type: "triangle" }, { f: 880, at: 0.09, dur: 0.12, type: "triangle" }, { f: 1175, at: 0.18, dur: 0.22, type: "triangle", gain: 0.14 }]),
  build: () => {
    noise({ dur: 0.07, freq: 500, gain: 0.5, q: 0.8 });
    tones([{ f: 140, dur: 0.14, type: "square", gain: 0.1, to: 90 }, { f: 520, at: 0.14, dur: 0.1, type: "triangle" }, { f: 780, at: 0.22, dur: 0.18, type: "triangle", gain: 0.13 }]);
  },
  coin: () => tones([{ f: 988, dur: 0.07, type: "square", gain: 0.08 }, { f: 1319, at: 0.07, dur: 0.22, type: "square", gain: 0.08 }]),
  pay: () => tones([{ f: 440, dur: 0.12, type: "sine", gain: 0.14 }, { f: 330, at: 0.1, dur: 0.18, type: "sine", gain: 0.14 }]),
  card: () => noise({ dur: 0.09, freq: 3200, gain: 0.35, q: 0.7 }),
  turn: () => tones([{ f: 784, dur: 0.1, type: "sine", gain: 0.12 }, { f: 1047, at: 0.1, dur: 0.18, type: "sine", gain: 0.12 }]),
  win: () =>
    tones([
      { f: 523, dur: 0.16, type: "triangle", gain: 0.15 },
      { f: 659, at: 0.14, dur: 0.16, type: "triangle", gain: 0.15 },
      { f: 784, at: 0.28, dur: 0.16, type: "triangle", gain: 0.15 },
      { f: 1047, at: 0.42, dur: 0.5, type: "triangle", gain: 0.17 },
      { f: 1319, at: 0.42, dur: 0.5, type: "sine", gain: 0.08 },
    ]),
  lose: () => tones([{ f: 392, dur: 0.2, type: "sine", gain: 0.13 }, { f: 330, at: 0.18, dur: 0.2, type: "sine", gain: 0.13 }, { f: 262, at: 0.36, dur: 0.4, type: "sine", gain: 0.13 }]),
  jail: () => tones([{ f: 220, dur: 0.18, type: "sawtooth", gain: 0.09, to: 110 }, { f: 110, at: 0.2, dur: 0.3, type: "square", gain: 0.08 }]),
  click: () => tones([{ f: 900, dur: 0.04, type: "sine", gain: 0.1 }]),
  error: () => tones([{ f: 200, dur: 0.14, type: "square", gain: 0.07 }]),
};

/** Play a sound effect (no-op while sound is off). */
export function playSound(name: SoundName) {
  if (!isSoundOn()) return;
  try {
    EFFECTS[name]();
  } catch {
    /* audio is decoration — never break the game */
  }
}

"use client";

import { cn } from "@/lib/utils";
import { useSoundOn } from "./sound";

/** 🔊 / 🔇 button for the games top bar (sound is off until the player turns it on). */
export function SoundToggle({ className }: { className?: string }) {
  const [on, setOn] = useSoundOn();
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      title={on ? "Tắt âm thanh" : "Bật âm thanh"}
      aria-label={on ? "Tắt âm thanh" : "Bật âm thanh"}
      aria-pressed={on}
      className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white max-sm:size-9 short:size-9", className)}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {on ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <>
            <path d="m16 9 5 6" />
            <path d="m21 9-5 6" />
          </>
        )}
      </svg>
    </button>
  );
}

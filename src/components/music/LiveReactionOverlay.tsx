"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/context/MusicContext";

export default function LiveReactionOverlay() {
  const { room } = useMusic();
  // Keep a set of seen reaction IDs to schedule their removal
  const removalTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-remove stale reactions from the room state after animation (3.5s + 0.5s buffer)
  useEffect(() => {
    if (!room) return;
    room.reactions.forEach((react) => {
      if (!removalTimersRef.current.has(react.id)) {
        const age = Date.now() - react.createdAt;
        const delay = Math.max(0, 4000 - age);
        const timer = setTimeout(() => {
          removalTimersRef.current.delete(react.id);
        }, delay);
        removalTimersRef.current.set(react.id, timer);
      }
    });
  }, [room?.reactions.length, room]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      removalTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Only render reactions that are less than 4 seconds old
  const visibleReactions = room?.reactions.filter(
    (r) => Date.now() - r.createdAt < 4000
  ) ?? [];

  if (!room || visibleReactions.length === 0) return null;

  return (
    <div className="music-reactions-overlay" aria-hidden="true">
      <AnimatePresence>
        {visibleReactions.map((react) => (
          <motion.div
            key={react.id}
            initial={{
              y: 80,
              opacity: 0,
              scale: 0.5,
              x: `${react.x}vw`,
            }}
            animate={{
              y: -500,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.4, 1.2, 0.9],
              x: [
                `${react.x}vw`,
                `${react.x + (Math.sin(react.createdAt) * 6)}vw`,
                `${react.x - (Math.cos(react.createdAt) * 8)}vw`,
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3.5,
              ease: "easeOut",
            }}
            className="music-floating-reaction"
          >
            <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]">
              {react.emoji}
            </span>
            <span className="text-[10px] text-white/80 font-bold bg-black/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10 mt-1 block">
              {react.sender}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

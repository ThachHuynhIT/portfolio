"use client";

import { motion, AnimatePresence } from "framer-motion";

interface HeartBurstProps {
  active: boolean;
}

const HEARTS = [
  { dx: -16, delay: 0 },
  { dx: -2, delay: 0.08 },
  { dx: 14, delay: 0.16 },
  { dx: -8, delay: 0.24 },
  { dx: 8, delay: 0.3 },
];

/**
 * Transient burst of hearts shown above the mascot's head when petted.
 * Plain text glyphs — no external art assets, consistent with the rest
 * of the mascot.
 */
export default function HeartBurst({ active }: HeartBurstProps) {
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-x-0 top-0 pointer-events-none">
          {HEARTS.map((heart, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-0 text-base text-pink-500"
              initial={{ opacity: 0, x: heart.dx, y: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], y: -36, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: heart.delay, ease: "easeOut" }}
            >
              ❤
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

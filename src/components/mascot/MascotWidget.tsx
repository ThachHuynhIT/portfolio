"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SceneContainer, { usePrefersReducedMotion } from "@/components/3d/SceneContainer";
import MascotCharacter from "@/components/3d/MascotCharacter";
import Icon from "@/components/ui/Icon";
import { EXCLUDED_ROUTE_PREFIXES } from "@/lib/constants";

// px distance from the widget's center at which the cursor-follow effect
// reaches its full [-1, 1] range.
const POINTER_RANGE_PX = 500;

export default function MascotWidget() {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Skip on touch devices: there's no persistent hover position to follow.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      pointerRef.current.x = Math.max(-1, Math.min(1, (event.clientX - centerX) / POINTER_RANGE_PX));
      pointerRef.current.y = Math.max(-1, Math.min(1, (event.clientY - centerY) / POINTER_RANGE_PX));
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const isExcludedRoute = EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  if (isExcludedRoute || isDismissed || prefersReducedMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ x: -50, opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: -50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-full overflow-hidden">
          <SceneContainer fill={false}>
            <MascotCharacter pointerRef={pointerRef} />
          </SceneContainer>

          <button
            onClick={() => setIsDismissed(true)}
            className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/70 light:bg-white/90 border border-white/15 light:border-neutral-900/15 text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 flex items-center justify-center transition-colors"
            title="Hide mascot"
          >
            <Icon name="close" size={11} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

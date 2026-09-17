"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SceneContainer, { usePrefersReducedMotion } from "@/components/3d/SceneContainer";
import MascotCharacter from "@/components/3d/MascotCharacter";
import Icon from "@/components/ui/Icon";
import { EXCLUDED_ROUTE_PREFIXES } from "@/lib/constants";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";

export default function MascotWidget() {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const performanceTier = usePerformanceTier();
  const [isDismissed, setIsDismissed] = useState(false);

  const isExcludedRoute = EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  if (isExcludedRoute || isDismissed || prefersReducedMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -50, opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: -50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden">
          <SceneContainer fill={false}>
            <MascotCharacter performanceTier={performanceTier} />
          </SceneContainer>

          <button
            onClick={() => setIsDismissed(true)}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 light:bg-white/90 border border-white/15 light:border-neutral-900/15 text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 flex items-center justify-center transition-colors"
            title="Hide mascot"
          >
            <Icon name="close" size={11} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";
import { progressiveSection } from "@/lib/animations";

interface AnimatedSectionProps {
  progressive?: boolean;
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  once?: boolean;
}

const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Animated section component that triggers animation when entering viewport
 */
export default function AnimatedSection({
  children,
  className = "",
  variants = defaultVariants,
  delay = 0,
  once = true,
  progressive = false,
}: AnimatedSectionProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once,
    margin: "-100px 0px",
  });

  return (
    <motion.div
      ref={ref}
      initial={progressive ? false : "hidden"}
      animate={progressive ? undefined : isInView ? "visible" : "hidden"}
      whileInView={progressive && !reducedMotion ? "visible" : undefined}
      viewport={progressive ? { once } : undefined}
      variants={progressive ? progressiveSection : variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

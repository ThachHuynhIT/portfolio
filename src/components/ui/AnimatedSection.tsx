"use client";

import { motion, useInView, useReducedMotion, Variants } from "framer-motion";
import { Children, useRef, ReactNode } from "react";
import { progressiveSection, staggerContainer, warpIn } from "@/lib/animations";

interface AnimatedSectionProps {
  progressive?: boolean;
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  once?: boolean;
  container?: boolean;
}

const defaultVariants = warpIn;

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
  container = false,
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
      initial={reducedMotion || progressive ? false : "hidden"}
      animate={reducedMotion ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, clipPath: "inset(0)" } : progressive ? undefined : isInView ? "visible" : "hidden"}
      whileInView={progressive && !reducedMotion ? "visible" : undefined}
      viewport={progressive ? { once } : undefined}
      variants={reducedMotion ? undefined : container ? staggerContainer : progressive ? progressiveSection : variants}
      transition={{ delay }}
      className={`portfolio-entrance ${className}`}
    >
      {container ? Children.map(children, (child) => <motion.div variants={reducedMotion ? undefined : warpIn}>{child}</motion.div>) : children}
    </motion.div>
  );
}

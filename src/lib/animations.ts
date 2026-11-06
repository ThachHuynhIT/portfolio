import { Variants } from "framer-motion";

export const navUnderlineTransition = { type: "spring" as const, stiffness: 400, damping: 30 };

// Only decorative geometry is hidden; headings and other text stay in SSR.
export const starIgnition: Variants = {
  rest: { opacity: 1, scale: 1 },
  visible: { opacity: [1, 0.5, 1], scale: [1, 1.6, 1], transition: { duration: 0.55 } },
};
export const orbitArc: Variants = {
  rest: { strokeDashoffset: 1 },
  visible: { strokeDashoffset: 0, transition: { duration: 0.7, delay: 0.1 } },
};
export const progressiveSection: Variants = {
  visible: { opacity: 1, y: [8, 0], transition: { duration: 0.4 } },
};

/**
 * Fade in from bottom animation variant
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
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
 * Fade in from left animation variant
 */
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Fade in from right animation variant
 */
export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Scale up animation variant
 */
export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Stagger container for child animations
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Blur fade in animation variant
 */
export const blurFadeIn: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Float animation for 3D elements
 */
export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

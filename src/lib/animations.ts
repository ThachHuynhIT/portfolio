import { Variants } from "framer-motion";

export const navUnderlineTransition = { type: "spring" as const, stiffness: 400, damping: 30 };

export const warpIn: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
export const orbitIn: Variants = {
  hidden: { opacity: 0, x: -24, y: 12, rotate: -3 },
  visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
export const clipReveal: Variants = {
  hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  visible: { opacity: 1, clipPath: "inset(0 0 0% 0)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
export const headingRise: Variants = {
  // Horizontal settling suggests tracking without animating text layout.
  visible: { opacity: [0.5, 1], y: [10, 0], scaleX: [1.025, 1], transition: { duration: 0.5, delay: 0.12 } },
};
export const headingUnderline: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: [0, 1], transition: { duration: 0.6, delay: 0.2 } },
};

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
  visible: { opacity: [0.5, 1], y: [32, 0], scale: [0.97, 1], transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Fade in from bottom animation variant
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
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
export const factsStagger: Variants = { visible: { transition: { staggerChildren: 0.06 } } };
export const shootingStarRow: Variants = { visible: { x: [-20, 0], opacity: [0.6, 1], transition: { duration: 0.45 } } };
export const factsOrbit: Variants = {
  visible: { x: [-24, 0], y: [12, 0], rotate: [-3, 0], opacity: [0.6, 1], transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
export const constellationDraw: Variants = {
  visible: { strokeDashoffset: [1, 0], transition: { duration: 0.7 } },
};

"use client";

import { useEffect, useRef, ReactNode, PointerEvent, KeyboardEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  onClick?: () => void;
}

/**
 * 3D tilt effect card component
 */
export default function TiltCard({
  children,
  className = "",
  maxTilt = 10,
  onClick,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Motion values instead of React state: mousemove updates these directly
  // without going through React's render cycle.
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const updateShine = () => {
      if (!shineRef.current) return;
      const x = springRotateY.get();
      const y = springRotateX.get();
      shineRef.current.style.background = `radial-gradient(circle at ${50 + x * 5}% ${50 - y * 5}%, rgba(139, 92, 246, 0.15), transparent 50%)`;
    };
    const unsubX = springRotateX.on("change", updateShine);
    const unsubY = springRotateY.on("change", updateShine);
    return () => {
      unsubX();
      unsubY();
    };
  }, [springRotateX, springRotateY]);

  // Mouse/pen only: on touch, a tap would leave the card stuck mid-tilt.
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.pointerType === "touch" || prefersReducedMotion) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    rotateY.set(((e.clientX - centerX) / (rect.width / 2)) * maxTilt);
    rotateX.set(-((e.clientY - centerY) / (rect.height / 2)) * maxTilt);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000 }}
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "light:border-neutral-900/10 light:bg-neutral-900/[0.04]",
        "group/tilt overflow-hidden",
        onClick && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
        className
      )}
    >
      {/* Shine effect */}
      <div
        ref={shineRef}
        className="absolute inset-0 opacity-0 [@media(hover:hover)]:group-hover/tilt:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 50%)",
        }}
      />

      {/* Content */}
      {children}
    </motion.div>
  );
}

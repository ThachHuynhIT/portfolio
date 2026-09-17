"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue } from "framer-motion";
import MascotCat, { CatPose } from "@/components/mascot/MascotCat";
import HeartBurst from "@/components/mascot/HeartBurst";
import Icon from "@/components/ui/Icon";
import { EXCLUDED_ROUTE_PREFIXES } from "@/lib/constants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const CHASE_SPEED_PX_PER_SEC = 260;
const EDGE_MARGIN = 8;
const IDLE_TO_WASH_MS = 4000;
const WASH_TO_SLEEP_MS = 12000;
const PET_DURATION_MS = 1500;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function MascotWidget() {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDismissed, setIsDismissed] = useState(false);

  const catSize = useRef({ width: 84, height: 50 }).current;
  const stopDistance = catSize.width * 0.7;

  const initial = useRef({
    x: 24,
    y: typeof window !== "undefined" ? window.innerHeight - catSize.height - 32 : 400,
  }).current;

  const posX = useMotionValue(initial.x);
  const posY = useMotionValue(initial.y);

  const [pose, setPose] = useState<CatPose>("sit");
  const [facingRight, setFacingRight] = useState(true);
  const [isPetted, setIsPetted] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const poseRef = useRef(pose);
  const idleElapsedRef = useRef(0);
  const mouseRef = useRef({
    x: initial.x + catSize.width / 2,
    y: initial.y + catSize.height / 2,
  });
  const petTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  poseRef.current = pose;

  const isExcludedRoute = EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const isActive = !isExcludedRoute && !isDismissed && !prefersReducedMotion;

  // Track the live cursor position. Read only inside the animation loop
  // below — never drives React state, per the perf rule for 60fps-scale
  // updates.
  useEffect(() => {
    if (!isActive) return;
    function handlePointerMove(event: PointerEvent) {
      mouseRef.current = { x: event.clientX, y: event.clientY };
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isActive]);

  // Continuous chase + idle timeline, ported from the classic oneko/neko
  // cursor-chasing cat: walk toward the cursor while it's far away, and
  // the longer it stays close/still, sit -> wash -> fall asleep. Moving
  // the cursor away again immediately resumes the chase.
  useEffect(() => {
    if (!isActive) return;
    let rafId: number;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const catX = posX.get();
      const catY = posY.get();
      const targetX = mouseRef.current.x - catSize.width / 2;
      const targetY = mouseRef.current.y - catSize.height / 2;
      const dx = targetX - catX;
      const dy = targetY - catY;
      const distance = Math.hypot(dx, dy);

      if (distance > stopDistance) {
        idleElapsedRef.current = 0;
        if (poseRef.current !== "chase") setPose("chase");

        const ratio = Math.min((CHASE_SPEED_PX_PER_SEC * dt) / distance, 1);
        const nextX = clamp(
          catX + dx * ratio,
          EDGE_MARGIN,
          window.innerWidth - catSize.width - EDGE_MARGIN
        );
        const nextY = clamp(
          catY + dy * ratio,
          EDGE_MARGIN,
          window.innerHeight - catSize.height - EDGE_MARGIN
        );
        posX.set(nextX);
        posY.set(nextY);
        if (Math.abs(dx) > 2) setFacingRight(dx > 0);
      } else {
        idleElapsedRef.current += dt * 1000;
        if (idleElapsedRef.current > WASH_TO_SLEEP_MS) {
          if (poseRef.current !== "sleep") setPose("sleep");
        } else if (idleElapsedRef.current > IDLE_TO_WASH_MS) {
          if (poseRef.current !== "wash") setPose("wash");
        } else if (poseRef.current !== "sit") {
          setPose("sit");
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isActive, catSize.width, catSize.height, stopDistance, posX, posY]);

  // Click the cat to pet it (shows a heart burst above its head). Clicks
  // elsewhere do nothing now that the cat follows the cursor on its own.
  useEffect(() => {
    if (!isActive) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (dismissRef.current?.contains(target)) return;
      if (catRef.current?.contains(target)) {
        if (petTimeoutRef.current) clearTimeout(petTimeoutRef.current);
        setIsPetted(true);
        petTimeoutRef.current = setTimeout(() => setIsPetted(false), PET_DURATION_MS);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isActive]);

  // Keep the cat on-screen if the window is resized.
  useEffect(() => {
    if (!isActive) return;
    function handleResize() {
      posX.set(clamp(posX.get(), EDGE_MARGIN, window.innerWidth - catSize.width - EDGE_MARGIN));
      posY.set(clamp(posY.get(), EDGE_MARGIN, window.innerHeight - catSize.height - EDGE_MARGIN));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, catSize.width, catSize.height, posX, posY]);

  useEffect(() => {
    return () => {
      if (petTimeoutRef.current) clearTimeout(petTimeoutRef.current);
    };
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <>
      <motion.div
        ref={catRef}
        className="fixed top-0 left-0 z-50 cursor-pointer"
        style={{ width: catSize.width, height: catSize.height, x: posX, y: posY }}
      >
        <MascotCat pose={pose} facingRight={facingRight} />
        <HeartBurst active={isPetted} />
      </motion.div>

      <button
        ref={dismissRef}
        onClick={() => setIsDismissed(true)}
        className="fixed bottom-4 left-4 z-[60] w-6 h-6 rounded-full bg-black/70 light:bg-white/90 border border-white/15 light:border-neutral-900/15 text-white/70 light:text-neutral-600 hover:text-white light:hover:text-neutral-900 flex items-center justify-center transition-colors"
        title="Hide mascot"
      >
        <Icon name="close" size={11} />
      </button>
    </>
  );
}

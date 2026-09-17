"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import MascotCat, { CatPose } from "@/components/mascot/MascotCat";
import HeartBurst from "@/components/mascot/HeartBurst";
import Icon from "@/components/ui/Icon";
import { EXCLUDED_ROUTE_PREFIXES } from "@/lib/constants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const IDLE_POSES: CatPose[] = ["sit", "lie", "groom"];
const MIN_IDLE_MS = 4000;
const MAX_IDLE_MS = 9000;
const WALK_SPEED_PX_PER_SEC = 220;
const PET_DURATION_MS = 1500;
const EDGE_MARGIN = 8;

function randomIdlePose(exclude?: CatPose): CatPose {
  const options = IDLE_POSES.filter((pose) => pose !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function MascotWidget() {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDismissed, setIsDismissed] = useState(false);

  const catSize = useRef({ width: 84, height: 50 }).current;

  const [pose, setPose] = useState<CatPose>("sit");
  const [facingRight, setFacingRight] = useState(true);
  const [isPetted, setIsPetted] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: 24,
    y: typeof window !== "undefined" ? window.innerHeight - catSize.height - 32 : 400,
  }));
  const [walkDuration, setWalkDuration] = useState(0.4);

  const catRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const poseRef = useRef(pose);
  const positionRef = useRef(position);
  const petTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  poseRef.current = pose;
  positionRef.current = position;

  const isExcludedRoute = EXCLUDED_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const isActive = !isExcludedRoute && !isDismissed && !prefersReducedMotion;

  // Idle pose cycling: pick a new random idle pose after a random delay,
  // as long as the cat isn't mid-walk (that transition is driven by
  // onAnimationComplete instead).
  useEffect(() => {
    if (!isActive || pose === "walk") return;
    const delay = MIN_IDLE_MS + Math.random() * (MAX_IDLE_MS - MIN_IDLE_MS);
    const timer = setTimeout(() => setPose((current) => randomIdlePose(current)), delay);
    return () => clearTimeout(timer);
  }, [isActive, pose]);

  // Global click handling: click the cat to pet it, click anywhere else to
  // send it walking there. Registered once; reads latest state via refs so
  // it doesn't need to be torn down/rebuilt on every state change.
  useEffect(() => {
    if (!isActive) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (dismissRef.current?.contains(target)) return;

      if (catRef.current?.contains(target) && poseRef.current !== "walk") {
        if (petTimeoutRef.current) clearTimeout(petTimeoutRef.current);
        setIsPetted(true);
        petTimeoutRef.current = setTimeout(() => setIsPetted(false), PET_DURATION_MS);
        return;
      }

      setIsPetted(false);
      const targetX = clamp(
        event.clientX - catSize.width / 2,
        EDGE_MARGIN,
        window.innerWidth - catSize.width - EDGE_MARGIN
      );
      const targetY = clamp(
        event.clientY - catSize.height / 2,
        EDGE_MARGIN,
        window.innerHeight - catSize.height - EDGE_MARGIN
      );

      const distance = Math.hypot(
        targetX - positionRef.current.x,
        targetY - positionRef.current.y
      );
      setFacingRight(targetX >= positionRef.current.x);
      setWalkDuration(Math.max(0.2, distance / WALK_SPEED_PX_PER_SEC));
      setPose("walk");
      setPosition({ x: targetX, y: targetY });
    }

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isActive, catSize.width, catSize.height]);

  // Keep the cat on-screen if the window is resized.
  useEffect(() => {
    if (!isActive) return;
    function handleResize() {
      setPosition((current) => ({
        x: clamp(current.x, EDGE_MARGIN, window.innerWidth - catSize.width - EDGE_MARGIN),
        y: clamp(current.y, EDGE_MARGIN, window.innerHeight - catSize.height - EDGE_MARGIN),
      }));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, catSize.width, catSize.height]);

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
        style={{ width: catSize.width, height: catSize.height }}
        initial={false}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "tween", duration: walkDuration, ease: "linear" }}
        onAnimationComplete={() => {
          if (poseRef.current === "walk") {
            setPose(randomIdlePose());
          }
        }}
      >
        <MascotCat pose={isPetted ? "sit" : pose} facingRight={facingRight} />
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

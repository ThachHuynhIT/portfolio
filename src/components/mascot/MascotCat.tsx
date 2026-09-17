"use client";

import { motion } from "framer-motion";

export type CatPose = "sit" | "wash" | "sleep" | "chase";

interface MascotCatProps {
  pose: CatPose;
  facingRight: boolean;
}

const FUR = "#e8974a";
const FUR_DARK = "#c97a34";
const BELLY = "#fff7ef";

const BODY_POSE: Record<CatPose, { scaleX: number; scaleY: number; y: number }> = {
  sit: { scaleX: 1, scaleY: 1, y: 0 },
  wash: { scaleX: 1, scaleY: 1, y: 0 },
  sleep: { scaleX: 1.18, scaleY: 0.72, y: 8 },
  chase: { scaleX: 1.05, scaleY: 0.95, y: 0 },
};

const TAIL_ROTATE: Record<CatPose, number> = {
  sit: -10,
  wash: -18,
  sleep: 26,
  chase: -2,
};

const BACK_LEG_POSE: Record<CatPose, { rotate: number; opacity: number }> = {
  sit: { rotate: 0, opacity: 1 },
  wash: { rotate: 0, opacity: 1 },
  sleep: { rotate: -25, opacity: 0.35 },
  chase: { rotate: 0, opacity: 1 },
};

const FRONT_LEG_POSE: Record<CatPose, { rotate: number; opacity: number }> = {
  sit: { rotate: 0, opacity: 1 },
  wash: { rotate: -70, opacity: 1 },
  sleep: { rotate: 55, opacity: 0.35 },
  chase: { rotate: 0, opacity: 1 },
};

/**
 * A small procedural 2D cat (no external art assets) built from primitive
 * SVG shapes. Poses are expressed as transforms on the same shapes rather
 * than distinct drawings, kept in one file since the parts are tightly
 * coupled (shared pivot points between pose and micro-animations).
 *
 * Behavior/pose timeline (sit -> wash -> sleep the longer the cursor stays
 * put, chase while it's moving) is ported from the classic oneko/neko
 * cursor-chasing cat; see MascotWidget for the state machine driving it.
 */
export default function MascotCat({ pose, facingRight }: MascotCatProps) {
  const body = BODY_POSE[pose];
  const backLeg = BACK_LEG_POSE[pose];
  const frontLeg = FRONT_LEG_POSE[pose];
  const isChasing = pose === "chase";
  const isWashing = pose === "wash";
  const isSleeping = pose === "sleep";

  return (
    <motion.svg
      viewBox="0 0 100 60"
      className="w-full h-full"
      style={{ overflow: "visible" }}
      animate={{ scaleX: facingRight ? 1 : -1 }}
      transition={{ duration: 0.25 }}
    >
      {/* invisible full-box hit target: the cat's shapes leave plenty of
          transparent gaps that would otherwise let clicks fall through
          instead of registering as "clicked the cat" */}
      <rect x={0} y={0} width={100} height={60} fill="transparent" />

      {/* zzz while sleeping */}
      {isSleeping &&
        [0, 1, 2].map((i) => (
          <motion.text
            key={i}
            x={80}
            y={14}
            fontSize={8}
            fontWeight={700}
            fill="#9fb4c7"
            initial={{ opacity: 0, x: 80, y: 14, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], x: 92, y: -6, scale: 1 }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut",
            }}
          >
            z
          </motion.text>
        ))}

      {/* tail */}
      <motion.path
        d="M22,38 Q6,32 8,14 Q9,5 18,3"
        fill="none"
        stroke={FUR}
        strokeWidth={6}
        strokeLinecap="round"
        style={{ transformOrigin: "22px 38px" }}
        animate={{
          rotate: isChasing
            ? [TAIL_ROTATE.chase - 10, TAIL_ROTATE.chase + 10, TAIL_ROTATE.chase - 10]
            : TAIL_ROTATE[pose],
        }}
        transition={
          isChasing
            ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.5 }
        }
      />

      {/* back leg */}
      <motion.g
        style={{ transformOrigin: "30px 42px" }}
        animate={{
          rotate: isChasing ? [12, -16, 12] : backLeg.rotate,
          opacity: backLeg.opacity,
        }}
        transition={
          isChasing
            ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.4 }
        }
      >
        <rect x={26} y={42} width={8} height={15} rx={4} fill={FUR_DARK} />
        <ellipse cx={30} cy={58} rx={5} ry={3} fill={BELLY} />
      </motion.g>

      {/* body */}
      <motion.g
        style={{ transformOrigin: "45px 45px" }}
        animate={{ scaleX: body.scaleX, scaleY: body.scaleY, y: body.y }}
        transition={{ duration: 0.4 }}
      >
        <ellipse cx={45} cy={38} rx={24} ry={15} fill={FUR} />
        <ellipse cx={46} cy={45} rx={14} ry={7} fill={BELLY} />
      </motion.g>

      {/* front leg */}
      <motion.g
        style={{ transformOrigin: "68px 40px" }}
        animate={
          isWashing
            ? { rotate: [-70, -95, -70], opacity: 1 }
            : {
                rotate: isChasing ? [-16, 20, -16] : frontLeg.rotate,
                opacity: frontLeg.opacity,
              }
        }
        transition={
          isWashing
            ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
            : isChasing
              ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.4 }
        }
      >
        <rect x={65} y={40} width={7} height={16} rx={3.5} fill={FUR} />
        <ellipse cx={68} cy={57} rx={4.5} ry={3} fill={BELLY} />
      </motion.g>

      {/* head */}
      <motion.g
        style={{ transformOrigin: "76px 30px" }}
        animate={{
          rotate: isWashing ? [-6, 6, -6] : 0,
          y: isSleeping ? 4 : 0,
        }}
        transition={
          isWashing
            ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.4 }
        }
      >
        <polygon points="63,18 69,4 75,17" fill={FUR} />
        <polygon points="78,17 84,3 90,18" fill={FUR} />
        <circle cx={76} cy={28} r={13} fill={FUR} />
        {isSleeping ? (
          <path
            d="M78,27 Q81,30 84,27"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        ) : (
          <motion.ellipse
            cx={81}
            cy={27}
            rx={2.6}
            ry={3.6}
            fill="#1a1a1a"
            style={{ transformOrigin: "81px 27px" }}
            animate={{ scaleY: [1, 1, 0.1, 1] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2 + Math.random() * 3,
            }}
          />
        )}
        <polygon points="88,29 92,31 88,33" fill="#e8899e" />
        <line x1={83} y1={31} x2={94} y2={29} stroke="#fff" strokeWidth={0.7} opacity={0.7} />
        <line x1={83} y1={33} x2={94} y2={34} stroke="#fff" strokeWidth={0.7} opacity={0.7} />
      </motion.g>
    </motion.svg>
  );
}

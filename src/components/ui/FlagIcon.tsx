import React from "react";
import { Locale } from "@/locales";
import { cn } from "@/lib/utils";

export interface FlagIconProps {
  locale?: Locale | string;
  code?: Locale | string;
  size?: number | string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * FlagIcon — High quality, resolution-independent SVG vector flags
 * for Vietnamese (Vietnam 🇻🇳) and English (UK 🇬🇧).
 * Eliminates Windows emoji font limitations where flags render as text boxes (GB/VN).
 */
export default function FlagIcon({
  locale,
  code,
  size,
  className,
  width,
  height,
}: FlagIconProps) {
  const activeCode = (code || locale || "en") as string;
  const isVi = activeCode.toLowerCase() === "vi";

  const resolvedWidth = width ?? (size ? Math.round(Number(size) * 1.35) : 24);
  const resolvedHeight = height ?? (size ? Number(size) : 16);

  if (isVi) {
    // Flag of Vietnam (Red background with centered yellow 5-point star)
    return (
      <svg
        viewBox="0 0 900 600"
        width={resolvedWidth}
        height={resolvedHeight}
        className={cn("inline-block flex-shrink-0 rounded-[3px] shadow-sm overflow-hidden", className)}
        aria-hidden="true"
      >
        <rect width="900" height="600" fill="#DA251D" />
        {/* Star points: R = 180, center (450, 300) */}
        <polygon
          points="450,120 492.3,250.3 621.1,250.3 516.9,326.1 556.8,452.9 450,375.3 343.2,452.9 383.1,326.1 278.9,250.3 407.7,250.3"
          fill="#FFFF00"
        />
      </svg>
    );
  }

  // Flag of the United Kingdom (Union Jack for English)
  return (
    <svg
      viewBox="0 0 60 30"
      width={resolvedWidth}
      height={resolvedHeight}
      className={cn("inline-block flex-shrink-0 rounded-[3px] shadow-sm overflow-hidden", className)}
      aria-hidden="true"
    >
      <clipPath id="uk-clip">
        <rect width="60" height="30" rx="1" />
      </clipPath>
      <g clipPath="url(#uk-clip)">
        {/* Blue background */}
        <rect width="60" height="30" fill="#012169" />
        
        {/* White saltire */}
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        
        {/* Red saltire (St Patrick) */}
        <path d="M0,0 L30,15 M60,0 L30,15 M60,30 L30,15 M0,30 L30,15" stroke="#C8102E" strokeWidth="2" />
        
        {/* White cross (St George backing) */}
        <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
        
        {/* Red cross (St George) */}
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

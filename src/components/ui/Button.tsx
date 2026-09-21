"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  border,
  brand,
  focus,
  motion,
  radius,
  surface,
  text,
} from "@/lib/design-tokens";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-medium",
          motion.base,
          focus.ring,
          focus.disabled,
          {
            // Sizes
            [`px-4 py-2 text-sm ${radius.chip}`]: size === "sm",
            [`px-6 py-3 text-base ${radius.control}`]: size === "md",
            [`px-8 py-4 text-lg ${radius.card}`]: size === "lg",
            // Variants
            [`${brand.gradient} text-white ${brand.gradientHover} ${brand.glow} ${brand.glowHover}`]:
              variant === "primary",
            [`${surface.raised} ${text.primary} ${surface.raisedHover} backdrop-blur-sm ${border.subtle}`]:
              variant === "secondary",
            // `light:text-neutral-700` is intentionally one step lighter than
            // `text.secondary` here — ghost buttons sit on bare backgrounds.
            [`text-white/80 light:text-neutral-700 ${text.mutedHover} ${surface.faintHover}`]:
              variant === "ghost",
            [`${border.strong} ${text.primary} ${surface.faintHover} ${border.strongHover}`]:
              variant === "outline",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

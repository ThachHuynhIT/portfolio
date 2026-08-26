"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

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
          "relative inline-flex items-center justify-center font-medium transition-all duration-300",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:cursor-not-allowed disabled:opacity-50",
          {
            // Sizes
            "px-4 py-2 text-sm rounded-lg": size === "sm",
            "px-6 py-3 text-base rounded-xl": size === "md",
            "px-8 py-4 text-lg rounded-2xl": size === "lg",
            // Variants
            "bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40":
              variant === "primary",
            "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/10":
              variant === "secondary",
            "text-white/80 hover:text-white hover:bg-white/5":
              variant === "ghost",
            "border border-white/20 text-white hover:bg-white/5 hover:border-white/40":
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

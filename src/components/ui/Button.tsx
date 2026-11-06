"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import ActionStars from "./ActionStars";

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
          "portfolio-button portfolio-action relative inline-flex min-h-11 items-center justify-center rounded-lg font-medium transition-[color,background-color,border-color,transform,opacity] duration-150 active:scale-[0.98]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-portfolio-accretion focus-visible:ring-offset-2 focus-visible:ring-offset-portfolio-void",
          "disabled:cursor-not-allowed disabled:opacity-50",
          {
            // Sizes
            "px-4 py-2 text-sm rounded-lg": size === "sm",
            "px-6 py-3 text-base rounded-lg": size === "md",
            "px-8 py-4 text-lg rounded-lg": size === "lg",
            // Variants
            "portfolio-button-primary portfolio-action-primary bg-portfolio-accretion text-portfolio-on-accretion hover:bg-portfolio-accretion-hover":
              variant === "primary",
            "portfolio-action-secondary bg-portfolio-hull text-portfolio-ink border border-portfolio-control hover:border-portfolio-accretion":
              variant === "secondary",
            "text-portfolio-ink hover:bg-portfolio-ink/5":
              variant === "ghost",
            "portfolio-action-secondary border border-portfolio-control text-portfolio-ink hover:border-portfolio-accretion hover:bg-portfolio-ink/5":
              variant === "outline",
          },
          className
        )}
        {...props}
      >
        {variant === "primary" && <ActionStars />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

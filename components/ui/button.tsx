"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary px-5 py-3 text-white shadow-[0_8px_20px_rgba(74,124,89,0.28)] hover:bg-primary-strong hover:-translate-y-0.5",
        secondary: "bg-surface px-5 py-3 text-foreground ring-1 ring-border hover:bg-surface-muted",
        ghost: "px-4 py-2 text-primary hover:bg-primary-soft",
        danger: "bg-danger px-5 py-3 text-white hover:opacity-90",
      },
      size: {
        md: "h-10 text-sm",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);

Button.displayName = "Button";

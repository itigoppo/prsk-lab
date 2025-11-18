"use client"

import { cn } from "@/lib/utils/common"
import { cva, type VariantProps } from "class-variance-authority"
import { ComponentPropsWithoutRef, forwardRef } from "react"

const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-colors gap-1",
  {
    compoundVariants: [
      // === Outline Variants ===
      {
        class: "text-teal-500 border-teal-500 bg-white",
        outline: true,
        variant: "primary",
      },
      {
        class: "text-lime-500 border-lime-500 bg-white",
        outline: true,
        variant: "secondary",
      },
      {
        class: "text-rose-500 border-rose-500 bg-white",
        outline: true,
        variant: "danger",
      },
      {
        class: "text-amber-500 border-amber-500 bg-white",
        outline: true,
        variant: "warning",
      },
      {
        class: "text-slate-500 border-slate-500 bg-white",
        outline: true,
        variant: "default",
      },
    ],
    defaultVariants: {
      outline: false,
      rounded: "default",
      size: "default",
      variant: "default",
    },
    variants: {
      outline: {
        false: "border-transparent",
        true: "bg-transparent border",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
      },
      size: {
        default: "h-6 px-2.5 py-0.5",
        lg: "h-7 px-3 py-1 text-sm",
        sm: "h-5 px-2 py-0.5 text-xs",
      },
      variant: {
        danger: "bg-rose-500 text-white",
        default: "bg-slate-500 text-white",
        primary: "bg-teal-500 text-white",
        secondary: "bg-lime-500 text-white",
        warning: "bg-amber-500 text-white",
      },
    },
  }
)

export interface BadgeProps
  extends ComponentPropsWithoutRef<"span">,
    VariantProps<typeof badgeVariants> {
  outline?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, outline, rounded, size, variant, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ className, outline, rounded, size, variant }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }

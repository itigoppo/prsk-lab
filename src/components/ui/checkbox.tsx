"use client"

import { cn } from "@/lib/utils/common"
import { cva, type VariantProps } from "class-variance-authority"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import * as React from "react"

const checkboxVariants = cva(
  "group peer relative flex size-4 shrink-0 items-center justify-center cursor-pointer transition-colors outline-none group-has-disabled/field:opacity-50 disabled:cursor-not-allowed disabled:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        danger:
          "data-[state=checked]:text-rose-600 focus-visible:border-rose-600 focus-visible:ring-rose-600/50 focus-visible:ring-[3px]",
        default:
          "data-[state=checked]:text-slate-600 focus-visible:border-slate-600 focus-visible:ring-slate-600/50 focus-visible:ring-[3px]",
        primary:
          "data-[state=checked]:text-teal-600 focus-visible:border-teal-600 focus-visible:ring-teal-600/50 focus-visible:ring-[3px]",
        secondary:
          "data-[state=checked]:text-lime-600 focus-visible:border-lime-600 focus-visible:ring-lime-600/50 focus-visible:ring-[3px]",
        warning:
          "data-[state=checked]:text-amber-600 focus-visible:border-amber-600 focus-visible:ring-amber-600/50 focus-visible:ring-[3px]",
      },
    },
  }
)

export interface CheckboxProps
  extends
    React.ComponentProps<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /** Material Symbolsのサイズ (px) */
  iconSize?: number
  /** Material Symbolsのfont-weight (100-700) */
  iconWeight?: number
  /** 中間状態（横線アイコン）で表示 */
  indeterminate?: boolean
}

function Checkbox({
  checked,
  className,
  iconSize,
  iconWeight,
  indeterminate,
  variant,
  ...props
}: CheckboxProps) {
  const iconStyle: React.CSSProperties | undefined =
    iconWeight || iconSize ? { fontSize: iconSize, fontWeight: iconWeight } : undefined

  const getIcon = () => {
    if (checked && indeterminate) return "indeterminate_check_box"
    if (checked) return "select_check_box"
    return "check_box_outline_blank"
  }

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ className, variant }))}
      checked={checked}
      {...props}
    >
      <span className="material-symbols-outlined" style={iconStyle}>
        {getIcon()}
      </span>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox, checkboxVariants }

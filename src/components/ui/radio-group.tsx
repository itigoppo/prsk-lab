"use client"

import { cn } from "@/lib/utils/common"
import { cva, type VariantProps } from "class-variance-authority"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import * as React from "react"
import { createContext, useContext, useState } from "react"

const radioGroupVariants = cva("grid w-full gap-2", {
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      danger: "",
      default: "",
      primary: "",
      secondary: "",
      warning: "",
    },
  },
})

const radioGroupItemVariants = cva(
  "group peer relative flex shrink-0 cursor-pointer items-center justify-center outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:text-red-500 aria-invalid:ring-red-500/20 aria-invalid:ring-[3px]",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        danger: "text-rose-600 focus-visible:ring-rose-600/50 focus-visible:ring-[3px]",
        default: "text-slate-600 focus-visible:ring-slate-600/50 focus-visible:ring-[3px]",
        primary: "text-teal-600 focus-visible:ring-teal-600/50 focus-visible:ring-[3px]",
        secondary: "text-lime-600 focus-visible:ring-lime-600/50 focus-visible:ring-[3px]",
        warning: "text-amber-600 focus-visible:ring-amber-600/50 focus-visible:ring-[3px]",
      },
    },
  }
)

type Variant = VariantProps<typeof radioGroupItemVariants>["variant"]

const RadioGroupContext = createContext<{
  selectedValue?: string
  variant?: Variant
}>({})

export interface RadioGroupProps
  extends
    React.ComponentProps<typeof RadioGroupPrimitive.Root>,
    VariantProps<typeof radioGroupVariants> {}

function RadioGroup({
  className,
  defaultValue,
  onValueChange,
  value,
  variant,
  ...props
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const selectedValue = value ?? internalValue

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <RadioGroupContext.Provider value={{ selectedValue, variant }}>
      <RadioGroupPrimitive.Root
        data-slot="radio-group"
        className={cn(radioGroupVariants({ className, variant }))}
        defaultValue={defaultValue}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps extends Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  "children"
> {
  children?: React.ReactNode
  /** Material Symbolsのサイズ (px) */
  iconSize?: number
  /** Material Symbolsのfont-weight (100-700) */
  iconWeight?: number
}

function RadioGroupItem({
  children,
  className,
  iconSize,
  iconWeight,
  value,
  ...props
}: RadioGroupItemProps) {
  const { selectedValue, variant } = useContext(RadioGroupContext)
  const isChecked = selectedValue === value
  const id = React.useId()
  const iconStyle: React.CSSProperties | undefined =
    iconWeight || iconSize ? { fontSize: iconSize, fontWeight: iconWeight } : undefined

  return (
    <div className="flex items-center gap-1">
      <RadioGroupPrimitive.Item
        id={id}
        data-slot="radio-group-item"
        className={cn(
          radioGroupItemVariants({ className, variant: isChecked ? variant : "default" })
        )}
        value={value}
        {...props}
      >
        <span
          className="material-symbols-outlined flex items-center justify-center leading-none"
          style={iconStyle}
        >
          {isChecked ? "task_alt" : "circle"}
        </span>
      </RadioGroupPrimitive.Item>
      {children && (
        <label htmlFor={id} className="cursor-pointer text-sm">
          {children}
        </label>
      )}
    </div>
  )
}

export { RadioGroup, RadioGroupItem, radioGroupItemVariants, radioGroupVariants }

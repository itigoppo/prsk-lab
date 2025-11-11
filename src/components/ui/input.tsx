import { cn } from "@/lib/utils/common"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef } from "react"

export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-rose-500 focus-visible:ring-rose-500"
            : "border-stone-300 focus-visible:ring-teal-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

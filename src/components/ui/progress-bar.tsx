import { cn } from "@/lib/utils/common"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef, useMemo } from "react"

interface ProgressBarProps extends ComponentPropsWithoutRef<"div"> {
  label?: string
  value: number
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, label, value, ...props }, ref) => {
    const progressStyle = useMemo(() => ({ width: `${value}%` }), [value])

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label && <div className="mb-1 text-center text-sm text-gray-700">{label}</div>}

        <div className="relative h-4 w-full overflow-hidden rounded bg-slate-600">
          {/* 背景のバー部分（空の部分） */}
          <div
            className={cn(
              "bg-prsk-player1-400 flex h-full items-center justify-center text-xs text-white transition-all duration-300",
              value === 0 && "min-w-4 bg-slate-600"
            )}
            style={progressStyle}
          >
            {value}%
          </div>
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = "ProgressBar"

export { ProgressBar }

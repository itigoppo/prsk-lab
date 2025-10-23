import { exo2 } from "@/components/fonts/exo2"
import { IconWandStars } from "@/components/icons"
import { cn } from "@/lib/utils/common"

export function Logo() {
  return (
    <div
      className={cn(
        "flex items-center space-x-2 px-3 py-4 backdrop-blur-md transition-transform",
        exo2.className
      )}
    >
      {/* Animated Icon */}
      <IconWandStars className="size-9 animate-pulse text-lime-500" />

      {/* Stylized Text */}
      <span className="text-4xl font-bold tracking-tight text-slate-600">
        <span>Prsk</span>
        <span className="text-lime-500">Lab</span>
      </span>
    </div>
  )
}

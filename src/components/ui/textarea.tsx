import * as React from "react"

import { cn } from "@/lib/utils/common"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: boolean
}

function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-rose-500 focus-visible:ring-rose-500"
          : "border-stone-300 focus-visible:ring-teal-500",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

"use client"

import { cn } from "@/lib/utils/common"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { Badge } from "./badge"

const labelVariants = cva(
  "inline-flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean
}

const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ children, className, required, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
      {children}
      {required && (
        <Badge variant="danger" outline size="sm">
          必須
        </Badge>
      )}
    </LabelPrimitive.Root>
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

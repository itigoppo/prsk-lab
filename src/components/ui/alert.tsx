import { cn } from "@/lib/utils/common"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef } from "react"

const alertVariants = cva("relative w-full rounded-lg border flex items-center gap-3 p-4", {
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "border-slate-300 bg-slate-50 text-slate-800 [&>svg]:text-slate-800",
      destructive: "border-rose-300 bg-rose-100 text-rose-800 [&>svg]:text-rose-800",
      disabled: "border-slate-300 bg-slate-100 text-slate-500 [&>svg]:text-slate-500",
      info: "border-blue-300 bg-blue-100 text-blue-800 [&>svg]:text-blue-800",
      loading: "border-indigo-300 bg-indigo-100 text-indigo-800 [&>svg]:text-indigo-800",
      success: "border-emerald-300 bg-emerald-100 text-emerald-800 [&>svg]:text-emerald-800",
      warning: "border-yellow-300 bg-yellow-100 text-yellow-800 [&>svg]:text-yellow-800",
    },
  },
})

interface AlertProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ children, className, icon, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1">{children}</div>
    </div>
  )
)
Alert.displayName = "Alert"

const AlertTitle = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"h5">>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 leading-none font-medium tracking-tight", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription, AlertTitle }

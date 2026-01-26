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

const variantIcons: Record<string, { colorClass: string; icon: string }> = {
  default: { colorClass: "text-slate-500", icon: "info" },
  destructive: { colorClass: "text-red-500", icon: "error" },
  disabled: { colorClass: "text-slate-400", icon: "block" },
  info: { colorClass: "text-blue-500", icon: "info" },
  loading: { colorClass: "text-indigo-500", icon: "hourglass_empty" },
  success: { colorClass: "text-emerald-500", icon: "check_circle" },
  warning: { colorClass: "text-yellow-500", icon: "warning" },
}

interface AlertProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
  showIcon?: boolean
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ children, className, icon, showIcon = true, variant = "default", ...props }, ref) => {
    const iconConfig = variantIcons[variant ?? "default"]

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {showIcon && (
          <div className="shrink-0">
            {icon ?? (
              <span className={cn("material-symbols-outlined", iconConfig.colorClass)}>
                {iconConfig.icon}
              </span>
            )}
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    )
  }
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
    <div
      ref={ref}
      className={cn("flex items-center gap-1 text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription, AlertTitle }

import { cn } from "@/lib/utils/common"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { forwardRef } from "react"
import { Input } from "./input"
import { Label } from "./label"

export interface FormFieldProps extends ComponentPropsWithoutRef<"input"> {
  description?: ReactNode
  error?: string
  hasError?: boolean
  label?: string
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, description, error, hasError, id, label, ...props }, ref) => {
    const inputId = id || `form-field-${label?.toLowerCase().replace(/\s+/g, "-")}`
    const showError = hasError || !!error

    return (
      <div className={cn("space-y-2", className)}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <Input id={inputId} ref={ref} error={showError} {...props} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {description && <div className="text-xs text-slate-500">{description}</div>}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }

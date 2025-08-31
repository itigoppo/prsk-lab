import { cn } from "@/lib/utils/common"
import {
  Children,
  cloneElement,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react"
import { ButtonProps } from "../Button"

export interface ButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  activeIndex?: number
  children: ReactNode
  disabled?: boolean
  onChange?: (index: number) => void
  outline?: boolean
  size?: ButtonProps["size"]
  variant?: ButtonProps["variant"]
}

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      activeIndex,
      children,
      className,
      disabled = false,
      onChange,
      outline = false,
      size = "default",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const childArray = Children.toArray(children)

    return (
      <div ref={ref} className={cn("inline-flex", className)} role="group" {...props}>
        {childArray.map((child, index) => {
          if (!isValidElement(child)) return null

          const element = child as ReactElement<ButtonProps>

          const isFirst = index === 0
          const isLast = index === childArray.length - 1
          const isActive = index === activeIndex

          const appliedOutline =
            element.props.outline ??
            (typeof outline === "boolean" ? (isActive ? !outline : outline) : false)

          const appliedVariant = element.props.variant ?? variant
          const appliedDisabled = element.props.disabled ?? disabled
          const appliedSize = element.props.size ?? size

          const extraClass = cn(
            "rounded-none",
            isFirst && "rounded-l-md",
            isLast && "rounded-r-md",
            !isFirst && "border-l-0"
          )

          return cloneElement(element, {
            className: cn(element.props.className, extraClass),
            disabled: appliedDisabled,
            onClick: (e) => {
              element.props.onClick?.(e)
              if (!appliedDisabled && onChange) {
                onChange(index)
              }
            },
            outline: appliedOutline,
            size: appliedSize,
            variant: appliedVariant,
          })
        })}
      </div>
    )
  }
)

ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }

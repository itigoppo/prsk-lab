"use client"

import { cn } from "@/lib/utils/common"
import {
  Children,
  cloneElement,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
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

    const handleClick = useCallback(
      (index: number, originalOnClick?: (e: React.MouseEvent<HTMLButtonElement>) => void) =>
        (e: React.MouseEvent<HTMLButtonElement>) => {
          originalOnClick?.(e)
          if (!disabled && onChange) {
            onChange(index)
          }
        },
      [disabled, onChange]
    )

    const renderedChildren = useMemo(
      () =>
        childArray.map((child, index) => {
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
            onClick: handleClick(index, element.props.onClick),
            outline: appliedOutline,
            size: appliedSize,
            variant: appliedVariant,
          })
        }),
      [childArray, activeIndex, outline, variant, disabled, size, handleClick]
    )

    return (
      <div ref={ref} className={cn("inline-flex", className)} role="group" {...props}>
        {renderedChildren}
      </div>
    )
  }
)

ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }

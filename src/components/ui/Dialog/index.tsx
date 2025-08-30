"use client"

import { cn } from "@/lib/utils/common"
import type { ReactNode } from "react"
import { useEffect } from "react"
import { Button } from "../Button"

interface DialogProps {
  children: ReactNode
  onOpenChange: (open: boolean) => void
  isOpen: boolean
}

const Dialog = ({ children, onOpenChange, isOpen }: DialogProps) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow

    if (isOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onOpenChange])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-dialog-open="true">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  )
}
Dialog.displayName = "Dialog"

interface DialogContentProps {
  children: ReactNode
  className?: string
}

const DialogContent = ({ children, className }: DialogContentProps) => {
  return (
    <div
      className={cn(
        "relative z-50 w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
DialogContent.displayName = "DialogContent"

interface DialogHeaderProps {
  children: ReactNode
  className?: string
  onOpenChange?: (open: boolean) => void
}

const DialogHeader = ({ children, className, onOpenChange }: DialogHeaderProps) => {
  return (
    <div className={cn("text-center md:text-left", className)}>
      <div className="flex flex-1 flex-col space-y-1.5">{children}</div>
      {onOpenChange && (
        <div className="absolute top-2 right-2">
          <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>
      )}
    </div>
  )
}
DialogHeader.displayName = "DialogHeader"

interface DialogTitleProps {
  children: ReactNode
  className?: string
}

const DialogTitle = ({ children, className }: DialogTitleProps) => {
  return (
    <h3 className={cn("text-lg leading-none font-semibold tracking-tight", className)}>
      {children}
    </h3>
  )
}
DialogTitle.displayName = "DialogTitle"

interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

const DialogDescription = ({ children, className }: DialogDescriptionProps) => {
  return <p className={cn("text-sm", className)}>{children}</p>
}
DialogDescription.displayName = "DialogDescription"

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

const DialogFooter = ({ children, className }: DialogFooterProps) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse space-y-2 space-y-reverse md:flex-row md:justify-end md:space-y-0 md:space-x-2",
        className
      )}
    >
      {children}
    </div>
  )
}
DialogFooter.displayName = "DialogFooter"

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }

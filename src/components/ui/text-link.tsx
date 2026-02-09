import { cn } from "@/lib/utils/common"
import Link, { type LinkProps } from "next/link"
import type { ComponentPropsWithoutRef } from "react"

type TextLinkProps = LinkProps & Omit<ComponentPropsWithoutRef<"a">, keyof LinkProps>

export function TextLink({ className, ...props }: TextLinkProps) {
  return <Link className={cn("hover:text-lime-400", className)} {...props} />
}

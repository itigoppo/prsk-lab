import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const isNavItemActive = (currentPath: string, href: string): boolean => {
  const normalizedPath = currentPath.replace(/\/$/, "") // 末尾のスラッシュ除去
  const normalizedHref = href.replace(/\/$/, "")

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`)
}

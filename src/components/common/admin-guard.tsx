"use client"

import { useCurrentUser } from "@/contexts/user-context"
import { UserRole } from "@prisma/client"
import type { ReactNode } from "react"
import { LoadingState } from "./loading-state"

export function AdminGuard({ children }: { children: ReactNode }) {
  const { currentUser, initialLoading } = useCurrentUser()

  if (initialLoading) return <LoadingState />

  if (
    !currentUser ||
    (currentUser.role !== UserRole.Admin && currentUser.role !== UserRole.Editor)
  ) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">この操作を行う権限がありません</p>
      </div>
    )
  }

  return <>{children}</>
}

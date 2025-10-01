"use client"

import { useGetApiUsersMe } from "@/lib/api/generated/users/users"
import type { CurrentUserData } from "@/lib/schemas/user"
import { useSession } from "next-auth/react"
import { createContext, useContext } from "react"

interface UserContextType {
  currentUser: CurrentUserData | null
  initialError: string | null
  initialLoading: boolean
  refetch: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  // 認証済みの場合のみAPIを呼び出す
  const { data, error, isLoading, refetch } = useGetApiUsersMe({
    query: {
      enabled: isAuthenticated,
    },
  })

  const currentUser = data?.data ?? null
  const initialError = error ? "ユーザー情報の取得に失敗しました" : null
  const initialLoading = isAuthenticated ? isLoading : false

  return (
    <UserContext.Provider value={{ currentUser, initialError, initialLoading, refetch }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a UserProvider")
  }
  return context
}

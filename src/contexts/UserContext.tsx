"use client"

import { fetchCurrentUser } from "@/lib/api/users/get-current-user"
import type { CurrentUserData } from "@/types/user"
import { useSession } from "next-auth/react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"

interface UserContextType {
  currentUser: CurrentUserData | null
  initialError: string | null
  initialLoading: boolean
  refetch: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)

  const loadCurrentUser = useCallback(async () => {
    if (status !== "authenticated") {
      setCurrentUser(null)
      setInitialLoading(false)
      return
    }

    setInitialLoading(true)
    setInitialError(null)

    try {
      const res = await fetchCurrentUser()

      if (res.success && res.data) {
        setCurrentUser(res.data)
      } else {
        setInitialError(res.message || "取得に失敗しました")
      }
    } catch {
      setInitialError("ユーザー情報の取得中にエラーが発生しました")
    } finally {
      setInitialLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  return (
    <UserContext.Provider
      value={{ currentUser, initialError, initialLoading, refetch: loadCurrentUser }}
    >
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

"use client"

import { Button } from "@/components/ui/Button"
import { useCurrentUser } from "@/contexts/UserContext"
import { signOut } from "next-auth/react"

export default function DashboardPage() {
  const { currentUser } = useCurrentUser()

  return (
    <div className="h-screen">
      <h1>Dashboard</h1>
      {currentUser && (
        <>
          <p>{currentUser.name}</p>
          <p>{currentUser.avatarUrl}</p>
          <p>{currentUser.role}</p>
          <Button onClick={() => signOut()}>ログアウト</Button>
        </>
      )}
    </div>
  )
}

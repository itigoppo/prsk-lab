"use client"

import { IconDiscord } from "@/components/icons/discord"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export function LoginView() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const handleSignIn = async () => {
    await signIn("discord", { callbackUrl })
  }

  return (
    <Card className="w-full shadow-xl md:mx-auto md:max-w-md">
      <CardHeader className="space-y-1">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
            <span className="material-symbols-outlined text-slate-600">login</span>
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">ログイン</CardTitle>
        <CardDescription className="text-center text-slate-600">
          アカウントにログインしてください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleSignIn} outline className="w-full">
          <IconDiscord className="size-4" />
          <span>Discordでログイン</span>
        </Button>
      </CardContent>
    </Card>
  )
}

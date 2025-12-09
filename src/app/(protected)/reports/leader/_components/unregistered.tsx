"use client"
import { IconTofu } from "@/components/icons/tofu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function Unregistered() {
  const router = useRouter()
  const handleGoToSettings = useCallback(() => {
    router.push("/settings")
  }, [router])

  return (
    <Card>
      <CardHeader>
        <CardTitle>リーダーボードスプレッドシートが未設定です</CardTitle>
        <CardDescription>
          リーダーボードスプレッドシートのURLを設定してください。設定画面から設定できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <IconTofu className="w-20 text-slate-300" />
        </div>
        <div className="flex justify-center">
          <Button onClick={handleGoToSettings} variant="primary" outline>
            設定画面に移動
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

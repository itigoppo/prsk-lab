"use client"

import { IconDiscord } from "@/components/icons/discord"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useCallback } from "react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const handleSignIn = useCallback(async () => {
    await signIn("discord", { callbackUrl })
  }, [callbackUrl])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onOpenChange={onClose}>
          <DialogTitle>ログイン</DialogTitle>
          <DialogDescription>アカウントにログインしますか？</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSignIn} variant="primary" className="w-full">
            <IconDiscord className="size-4" />
            <span>Discordでログイン</span>
          </Button>

          <Button onClick={handleCancel} outline className="w-full">
            <span className="material-symbols-outlined">block</span>
            <span>キャンセル</span>
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

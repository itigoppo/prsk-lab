"use client"

import { IconDiscord } from "@/components/icons/discord"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { signIn } from "next-auth/react"
import { useCallback } from "react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const handleSignIn = useCallback(async () => {
    await signIn("discord")
  }, [])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="space-y-4">
          <DialogHeader onOpenChange={onClose}>
            <DialogTitle>ログイン</DialogTitle>
            <DialogDescription>アカウントにログインしますか？</DialogDescription>
          </DialogHeader>

          <Button onClick={handleSignIn} variant="primary" className="w-full">
            <IconDiscord className="size-4" />
            <span>Discordでログイン</span>
          </Button>

          <Button onClick={handleCancel} outline className="w-full">
            <span className="material-symbols-outlined">block</span>
            <span>キャンセル</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

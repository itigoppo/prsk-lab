"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { signOut } from "next-auth/react"
import { useCallback } from "react"

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onOpenChange={onClose}>
          <DialogTitle>ログアウト</DialogTitle>
          <DialogDescription>アカウントをログアウトしますか？</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Button onClick={handleSignOut} variant="primary" className="w-full">
            <span className="material-symbols-outlined">exit_to_app</span>
            <span>ログアウト</span>
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

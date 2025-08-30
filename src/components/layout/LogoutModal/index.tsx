import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { signOut } from "next-auth/react"

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const handleSignOut = async () => {
    await signOut()
  }
  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="space-y-4">
          <DialogHeader onOpenChange={onClose}>
            <DialogTitle>ログアウト</DialogTitle>
            <DialogDescription>アカウントをログアウトしますか？</DialogDescription>
          </DialogHeader>
          <Button onClick={handleSignOut} variant="primary" className="w-full">
            <span className="material-symbols-outlined">exit_to_app</span>
            <span>ログアウト</span>
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

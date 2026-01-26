"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"

interface HappinessBonusProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function HappinessBonus({ isOpen, setIsOpen }: HappinessBonusProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>ハピネスガチャ(10/12〜10/21)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>対象の場合チェック</AlertDescription>
            </Alert>

            <div
              onClick={() => {
                dispatch.acquisition.setIsHappiness((state) => !state)
              }}
              className="flex items-center gap-3 hover:cursor-pointer"
            >
              <Checkbox checked={state.acquisition.isHappiness} variant="primary" />
              <div>おまけにワイルドフォーチュンフラワーを選択した</div>
              <RequiredBadge
                required={{
                  blue: 0,
                  green: 0,
                  orange: 0,
                  purple: 0,
                  red: 0,
                  white: 0,
                  wild: 2,
                }}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {state.acquisition.isHappiness && (
        <div className="mt-4 space-y-2">
          <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              ハピネスガチャ(<span className="text-pink-600">10/12〜10/21</span>)
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>
            おまけにワイルドフォーチュンフラワーを選択した
          </div>
        </div>
      )}
    </div>
  )
}

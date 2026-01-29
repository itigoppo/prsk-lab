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
import { CAMPAIGN_PERIOD, GIFT_GACHA_CONFIG, GiftGachaType } from "../../../_constants/config"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"
import { RequiredBadge } from "../../required-badge"

interface GiftGachaProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  type: GiftGachaType
}

export function GiftGacha({ isOpen, setIsOpen, type }: GiftGachaProps) {
  const { dispatch, state } = useWorldBloomContext()
  const config = GIFT_GACHA_CONFIG[type]

  const isChecked =
    type === "premium" ? state.acquisition.isPremiumGift : state.acquisition.isHeartfeltGift

  const toggleChecked = () => {
    if (type === "premium") {
      dispatch.acquisition.setIsPremiumGift((prev) => !prev)
    } else {
      dispatch.acquisition.setIsHeartfeltGift((prev) => !prev)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>
              {config.label}({CAMPAIGN_PERIOD})
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>対象の場合チェック</AlertDescription>
            </Alert>

            <div onClick={toggleChecked} className="flex items-center gap-3 hover:cursor-pointer">
              <Checkbox checked={isChecked} variant="primary" />
              <div>{config.label}を引く</div>
              <RequiredBadge
                required={{
                  wild: config.reward,
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

      {isChecked && (
        <div className="mt-4 space-y-2">
          <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              {config.label}(<span className="text-pink-600">{CAMPAIGN_PERIOD}</span>)
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>
            {config.label}を引く
          </div>
        </div>
      )}
    </div>
  )
}

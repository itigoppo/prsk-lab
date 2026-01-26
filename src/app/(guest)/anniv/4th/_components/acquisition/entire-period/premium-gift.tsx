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
import { useMemo } from "react"
import { useFortuneFlowerContext } from "../../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../../required-badge"

interface PremiumGiftProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

interface Item {
  checked: boolean
  label: string
  onClick: () => void
  rewards: {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
  }
}

export function PremiumGift({ isOpen, setIsOpen }: PremiumGiftProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const items: Item[] = useMemo(() => {
    return [
      {
        checked: state.acquisition.isGachaVs,
        label: "VS",
        onClick: () => {
          dispatch.acquisition.setIsGachaVs((state) => !state)
        },
        rewards: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 100,
        },
      },
      {
        checked: state.acquisition.isGachaLn,
        label: "L/n",
        onClick: () => {
          dispatch.acquisition.setIsGachaLn((state) => !state)
        },
        rewards: {
          blue: 100,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.acquisition.isGachaMmj,
        label: "MMJ",
        onClick: () => {
          dispatch.acquisition.setIsGachaMmj((state) => !state)
        },
        rewards: {
          blue: 0,
          green: 100,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.acquisition.isGachaVbs,
        label: "VBS",
        onClick: () => {
          dispatch.acquisition.setIsGachaVbs((state) => !state)
        },
        rewards: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 100,
          white: 0,
        },
      },
      {
        checked: state.acquisition.isGachaWs,
        label: "WxS",
        onClick: () => {
          dispatch.acquisition.setIsGachaWs((state) => !state)
        },
        rewards: {
          blue: 0,
          green: 0,
          orange: 100,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.acquisition.isGacha25,
        label: "25",
        onClick: () => {
          dispatch.acquisition.setIsGacha25((state) => !state)
        },
        rewards: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 100,
          red: 0,
          white: 0,
        },
      },
    ]
  }, [state, dispatch])

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>プレミアムプレゼントガチャ</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>ガチャを回す予定、回したユニットをチェック</AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-2">
              {items.map(({ checked, label, onClick, rewards }, index) => (
                <div
                  key={index}
                  onClick={() => {
                    onClick()
                  }}
                  className="flex items-center gap-3 hover:cursor-pointer"
                >
                  <Checkbox checked={checked} variant="primary" />
                  <div>{label}</div>
                  <RequiredBadge required={{ wild: 0, ...rewards }} />
                </div>
              ))}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {items.filter(({ checked }) => checked).length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            プレミアムプレゼントガチャ(<span className="text-pink-600">〜10/31</span>)
          </div>

          <div className="grid grid-cols-3 gap-2">
            {items
              .filter(({ checked }) => checked)
              .map(({ label }, index) => (
                <div className="flex items-center gap-1" key={index}>
                  <span className="material-symbols-outlined text-lime-500">stars</span>
                  {label}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

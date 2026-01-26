"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useMemo } from "react"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"

interface AfterPartyStickerProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

interface Item {
  label: string
  maximum: number
  onClick: (count: number) => void
  reward: {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
    wild: number
  }
  selected: number
}

export function AfterPartySticker({ isOpen, setIsOpen }: AfterPartyStickerProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const items: Item[] = useMemo(() => {
    return [
      {
        label: "ワイルドフォーチュンフラワー",
        maximum: 4,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerWild(count)
        },
        reward: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
          wild: 1,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerWild,
      },
      {
        label: "白色の花びら",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerWhite(count)
        },
        reward: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 10,
          wild: 0,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerWhite,
      },
      {
        label: "青色の花びら",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerBlue(count)
        },
        reward: {
          blue: 10,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
          wild: 0,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerBlue,
      },
      {
        label: "緑色の花びら",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerGreen(count)
        },
        reward: {
          blue: 0,
          green: 10,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
          wild: 0,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerGreen,
      },
      {
        label: "赤色の花びら",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerRed(count)
        },
        reward: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 10,
          white: 0,
          wild: 0,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerRed,
      },
      {
        label: "橙色の花びら",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerOrange(count)
        },
        reward: {
          blue: 0,
          green: 0,
          orange: 10,
          purple: 0,
          red: 0,
          white: 0,
          wild: 0,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerOrange,
      },
      {
        label: "紫色の花びら",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.acquisition.setNumberOfRewardAfterPartyStickerPurple(count)
        },
        reward: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 10,
          red: 0,
          white: 0,
          wild: 0,
        },
        selected: state.acquisition.numberOfRewardAfterPartyStickerPurple,
      },
    ]
  }, [state, dispatch])

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>フラワーアソートガチャ交換所(10/27〜10/31)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>手に入れたいアイテムの交換回数にチェック</AlertDescription>
            </Alert>

            {items.map(({ label, maximum, onClick, reward, selected }, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-1">
                  <div className="border-l-8 border-red-300 pl-2 font-bold">{label}</div>
                  <RequiredBadge required={reward} />
                </div>

                <RadioGroup
                  value={selected.toString()}
                  onValueChange={(value) => onClick(Number(value))}
                  className="grid grid-cols-3 gap-2"
                  variant="primary"
                >
                  {Array(maximum + 1)
                    .fill(0)
                    .map((__val, index2) => (
                      <RadioGroupItem key={index2} value={index2.toString()}>
                        {index2}回交換
                      </RadioGroupItem>
                    ))}
                </RadioGroup>
              </div>
            ))}
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {items.filter(({ selected }) => selected !== 0).length !== 0 && (
        <div className="mt-4 space-y-2">
          <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              フラワーアソートガチャ交換所 (<span className="text-pink-600">10/27〜10/31</span>)
            </div>
          </div>

          {items
            .filter(({ selected }) => selected !== 0)
            .map(({ label, selected }, index) => (
              <div className="flex items-center gap-1" key={index}>
                <span className="material-symbols-outlined text-lime-500">stars</span>
                {label} ({selected}回交換)
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

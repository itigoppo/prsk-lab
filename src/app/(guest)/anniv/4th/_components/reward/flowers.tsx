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
import { Dispatch, SetStateAction, useMemo } from "react"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"

interface FlowersProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export interface Item {
  checked: boolean
  label: string
  onClick: () => void
  required: {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
  }
}

export function Flowers({ isOpen, setIsOpen }: FlowersProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const items: Item[] = useMemo(() => {
    return [
      {
        checked: state.reward.flowers.isRewardCostume,
        label: "4周年記念服セット",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardCostume((state) => !state)
        },
        required: {
          blue: 100,
          green: 100,
          orange: 100,
          purple: 100,
          red: 100,
          white: 100,
        },
      },
      {
        checked: state.reward.flowers.isRewardSkill,
        label: "スキルアップ用スコア(コンプリート)",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardSkill((state) => !state)
        },
        required: {
          blue: 100,
          green: 100,
          orange: 100,
          purple: 100,
          red: 100,
          white: 100,
        },
      },
      {
        checked: state.reward.flowers.isRewardVsBottle,
        label: "VS想いの小瓶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardVsBottle((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 100,
        },
      },
      {
        checked: state.reward.flowers.isRewardLnBottle,
        label: "L/n想いの小瓶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardLnBottle((state) => !state)
        },
        required: {
          blue: 100,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardMmjBottle,
        label: "MMJ想いの小瓶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardMmjBottle((state) => !state)
        },
        required: {
          blue: 0,
          green: 100,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardVbsBottle,
        label: "VBS想いの小瓶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardVbsBottle((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 100,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardWsBottle,
        label: "WxS想いの小瓶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardWsBottle((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 100,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isReward25Bottle,
        label: "25想いの小瓶",
        onClick: () => {
          dispatch.reward.flowers.setIsReward25Bottle((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 100,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardVsCrystal,
        label: "VS想いの純結晶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardVsCrystal((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 100,
        },
      },
      {
        checked: state.reward.flowers.isRewardLnCrystal,
        label: "L/n想いの純結晶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardLnCrystal((state) => !state)
        },
        required: {
          blue: 100,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardMmjCrystal,
        label: "MMJ想いの純結晶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardMmjCrystal((state) => !state)
        },
        required: {
          blue: 0,
          green: 100,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardVbsCrystal,
        label: "VBS想いの純結晶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardVbsCrystal((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 100,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isRewardWsCrystal,
        label: "WxS想いの純結晶",
        onClick: () => {
          dispatch.reward.flowers.setIsRewardWsCrystal((state) => !state)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 100,
          purple: 0,
          red: 0,
          white: 0,
        },
      },
      {
        checked: state.reward.flowers.isReward25Crystal,
        label: "25想いの純結晶",
        onClick: () => {
          dispatch.reward.flowers.setIsReward25Crystal((state) => !state)
        },
        required: {
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
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-cyan-700">
        <span className="material-symbols-outlined">local_florist</span>
        フォーチュンフラワー
      </div>

      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>フォーチュンフラワー交換所</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>手に入れたいアイテムにチェックを入れてください</AlertDescription>
            </Alert>

            {items.map(({ checked, label, onClick, required }, index) => (
              <div
                key={index}
                onClick={() => {
                  onClick()
                }}
                className="flex items-center gap-3 hover:cursor-pointer"
              >
                <Checkbox checked={checked} variant="primary" />
                <div>{label}</div>
                <RequiredBadge required={{ wild: 0, ...required }} />
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

      <div className="space-y-2 text-sm">
        {items.filter(({ checked }) => checked).length === 0 && (
          <Alert variant="warning">
            <AlertDescription>報酬が選択されていません</AlertDescription>
          </Alert>
        )}

        {items
          .filter(({ checked }) => checked)
          .map(({ label }, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lime-500">stars</span>
              <div>{label}</div>
            </div>
          ))}
      </div>
    </div>
  )
}

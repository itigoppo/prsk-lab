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
import { Dispatch, SetStateAction, useMemo } from "react"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"

interface PetalsProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export interface Item {
  label: string
  maximum: number
  onClick: (count: number) => void
  required: {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
  }
  selected: number
}

export function Petals({ isOpen, setIsOpen }: PetalsProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const items: Item[] = useMemo(() => {
    return [
      {
        label: "願いの雫*1",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.petals.setNumberOfRewardDroplet(count)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 25,
        },
        selected: state.reward.petals.numberOfRewardDroplet,
      },
      {
        label: "スキルスコア(上級)*1",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.petals.setNumberOfRewardSkill(count)
        },
        required: {
          blue: 25,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
        selected: state.reward.petals.numberOfRewardSkill,
      },
      {
        label: "練習用スコア(上級)*10",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.petals.setNumberOfRewardPractice(count)
        },
        required: {
          blue: 0,
          green: 25,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        },
        selected: state.reward.petals.numberOfRewardPractice,
      },
      {
        label: "クリスタル*200",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.petals.setNumberOfRewardCrystal(count)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 25,
          white: 0,
        },
        selected: state.reward.petals.numberOfRewardCrystal,
      },
      {
        label: "バーチャルコイン*500",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.petals.setNumberOfRewardVirtualCoin(count)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 25,
          purple: 0,
          red: 0,
          white: 0,
        },
        selected: state.reward.petals.numberOfRewardVirtualCoin,
      },
      {
        label: "ライブボーナスドリンク(大)*3",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.petals.setNumberOfRewardDrink(count)
        },
        required: {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 25,
          red: 0,
          white: 0,
        },
        selected: state.reward.petals.numberOfRewardDrink,
      },
    ]
  }, [state, dispatch])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-cyan-700">
        <span className="material-symbols-outlined">nest_eco_leaf</span>
        花びら
      </div>

      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>花びら交換所</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>手に入れたいアイテムにチェックを入れてください</AlertDescription>
            </Alert>
            {items.map(({ label, maximum, onClick, required, selected }, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-1">
                  <div className="border-l-8 border-red-300 pl-2 font-bold">{label}</div>
                  <RequiredBadge required={{ wild: 0, ...required }} />
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

      <div className="space-y-2 text-sm">
        {items.filter(({ selected }) => selected !== 0).length === 0 && (
          <Alert variant="warning">
            <AlertDescription>報酬が選択されていません</AlertDescription>
          </Alert>
        )}

        {items
          .filter(({ selected }) => selected)
          .map(({ label, selected }, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lime-500">stars</span>
              <div>
                {label} ({selected}回交換)
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

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
import { useWorldBloomContext } from "../../_contexts/world-bloom-context"
import { RequiredBadge } from "../required-badge"

interface PiecesProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

export interface Item {
  label: string
  maximum: number
  onClick: (count: number) => void
  required: number
  selected: number
}

export function Pieces({ isOpen, setIsOpen }: PiecesProps) {
  const { dispatch, state } = useWorldBloomContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const items: Item[] = useMemo(() => {
    return [
      {
        label: "[4.5周年記念]★4メンバー確定ガチャチケット*1",
        maximum: 1,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardGachaTicket(count)
        },
        required: 300,
        selected: state.reward.numberOfRewardGachaTicket,
      },
      {
        label: "想いの純結晶*1",
        maximum: 2,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardPureCrystal(count)
        },
        required: 200,
        selected: state.reward.numberOfRewardPureCrystal,
      },
      {
        label: "スキルスコア(上級)*1",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardSkill(count)
        },
        required: 30,
        selected: state.reward.numberOfRewardSkill,
      },
      {
        label: "願いの雫*1",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardDroplet(count)
        },
        required: 30,
        selected: state.reward.numberOfRewardDroplet,
      },
      {
        label: "クリスタル*100",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardCrystal(count)
        },
        required: 10,
        selected: state.reward.numberOfRewardCrystal,
      },
      {
        label: "ライブボーナスドリンク(大)*1",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardDrink(count)
        },
        required: 10,
        selected: state.reward.numberOfRewardDrink,
      },
      {
        label: "バーチャルコイン*300",
        maximum: 5,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardVirtualCoin(count)
        },
        required: 10,
        selected: state.reward.numberOfRewardVirtualCoin,
      },
      {
        label: "練習スコア(上級)*3",
        maximum: 10,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardPractice(count)
        },
        required: 10,
        selected: state.reward.numberOfRewardPractice,
      },
      {
        label: "ミラクルジェム*5",
        maximum: 20,
        onClick: (count: number) => {
          dispatch.reward.setNumberOfRewardMiracleGem(count)
        },
        required: 5,
        selected: state.reward.numberOfRewardMiracleGem,
      },
    ]
  }, [state, dispatch])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-cyan-700">
        <span className="material-symbols-outlined">blur_circular</span>
        ワールドピース
      </div>

      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>ワールドピース交換所</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>手に入れたいアイテムの交換回数にチェック</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertDescription>
                各色ジェム(上限100)及びコイン(上限なし)は必要数ワールドピース1で端数調整用のため入れていません
              </AlertDescription>
            </Alert>
            {items.map(({ label, maximum, onClick, required, selected }, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-1">
                  <div className="border-l-8 border-red-300 pl-2 font-bold">{label}</div>
                  <RequiredBadge
                    required={{
                      wild: required,
                    }}
                  />
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

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { ChangeEvent } from "react"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"

interface FesBonusProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function FesBonus({ isOpen, setIsOpen }: FesBonusProps) {
  const { dispatch, state } = useWorldBloomContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const wild = Math.floor(state.acquisition.fesBonus / 50)

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>ブルフェスガチャボーナス(03/30〜04/04)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>到達したガチャボーナスを入力してください</AlertDescription>
            </Alert>

            <div className="flex gap-x-1 border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
              <div>ガチャボーナス(50毎に100ワールドピース)</div>
              <div>
                <span className="grid size-5 place-items-center rounded-full bg-linear-to-r from-pink-300 to-purple-400 text-[10px] leading-4 font-bold text-white">
                  n
                </span>
              </div>
            </div>

            <div>
              <InputGroup>
                <InputGroupInput
                  id="fes-bonus"
                  name="fes-bonus"
                  placeholder="ガチャボーナスを入力"
                  type="number"
                  min={0}
                  value={state.acquisition.fesBonus}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.currentTarget.value.length > 0 || e.currentTarget.value === "") {
                      dispatch.acquisition.setFesBonus(0)
                    }
                    const parsedValue = parseInt(e.currentTarget.value, 10)
                    if (isNaN(parsedValue)) return
                    dispatch.acquisition.setFesBonus(parsedValue)
                  }}
                />
                <InputGroupAddon align="block-start">
                  <InputGroupText>到達済みガチャボーナス</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {wild > 0 && (
        <div className="mt-4 space-y-2">
          <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              ブルフェスガチャボーナス (<span className="text-pink-600">03/30〜04/04</span>)
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>
            {state.acquisition.fesBonus}ガチャボーナス
          </div>
        </div>
      )}
    </div>
  )
}

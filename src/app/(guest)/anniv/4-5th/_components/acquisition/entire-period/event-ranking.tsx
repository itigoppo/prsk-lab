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
import { eventRankRange } from "../../../_constants/login-schedule"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"
import { RequiredBadge } from "../../required-badge"

interface EventRankingProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function EventRanking({ isOpen, setIsOpen }: EventRankingProps) {
  const { dispatch, state } = useWorldBloomContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const lowerLimit = useMemo(() => {
    return state.acquisition.leoneedEventRank
  }, [state.acquisition.leoneedEventRank])

  const upperLimit = useMemo(() => {
    const index = eventRankRange.findIndex(({ rank }) => rank === lowerLimit)
    return index === 0 ? 1 : eventRankRange[index - 1].rank + 1
  }, [lowerLimit])

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>イベントランキング / L/n箱志歩バナー (03/30〜4/06)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>達成した順位を選択</AlertDescription>
            </Alert>

            <RadioGroup
              value={state.acquisition.leoneedEventRank.toString()}
              onValueChange={(value) => {
                dispatch.acquisition.setLeoneedEventRank(Number(value))
              }}
              className="space-y-2"
              variant="primary"
            >
              {eventRankRange.map(({ pieces, rank }, index) => (
                <RadioGroupItem key={rank} value={rank.toString()}>
                  <div className="flex items-center gap-1">
                    <div>
                      {eventRankRange[index - 1]?.rank ? eventRankRange[index - 1]?.rank + 1 : 1}-
                      {rank !== 0 && `${rank}位`}
                    </div>
                    <RequiredBadge
                      required={{
                        wild: pieces,
                      }}
                    />
                  </div>
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {state.acquisition.leoneedEventRank > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-x-1 border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              イベントランキング / L/n箱志歩バナー(
              <span className="text-pink-600">03/30〜04/06</span>)
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>
            {upperLimit}-{lowerLimit}位
          </div>
        </div>
      )}
    </div>
  )
}

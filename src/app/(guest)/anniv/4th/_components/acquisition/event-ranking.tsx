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
import { eventConfigByTimes, eventRankRange } from "../../_constants/config"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"

interface EventRankingProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  times: number
}

export function EventRanking({ isOpen, setIsOpen, times }: EventRankingProps) {
  const { dispatch, state } = useFortuneFlowerContext()
  const eventConfig = eventConfigByTimes[times]

  const handleClose = () => {
    setIsOpen(false)
  }

  const hasRewards = useMemo(() => {
    switch (times) {
      case 1:
        return state.acquisition.anniversaryEventRank > 0
      case 2:
        return state.acquisition.oclockEventRank > 0
      case 3:
        return state.acquisition.vbsEventRank > 0
      default:
        return false
    }
  }, [
    times,
    state.acquisition.anniversaryEventRank,
    state.acquisition.oclockEventRank,
    state.acquisition.vbsEventRank,
  ])

  const lowerLimit = useMemo(() => {
    switch (times) {
      case 1:
        return state.acquisition.anniversaryEventRank
      case 2:
        return state.acquisition.oclockEventRank
      case 3:
        return state.acquisition.vbsEventRank
      default:
        return 0
    }
  }, [
    times,
    state.acquisition.anniversaryEventRank,
    state.acquisition.oclockEventRank,
    state.acquisition.vbsEventRank,
  ])

  const upperLimit = useMemo(() => {
    const index = eventRankRange.findIndex(({ rank }) => rank === lowerLimit)
    return index === 0 ? 1 : eventRankRange[index - 1].rank + 1
  }, [lowerLimit])

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>
              イベントランキング / {eventConfig.name} (
              {eventConfig.dateStrikethrough && (
                <span className="line-through">{eventConfig.dateStrikethrough}</span>
              )}
              {eventConfig.date})
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>達成した順位を選択</AlertDescription>
            </Alert>

            <RadioGroup
              value={
                times === 1
                  ? state.acquisition.anniversaryEventRank.toString()
                  : times === 2
                    ? state.acquisition.oclockEventRank.toString()
                    : state.acquisition.vbsEventRank.toString()
              }
              onValueChange={(value) => {
                if (times === 1) {
                  dispatch.acquisition.setAnniversaryEventRank(Number(value))
                }
                if (times === 2) {
                  dispatch.acquisition.setOclockEventRank(Number(value))
                }
                if (times === 3) {
                  dispatch.acquisition.setVbsEventRank(Number(value))
                }
              }}
              className="space-y-2"
              variant="primary"
            >
              {eventRankRange.map(({ petals, rank }, index) => (
                <RadioGroupItem key={rank} value={rank.toString()}>
                  <div className="flex items-center gap-1">
                    <div>
                      {eventRankRange[index - 1]?.rank ? eventRankRange[index - 1]?.rank + 1 : 1}-
                      {rank !== 0 && `${rank}位`}
                    </div>
                    <RequiredBadge
                      required={{
                        blue: times === 3 ? petals : 0,
                        green: times === 1 ? petals : 0,
                        orange: times === 2 ? petals : 0,
                        purple: times === 2 ? petals : 0,
                        red: times === 1 ? petals : 0,
                        white: times === 3 ? petals : 0,
                        wild: 0,
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

      {hasRewards && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-x-1 border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              イベントランキング / {eventConfig.name}(
              <span className="text-pink-600">
                {eventConfig.dateStrikethrough && (
                  <span className="line-through">{eventConfig.dateStrikethrough}</span>
                )}
                {eventConfig.date}
              </span>
              )
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

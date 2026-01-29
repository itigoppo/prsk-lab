"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCallback, useMemo } from "react"
import { CAMPAIGN_PERIOD, REQUIRED_STAMP_CARDS } from "../../../_constants/config"
import { stampCategories } from "../../../_constants/stamp-categories"
import { StampLevel1, StampLevel2, StampType } from "../../../_constants/stamps"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"
import { RequiredBadge } from "../../required-badge"
import { StampCard } from "./stamp-card"
import { StampCardConfirm } from "./stamp-card-confirm"
import { getSelectedStampKey, getSetSelectedStampKey } from "./stamp-helpers"

interface StampMissionProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function StampMission({ isOpen, setIsOpen }: StampMissionProps) {
  const { dispatch, state } = useWorldBloomContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const selectedStamps = useMemo(() => {
    return [
      state.acquisition.stamp.selectedStampLiveBonus,
      state.acquisition.stamp.selectedStampMusic,
      state.acquisition.stamp.selectedStampLive,
      state.acquisition.stamp.selectedStampEvent,
      state.acquisition.stamp.selectedStampMoney,
    ].filter((stamp) => stamp)
  }, [
    state.acquisition.stamp.selectedStampLiveBonus,
    state.acquisition.stamp.selectedStampMusic,
    state.acquisition.stamp.selectedStampLive,
    state.acquisition.stamp.selectedStampEvent,
    state.acquisition.stamp.selectedStampMoney,
  ])

  const toggleStamp = useCallback(
    (type: StampType, level: StampLevel1 | StampLevel2) => {
      const selectedStampKey = getSelectedStampKey(type)
      const setSelectedStampKey = getSetSelectedStampKey(type)

      const currentValue = state.acquisition.stamp[selectedStampKey]
      const setter = dispatch.acquisition.stamp[setSelectedStampKey] as (
        value: StampLevel1 | StampLevel2
      ) => void

      if (currentValue === level) {
        setter(null)
      } else {
        setter(level)
      }
    },
    [state, dispatch]
  )

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>スタンプミッション ({CAMPAIGN_PERIOD})</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>挑戦したいカードを選択</AlertDescription>
            </Alert>

            <div>
              {stampCategories.map(({ children, name, type }, index) => {
                const selectedStampKey = getSelectedStampKey(type)
                const currentSelected = state.acquisition.stamp[selectedStampKey]

                return (
                  <Collapsible key={index} defaultOpen={index === 0}>
                    <CollapsibleTrigger className="border-b-2 border-slate-500 bg-slate-100 px-6 py-4 font-bold">
                      {name}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="py-4">
                      <div className="space-y-2">
                        {children.map(({ level, name: cardName, stamp }, index2) => {
                          const isChecked = currentSelected === level

                          return (
                            <div
                              key={index2}
                              onClick={() => toggleStamp(type, level)}
                              className="hover:cursor-pointer"
                            >
                              <div className="flex items-center gap-1">
                                <Checkbox checked={isChecked} variant="primary" />
                                <div>{cardName}</div>
                                <RequiredBadge
                                  required={{
                                    wild: stamp.complete,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <StampCard type={type} />
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4 space-y-2">
        <div className="flex gap-x-1 border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
          <div>
            スタンプミッション(
            <span className="text-pink-600">{CAMPAIGN_PERIOD}</span>)
          </div>
        </div>

        {selectedStamps.length < REQUIRED_STAMP_CARDS && (
          <Alert variant="destructive">
            <AlertDescription>
              カード選択数が足りないYo!!! (
              <span className="font-bold">
                {selectedStamps.length} / {REQUIRED_STAMP_CARDS}
              </span>
              枚)
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <StampCardConfirm type="liveBonus" />
          <StampCardConfirm type="music" />
          <StampCardConfirm type="live" />
          <StampCardConfirm type="event" />
          <StampCardConfirm type="money" />
        </div>
      </div>
    </div>
  )
}

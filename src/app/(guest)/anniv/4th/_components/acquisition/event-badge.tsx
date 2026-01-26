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
import { eventConfigByTimes } from "../../_constants/config"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"

interface EventBadgeProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  times: number
}

type BadgeColor = "white" | "blue" | "green" | "red" | "orange" | "purple"

interface BadgeConfigItem {
  color: BadgeColor
  getValue: (state: ReturnType<typeof useFortuneFlowerContext>["state"]) => number
  label: string
  setValue: (
    dispatch: ReturnType<typeof useFortuneFlowerContext>["dispatch"],
    value: number
  ) => void
}

const badgeConfigByTimes: Record<number, BadgeConfigItem[]> = {
  1: [
    {
      color: "green",
      getValue: (state) => state.acquisition.numberOfEventBadgeGreen,
      label: "緑色の花びら",
      setValue: (dispatch, value) => dispatch.acquisition.setNumberOfEventBadgeGreen(value),
    },
    {
      color: "red",
      getValue: (state) => state.acquisition.numberOfEventBadgeRed,
      label: "赤色の花びら",
      setValue: (dispatch, value) => dispatch.acquisition.setNumberOfEventBadgeRed(value),
    },
  ],
  2: [
    {
      color: "orange",
      getValue: (state) => state.acquisition.numberOfEventBadgeOrange,
      label: "橙色の花びら",
      setValue: (dispatch, value) => dispatch.acquisition.setNumberOfEventBadgeOrange(value),
    },
    {
      color: "purple",
      getValue: (state) => state.acquisition.numberOfEventBadgePurple,
      label: "紫色の花びら",
      setValue: (dispatch, value) => dispatch.acquisition.setNumberOfEventBadgePurple(value),
    },
  ],
  3: [
    {
      color: "white",
      getValue: (state) => state.acquisition.numberOfEventBadgeWhite,
      label: "白色の花びら",
      setValue: (dispatch, value) => dispatch.acquisition.setNumberOfEventBadgeWhite(value),
    },
    {
      color: "blue",
      getValue: (state) => state.acquisition.numberOfEventBadgeBlue,
      label: "青色の花びら",
      setValue: (dispatch, value) => dispatch.acquisition.setNumberOfEventBadgeBlue(value),
    },
  ],
}

export function EventBadge({ isOpen, setIsOpen, times }: EventBadgeProps) {
  const { dispatch, state } = useFortuneFlowerContext()
  const badgeConfig = badgeConfigByTimes[times] || []
  const eventConfig = eventConfigByTimes[times]

  const handleClose = () => {
    setIsOpen(false)
  }

  const hasRewards = useMemo(() => {
    switch (times) {
      case 1:
        return (
          state.acquisition.numberOfEventBadgeGreen > 0 ||
          state.acquisition.numberOfEventBadgeRed > 0
        )
      case 2:
        return (
          state.acquisition.numberOfEventBadgeOrange > 0 ||
          state.acquisition.numberOfEventBadgePurple > 0
        )
      case 3:
        return (
          state.acquisition.numberOfEventBadgeWhite > 0 ||
          state.acquisition.numberOfEventBadgeBlue > 0
        )
      default:
        return false
    }
  }, [
    times,
    state.acquisition.numberOfEventBadgeWhite,
    state.acquisition.numberOfEventBadgeBlue,
    state.acquisition.numberOfEventBadgeGreen,
    state.acquisition.numberOfEventBadgeRed,
    state.acquisition.numberOfEventBadgeOrange,
    state.acquisition.numberOfEventBadgePurple,
  ])

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>
              イベント交換所 / {eventConfig.name} (
              {eventConfig.dateStrikethrough && (
                <span className="line-through">{eventConfig.dateStrikethrough}</span>
              )}
              {eventConfig.date})
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>手に入れたいアイテムの交換回数にチェック</AlertDescription>
            </Alert>

            {badgeConfig.map(({ color, getValue, label, setValue }) => (
              <div key={color} className="space-y-2">
                <div className="flex items-center gap-1">
                  <div className="border-l-8 border-red-300 pl-2 font-bold">{label}</div>
                  <RequiredBadge
                    required={{
                      blue: color === "blue" ? 5 : 0,
                      green: color === "green" ? 5 : 0,
                      orange: color === "orange" ? 5 : 0,
                      purple: color === "purple" ? 5 : 0,
                      red: color === "red" ? 5 : 0,
                      white: color === "white" ? 5 : 0,
                      wild: 0,
                    }}
                  />
                </div>
                <RadioGroup
                  value={getValue(state).toString()}
                  onValueChange={(value) => setValue(dispatch, Number(value))}
                  className="grid grid-cols-3 gap-2"
                  variant="primary"
                >
                  {Array.from({ length: 11 }, (_, index) => (
                    <RadioGroupItem key={index} value={index.toString()}>
                      {index}回交換
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

      {hasRewards && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-x-1 border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              イベント交換所 / {eventConfig.name}(
              <span className="text-pink-600">
                {eventConfig.dateStrikethrough && (
                  <span className="line-through">{eventConfig.dateStrikethrough}</span>
                )}
                {eventConfig.date}
              </span>
              )
            </div>
          </div>
          {badgeConfig
            .filter(({ getValue }) => getValue(state) > 0)
            .map(({ color, getValue, label }) => (
              <div className="flex items-center gap-1" key={color}>
                <span className="material-symbols-outlined text-lime-500">stars</span>
                {label} ({getValue(state)}回交換)
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

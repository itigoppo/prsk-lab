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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils/common"
import { ChangeEvent, useEffect, useState } from "react"
import {
  liveMissionSchedule,
  premiumLiveMissionSchedule,
} from "../../../_constants/live-mission-schedule"
import { useFortuneFlowerContext } from "../../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../../required-badge"

interface LiveMissionProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function LiveMission({ isOpen, setIsOpen }: LiveMissionProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const [isComplete, setIsComplete] = useState<boolean>(false)

  useEffect(() => {
    setIsComplete(state.acquisition.liveMission >= 20000)
  }, [state.acquisition.liveMission])

  const [expanded, setExpanded] = useState<boolean>(false)

  const points = [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700,
    1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300,
    3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900,
    5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400, 6500,
    6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300, 7400, 7500, 7600, 7700, 7800, 7900, 8000, 8100,
    8200, 8300, 8400, 8500, 8600, 8700, 8800, 8900, 9000, 9100, 9200, 9300, 9400, 9500, 9600, 9700,
    9800, 9900, 10000, 10250, 10500, 10750, 11000, 11250, 11500, 11750, 12000, 12250, 12500, 12750,
    13000, 13250, 13500, 13750, 14000, 14250, 14500, 14750, 15000, 15500, 16000, 16500, 17000,
    17500, 18000, 18500, 19000, 19500, 20000,
  ]

  const getLiveMission = (
    point: number
  ): {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
  } => {
    const liveMission = liveMissionSchedule.filter((schedule) => schedule.point === point)
    return liveMission.length !== 0
      ? {
          blue: liveMission[0].blue,
          green: liveMission[0].green,
          orange: liveMission[0].orange,
          purple: liveMission[0].purple,
          red: liveMission[0].red,
          white: liveMission[0].white,
        }
      : {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        }
  }

  const getPremiumLiveMission = (
    point: number
  ): {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
  } => {
    const liveMission = premiumLiveMissionSchedule.filter((schedule) => schedule.point === point)
    return liveMission.length !== 0
      ? {
          blue: liveMission[0].blue,
          green: liveMission[0].green,
          orange: liveMission[0].orange,
          purple: liveMission[0].purple,
          red: liveMission[0].red,
          white: liveMission[0].white,
        }
      : {
          blue: 0,
          green: 0,
          orange: 0,
          purple: 0,
          red: 0,
          white: 0,
        }
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
        ライブミッション(<span className="text-pink-600">〜10/31</span>)
      </div>

      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>ライブミッション(〜10/31)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>獲得したライブPを入力してください(最大20000)</AlertDescription>
            </Alert>

            <div
              onClick={() => {
                setIsComplete((state) => !state)
                if (isComplete) {
                  dispatch.acquisition.setLiveMission(0)
                } else {
                  dispatch.acquisition.setLiveMission(20000)
                }
              }}
              className="flex items-center gap-3 hover:cursor-pointer"
            >
              <Checkbox checked={isComplete} variant="primary" />
              <div>コンプリート</div>
              <RequiredBadge
                required={{
                  blue: liveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.blue
                  }, 0),
                  green: liveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.green
                  }, 0),
                  orange: liveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.orange
                  }, 0),
                  purple: liveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.purple
                  }, 0),
                  red: liveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.red
                  }, 0),
                  white: liveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.white
                  }, 0),
                  wild: 0,
                }}
              />
            </div>

            <div
              onClick={() => {
                dispatch.acquisition.setIsPremiumLiveMission((state) => !state)
              }}
              className="flex items-center gap-3 hover:cursor-pointer"
            >
              <Checkbox checked={state.acquisition.isPremiumLiveMission} variant="primary" />
              <div>プレパス加入済み</div>
              <RequiredBadge
                required={{
                  blue: premiumLiveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.blue
                  }, 0),
                  green: premiumLiveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.green
                  }, 0),
                  orange: premiumLiveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.orange
                  }, 0),
                  purple: premiumLiveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.purple
                  }, 0),
                  red: premiumLiveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.red
                  }, 0),
                  white: premiumLiveMissionSchedule.reduce(function (acc, obj) {
                    return acc + obj.white
                  }, 0),
                  wild: 0,
                }}
              />
            </div>

            <div>
              <InputGroup>
                <InputGroupInput
                  id="live-mission-point"
                  name="live-mission-point"
                  placeholder="ライブPを入力"
                  type="number"
                  min={0}
                  max={20000}
                  value={state.acquisition.liveMission}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.currentTarget.value.length > 0 || e.currentTarget.value === "") {
                      dispatch.acquisition.setLiveMission(0)
                    }
                    const parsedValue = parseInt(e.currentTarget.value, 10)
                    if (isNaN(parsedValue)) return
                    dispatch.acquisition.setLiveMission(parsedValue)

                    if (parsedValue >= 20000) {
                      setIsComplete(true)
                    } else {
                      setIsComplete(false)
                    }
                  }}
                />
                <InputGroupAddon align="block-start">
                  <InputGroupText>到達済みライブP(max:20,000)</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupText>pt</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  setExpanded((prev) => !prev)
                }}
                outline={!expanded}
              >
                達成状況を見る
                <span className="material-symbols-outlined">
                  {expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                </span>
              </Button>

              <div className={cn("grid grid-cols-2 gap-2", !expanded && "hidden")}>
                {points
                  .filter((point) => {
                    return (
                      liveMissionSchedule.filter((schedule) => schedule.point === point).length !==
                        0 ||
                      (state.acquisition.isPremiumLiveMission &&
                        premiumLiveMissionSchedule.filter((schedule) => schedule.point === point)
                          .length !== 0)
                    )
                  })
                  .map((point) => (
                    <div key={point}>
                      <div className="flex items-center gap-1">
                        <Checkbox checked={state.acquisition.liveMission >= point} disabled />
                        <div>{point}</div>
                        <RequiredBadge
                          required={{
                            blue:
                              getLiveMission(point).blue +
                              (state.acquisition.isPremiumLiveMission
                                ? getPremiumLiveMission(point).blue
                                : 0),
                            green:
                              getLiveMission(point).green +
                              (state.acquisition.isPremiumLiveMission
                                ? getPremiumLiveMission(point).green
                                : 0),
                            orange:
                              getLiveMission(point).orange +
                              (state.acquisition.isPremiumLiveMission
                                ? getPremiumLiveMission(point).orange
                                : 0),
                            purple:
                              getLiveMission(point).purple +
                              (state.acquisition.isPremiumLiveMission
                                ? getPremiumLiveMission(point).purple
                                : 0),
                            red:
                              getLiveMission(point).red +
                              (state.acquisition.isPremiumLiveMission
                                ? getPremiumLiveMission(point).red
                                : 0),
                            white:
                              getLiveMission(point).white +
                              (state.acquisition.isPremiumLiveMission
                                ? getPremiumLiveMission(point).white
                                : 0),
                            wild: 0,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-sm">
        {state.acquisition.liveMission === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>ライブ1回もしてないことになってるYo!!!</AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>

            <div>
              {state.acquisition.liveMission}pt獲得
              {state.acquisition.isPremiumLiveMission && <span>(プレパス加入済み)</span>}
              {state.acquisition.liveMission >= 20000 && (
                <span className="text-pink-500">[コンプリート！]</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

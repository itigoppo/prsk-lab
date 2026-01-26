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
import { fortuneFlowerConfigByTimes } from "../../_constants/config"
import {
  shopCardConfig,
  stampCategories,
  StampCategory,
  StampType,
} from "../../_constants/stamp-categories"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"
import { StampCard } from "./stamp-card"
import { StampCardConfirm } from "./stamp-card-confirm"

interface StampMissionProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  times: number
}

export function StampMission({ isOpen, setIsOpen, times }: StampMissionProps) {
  const { dispatch, state } = useFortuneFlowerContext()
  const stampMissionConfig = fortuneFlowerConfigByTimes[times]

  const handleClose = () => {
    setIsOpen(false)
  }

  const stampByTimes: StampType = times === 1 ? "bloom" : times === 2 ? "connect" : "cheer"
  const stamp = state.acquisition.stamp[stampByTimes]

  const isSelectedShop = "isStampShop" in stamp && stamp.isStampShop

  const selectedCount = useMemo(() => {
    const count = [
      stamp.selectedStampIroiro,
      stamp.selectedStampLive,
      stamp.selectedStampKizuna,
      stamp.selectedStampLogin,
      stamp.selectedStampGachi,
    ].filter((s) => s).length

    return count + (isSelectedShop ? 1 : 0)
  }, [stamp, isSelectedShop])

  const requiredCount = times === 1 ? 4 : 3

  const toggleStamp = useCallback(
    (stampType: StampType, category: StampCategory, level: string) => {
      const stampState = state.acquisition.stamp[stampType]
      const stampDispatch = dispatch.acquisition.stamp[stampType]
      const getterKey = `selectedStamp${category}` as keyof typeof stampState
      const setterKey = `setSelectedStamp${category}` as keyof typeof stampDispatch

      const currentValue = stampState[getterKey]
      const setter = stampDispatch[setterKey] as (value: string | null) => void

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
            <DialogTitle>
              スタンプミッション / {stampMissionConfig.name} ({stampMissionConfig.dateStart}
              {stampMissionConfig.dateStrikethrough && (
                <span className="line-through">{stampMissionConfig.dateStrikethrough}</span>
              )}
              {stampMissionConfig.dateEnd})
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>挑戦したいカードを選択</AlertDescription>
            </Alert>

            <div>
              {[
                ...stampCategories.map(({ category, children, name, stampCardType }) => ({
                  category,
                  children,
                  name,
                  stampCard: <StampCard times={times} type={stampCardType} />,
                })),
                {
                  children: undefined,
                  isChecked: state.acquisition.stamp.bloom.isStampShop,
                  isSkip: times !== shopCardConfig.timesOnly,
                  name: shopCardConfig.name,
                  selected: () => {
                    dispatch.acquisition.stamp.bloom.setIsStampShop((s) => !s)
                  },
                  stampCard: <></>,
                },
              ]
                .filter((item) => !("isSkip" in item && item.isSkip))
                .map((item, index) => {
                  const { children, name, stampCard } = item
                  const isChecked = "isChecked" in item ? item.isChecked : false
                  const selected = "selected" in item ? item.selected : undefined

                  return (
                    <Collapsible key={index} defaultOpen={index === 0}>
                      <CollapsibleTrigger className="border-b-2 border-slate-500 bg-slate-100 px-6 py-4 font-bold">
                        {name}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="py-4">
                        {!children && selected && (
                          <>
                            <div
                              onClick={() => {
                                selected()
                              }}
                              className="hover:cursor-pointer"
                            >
                              <div className="flex items-center gap-1">
                                <Checkbox checked={isChecked} variant="primary" />
                                <div>
                                  {name} <span>※花びらの獲得はありません</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {children && (
                          <div className="space-y-2">
                            {children
                              .filter(({ times: cardTimes }) => cardTimes === times)
                              .map(
                                ({ category, level, name: cardName, stamp, stampType }, index2) => {
                                  const stampState = state.acquisition.stamp[stampType]
                                  const getterKey =
                                    `selectedStamp${category}` as keyof typeof stampState
                                  const isChecked = stampState[getterKey] === level
                                  const totalPetals =
                                    stamp.missions.reduce((acc, obj) => acc + obj.petals, 0) +
                                    stamp.complete
                                  const colorKey = level.replace(/(regular|unlimited|casual)$/, "")

                                  return (
                                    <div
                                      key={index2}
                                      onClick={() => toggleStamp(stampType, category, level)}
                                      className="hover:cursor-pointer"
                                    >
                                      <div className="flex items-center gap-1">
                                        <Checkbox checked={isChecked} variant="primary" />
                                        <div>{cardName}</div>
                                        <RequiredBadge
                                          required={{
                                            blue: colorKey === "blue" ? totalPetals : 0,
                                            green: colorKey === "green" ? totalPetals : 0,
                                            orange: colorKey === "orange" ? totalPetals : 0,
                                            purple: colorKey === "purple" ? totalPetals : 0,
                                            red: colorKey === "red" ? totalPetals : 0,
                                            white: colorKey === "white" ? totalPetals : 0,
                                            wild: 0,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                          </div>
                        )}
                        {stampCard}
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
            スタンプミッション / {stampMissionConfig.name}(
            <span className="text-pink-600">
              {stampMissionConfig.dateStart}
              {stampMissionConfig.dateStrikethrough && (
                <span className="line-through">{stampMissionConfig.dateStrikethrough}</span>
              )}
              {stampMissionConfig.dateEnd}
            </span>
            )
          </div>
        </div>

        {selectedCount < requiredCount && (
          <Alert variant="destructive">
            <AlertDescription>
              カード選択数が足りないYo!!! (
              <span className="font-bold">
                {selectedCount} / {requiredCount}
              </span>
              枚)
            </AlertDescription>
          </Alert>
        )}
        {selectedCount > requiredCount && (
          <Alert variant="destructive">
            <AlertDescription>
              カード選択数が多いYo!!! (
              <span className="font-bold">
                {selectedCount} / {requiredCount}
              </span>
              枚)
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <StampCardConfirm times={times} type="iroiro" />
          <StampCardConfirm times={times} type="gachi" />
          <StampCardConfirm times={times} type="live" />
          <StampCardConfirm times={times} type="kizuna" />
          <StampCardConfirm times={times} type="login" />
          {isSelectedShop && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lime-500">stars</span>
              ブルー ショップカード
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

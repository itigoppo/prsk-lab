"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils/common"
import { useEffect, useMemo, useState } from "react"
import { Stamp } from "../../_constants/stamps"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../required-badge"
import {
  buildLabel,
  CardType,
  createColorRequired,
  extractColorFromLevel,
  getSelectedStampKey,
  getSetStampKey,
  getStampFromTypeAndLevel,
  getStampKey,
  getStampType,
} from "./stamp-helpers"

interface StampCardProps {
  times: number
  type: CardType
}

export function StampCard({ times, type }: StampCardProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const [isComplete, setIsComplete] = useState<boolean>(false)

  const stampType = getStampType(times)
  const selectedStampKey = getSelectedStampKey(type)
  const stampKey = getStampKey(type)
  const setStampKey = getSetStampKey(type)

  const selectedLevel = state.acquisition.stamp[stampType][selectedStampKey] as string | null

  const stamp: Stamp | null = useMemo(() => {
    return getStampFromTypeAndLevel(type, selectedLevel)
  }, [type, selectedLevel])

  const color = useMemo(() => {
    return extractColorFromLevel(selectedLevel)
  }, [selectedLevel])

  const completeRequired = useMemo(() => {
    if (!stamp) {
      return createColorRequired(null, 0)
    }
    const count = stamp.missions.reduce((acc, obj) => acc + obj.petals, 0) + stamp.complete
    return createColorRequired(color, count)
  }, [stamp, color])

  const label = useMemo(() => {
    return buildLabel(selectedLevel, color, type)
  }, [selectedLevel, color, type])

  const currentSelected: number[] = useMemo(() => {
    return state.acquisition.stamp[stampType][stampKey] ?? []
  }, [stampType, stampKey, state])

  useEffect(() => {
    const checked = stamp?.missions.filter((_, index) => currentSelected.includes(index))
    setIsComplete(checked?.length === stamp?.missions.length)
  }, [currentSelected, stamp?.missions])

  const setStampValues = (values: number[]) => {
    const setter = dispatch.acquisition.stamp[stampType][setStampKey] as (values: number[]) => void
    setter(values)
  }

  const onClickComplete = () => {
    if (!stamp) return
    setIsComplete((s) => !s)
    const newValues = isComplete ? [] : stamp.missions.map((_, index) => index)
    setStampValues(newValues)
  }

  const onClick = (index: number) => {
    if (!stamp) return

    if (currentSelected.includes(index)) {
      const newValues = currentSelected.filter((item) => item !== index)
      setStampValues(newValues)
      setIsComplete(false)
    } else {
      const uniqueIndexes = [...new Set([...currentSelected, index])]
      setStampValues(uniqueIndexes)
      const checked = stamp.missions.filter((_, i) => uniqueIndexes.includes(i))
      setIsComplete(checked.length === stamp.missions.length)
    }
  }

  return (
    <>
      {stamp && (
        <div className="mt-4 space-y-2">
          <div className="border-l-8 border-red-300 pl-2 font-bold">{label}のミッション</div>
          <Alert variant="info">
            <AlertDescription>達成したミッションを選択</AlertDescription>
          </Alert>

          <div
            onClick={() => {
              onClickComplete()
            }}
            className="hover:cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <Checkbox checked={isComplete} variant="primary" />
              <div className="font-bold text-pink-600">コンプリート</div>
              <RequiredBadge required={completeRequired} />
            </div>
          </div>

          <div
            className={cn(
              (type === "login" || type === "kizuna") && "grid grid-cols-2 gap-2",
              "space-y-2 border-t border-gray-500 pt-3"
            )}
          >
            {stamp.missions.map((mission, index) => (
              <div
                key={index}
                onClick={() => {
                  onClick(index)
                }}
                className="hover:cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Checkbox checked={currentSelected.includes(index)} variant="primary" />
                  <div>{mission.substitute ?? mission.mission}</div>
                  <RequiredBadge required={createColorRequired(color, mission.petals)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

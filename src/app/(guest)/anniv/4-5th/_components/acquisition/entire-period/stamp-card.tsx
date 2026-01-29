"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useMemo, useState } from "react"
import { Stamp, StampType } from "../../../_constants/stamps"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"
import { RequiredBadge } from "../../required-badge"
import {
  buildLabel,
  getSelectedStampKey,
  getSetStampKey,
  getStampFromTypeAndLevel,
  getStampKey,
} from "./stamp-helpers"

interface StampCardProps {
  type: StampType
}

export function StampCard({ type }: StampCardProps) {
  const { dispatch, state } = useWorldBloomContext()

  const [isComplete, setIsComplete] = useState<boolean>(false)

  const selectedStampKey = getSelectedStampKey(type)
  const stampKey = getStampKey(type)
  const setStampKey = getSetStampKey(type)

  const selectedLevel = state.acquisition.stamp[selectedStampKey] as string | null

  const stamp: Stamp | null = useMemo(() => {
    return getStampFromTypeAndLevel(type, selectedLevel)
  }, [type, selectedLevel])

  const label = useMemo(() => {
    return buildLabel(selectedLevel, type)
  }, [selectedLevel, type])

  const currentSelected: number[] = useMemo(() => {
    return state.acquisition.stamp[stampKey] ?? []
  }, [stampKey, state])

  useEffect(() => {
    const checked = stamp?.missions.filter((_, index) => currentSelected.includes(index))
    setIsComplete(checked?.length === stamp?.missions.length)
  }, [currentSelected, stamp?.missions])

  const setStampValues = (values: number[]) => {
    const setter = dispatch.acquisition.stamp[setStampKey] as (values: number[]) => void
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

          <div onClick={() => onClickComplete()} className="hover:cursor-pointer">
            <div className="flex items-center gap-1">
              <Checkbox checked={isComplete} variant="primary" />
              <div className="font-bold text-pink-600">コンプリート</div>
              <RequiredBadge
                required={{
                  wild: stamp.complete,
                }}
              />
            </div>
          </div>

          <div className="border-t border-gray-500 pt-3">
            {stamp.missions.map((mission, index) => (
              <div key={index} onClick={() => onClick(index)} className="hover:cursor-pointer">
                <div className="flex items-center gap-1">
                  <Checkbox checked={currentSelected.includes(index)} variant="primary" />
                  <div className="mt-1">{mission.substitute ?? mission.mission}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

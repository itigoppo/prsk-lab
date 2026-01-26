"use client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils/common"
import { useMemo } from "react"
import { Stamp } from "../../_constants/stamps"
import { useFortuneFlowerContext } from "../../_contexts/fortune-flower-context"
import {
  buildLabel,
  CardType,
  extractColorFromLevel,
  getSelectedStampKey,
  getStampFromTypeAndLevel,
  getStampKey,
  getStampType,
} from "./stamp-helpers"

interface StampCardConfirmProps {
  times: number
  type: CardType
}

export function StampCardConfirm({ times, type }: StampCardConfirmProps) {
  const { state } = useFortuneFlowerContext()

  const stampType = getStampType(times)
  const selectedStampKey = getSelectedStampKey(type)
  const stampKey = getStampKey(type)

  const selectedLevel = state.acquisition.stamp[stampType][selectedStampKey] as string | null

  const stamp: Stamp | null = useMemo(() => {
    return getStampFromTypeAndLevel(type, selectedLevel)
  }, [type, selectedLevel])

  const color = useMemo(() => {
    return extractColorFromLevel(selectedLevel)
  }, [selectedLevel])

  const label = useMemo(() => {
    return buildLabel(selectedLevel, color, type)
  }, [selectedLevel, color, type])

  const isSelected = !!selectedLevel

  const currentSelected: number[] = useMemo(() => {
    return state.acquisition.stamp[stampType][stampKey] ?? []
  }, [stampType, stampKey, state])

  const selectedMissions = useMemo(() => {
    return stamp?.missions.filter((__val, index) => currentSelected.includes(index))
  }, [currentSelected, stamp?.missions])

  return (
    <>
      {isSelected && (
        <>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>
            {label}({selectedMissions?.length}/{stamp?.missions.length}達成)
          </div>

          {(!selectedMissions || selectedMissions.length === 0) && (
            <Alert variant="destructive">
              <AlertDescription>ミッション1つも達成してないことになってるYo!!!</AlertDescription>
            </Alert>
          )}

          {selectedMissions && (
            <div
              className={cn(
                "pl-6 md:grid md:grid-cols-2 md:gap-2",
                (type === "login" || type === "kizuna") && "grid grid-cols-2 gap-2"
              )}
            >
              {selectedMissions.map((mission, index) => (
                <div key={index}>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lime-500">check</span>
                    <div>{mission.substitute ?? mission.mission}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

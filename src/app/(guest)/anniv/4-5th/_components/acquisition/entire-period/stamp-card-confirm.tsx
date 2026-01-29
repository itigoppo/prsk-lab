"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMemo } from "react"
import { Stamp, StampType } from "../../../_constants/stamps"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"
import {
  buildLabel,
  getSelectedStampKey,
  getStampFromTypeAndLevel,
  getStampKey,
} from "./stamp-helpers"

interface StampCardConfirmProps {
  type: StampType
}

export function StampCardConfirm({ type }: StampCardConfirmProps) {
  const { state } = useWorldBloomContext()

  const selectedStampKey = getSelectedStampKey(type)
  const stampKey = getStampKey(type)

  const selectedLevel = state.acquisition.stamp[selectedStampKey] as string | null

  const stamp: Stamp | null = useMemo(() => {
    return getStampFromTypeAndLevel(type, selectedLevel)
  }, [type, selectedLevel])

  const label = useMemo(() => {
    return buildLabel(selectedLevel, type)
  }, [selectedLevel, type])

  const isSelected = !!selectedLevel

  const currentSelected: number[] = useMemo(() => {
    return state.acquisition.stamp[stampKey] ?? []
  }, [stampKey, state])

  const selectedMissions = useMemo(() => {
    return stamp?.missions.filter((_, index) => currentSelected.includes(index))
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
            <div className="pl-6 md:grid md:grid-cols-2 md:gap-2">
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

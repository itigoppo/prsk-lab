"use client"

import { cn } from "@/lib/utils/common"
import { useEffect, useMemo, useState } from "react"

export type CharacterInfo = {
  bgColor: string
  color: string
  id: string
  short: string
}

export interface CharacterUnitSelectorProps {
  charactersByUnit: Map<string, CharacterInfo[]>
  disabled?: boolean
  maxLimit: number
  onToggle: (characterId: string) => void
  selectedCharacters: string[]
}

export function CharacterUnitSelector({
  charactersByUnit,
  disabled,
  maxLimit,
  onToggle,
  selectedCharacters,
}: CharacterUnitSelectorProps) {
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)

  const selectedUnitName = useMemo(() => {
    if (selectedCharacters.length === 0) return null
    for (const [unitName, chars] of charactersByUnit.entries()) {
      if (chars.some((c) => selectedCharacters.includes(c.id))) {
        return unitName
      }
    }
    return null
  }, [selectedCharacters, charactersByUnit])

  // 選択中のユニットがある場合は expandedUnit にも同期しておくことで、
  // 最後のメンバーの選択を解除した際にもユニット一覧へ戻らずに現在のユニット表示を維持する
  useEffect(() => {
    if (selectedUnitName) {
      setExpandedUnit(selectedUnitName)
    }
  }, [selectedUnitName])

  const displayUnit = selectedUnitName ?? expandedUnit

  return (
    <div className="space-y-2">
      {displayUnit === null ? (
        <div className="flex flex-wrap gap-2">
          {Array.from(charactersByUnit.keys()).map((unitName) => (
            <button
              key={unitName}
              type="button"
              onClick={() => setExpandedUnit(unitName)}
              className="cursor-pointer rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50"
              disabled={disabled}
            >
              {unitName}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-bold text-teal-600">{displayUnit}</div>
            {selectedUnitName === null && (
              <button
                type="button"
                onClick={() => setExpandedUnit(null)}
                className="cursor-pointer text-xs text-slate-400 underline hover:text-slate-600"
                disabled={disabled}
              >
                ユニットを選び直す
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {charactersByUnit.get(displayUnit)?.map((char) => {
              const isSelected = selectedCharacters.includes(char.id)
              const isDisabled = disabled || (!isSelected && selectedCharacters.length >= maxLimit)
              return (
                <button
                  key={char.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onToggle(char.id)}
                  className={cn(
                    "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors",
                    !isSelected &&
                      (isDisabled
                        ? "cursor-not-allowed opacity-30"
                        : "opacity-70 hover:opacity-100")
                  )}
                  style={{
                    backgroundColor: isSelected ? char.bgColor : `${char.bgColor}40`,
                    color: char.color,
                  }}
                >
                  {char.short}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useGetApiAdminFurnitureCharacters } from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { cn } from "@/lib/utils/common"
import { useCallback, useMemo } from "react"

type CharacterInfo = {
  bgColor: string
  color: string
  id: string
  short: string
}

interface ExcludedCombinationFieldsProps {
  combinations: string[][]
  onChange: (combinations: string[][]) => void
}

export function ExcludedCombinationFields({
  combinations,
  onChange,
}: ExcludedCombinationFieldsProps) {
  const { data: charactersData } = useGetApiAdminFurnitureCharacters()
  const characters = useMemo(() => charactersData?.data?.characters ?? [], [charactersData])

  const charactersByUnit = useMemo(() => {
    const map = new Map<string, CharacterInfo[]>()
    for (const char of characters) {
      const unitName = char.unit?.name ?? "その他"
      const list = map.get(unitName) ?? []
      list.push({ bgColor: char.bgColor, color: char.color, id: char.id, short: char.short })
      map.set(unitName, list)
    }
    return map
  }, [characters])

  const handleAdd = useCallback(() => {
    onChange([...combinations, []])
  }, [combinations, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(combinations.filter((_, i) => i !== index))
    },
    [combinations, onChange]
  )

  const handleToggleCharacter = useCallback(
    (combinationIndex: number, characterId: string) => {
      const updated = combinations.map((combo, i) => {
        if (i !== combinationIndex) return combo
        if (combo.includes(characterId)) {
          return combo.filter((id) => id !== characterId)
        }
        if (combo.length >= 10) return combo
        return [...combo, characterId]
      })
      onChange(updated)
    },
    [combinations, onChange]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>除外組み合わせ ({combinations.length}件)</Label>
        <Button type="button" variant="ghost" size="sm" onClick={handleAdd}>
          <span className="material-symbols-outlined mr-1 text-sm">add</span>
          追加
        </Button>
      </div>

      {combinations.length === 0 && (
        <div className="py-4 text-center text-sm text-slate-500">除外組み合わせがありません</div>
      )}

      {combinations.map((combo, comboIndex) => (
        <CombinationItem
          key={comboIndex}
          index={comboIndex}
          selectedCharacters={combo}
          charactersByUnit={charactersByUnit}
          onToggle={(charId) => handleToggleCharacter(comboIndex, charId)}
          onRemove={() => handleRemove(comboIndex)}
        />
      ))}
    </div>
  )
}

interface CombinationItemProps {
  charactersByUnit: Map<string, CharacterInfo[]>
  index: number
  onRemove: () => void
  onToggle: (characterId: string) => void
  selectedCharacters: string[]
}

function CombinationItem({
  charactersByUnit,
  index,
  onRemove,
  onToggle,
  selectedCharacters,
}: CombinationItemProps) {
  return (
    <div className="space-y-3 rounded border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          組み合わせ {index + 1}
          {selectedCharacters.length > 0 && (
            <span className="ml-1 text-teal-600">({selectedCharacters.length}人)</span>
          )}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <span className="material-symbols-outlined text-sm text-rose-400">close</span>
        </Button>
      </div>

      <div className="space-y-2">
        {Array.from(charactersByUnit.entries()).map(([unitName, chars]) => (
          <div key={unitName}>
            <div className="mb-1 text-xs font-medium text-slate-400">{unitName}</div>
            <div className="flex flex-wrap gap-1">
              {chars.map((char) => {
                const isSelected = selectedCharacters.includes(char.id)
                const isDisabled = !isSelected && selectedCharacters.length >= 10
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
        ))}
      </div>
    </div>
  )
}

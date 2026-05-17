"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useGetApiAdminFurnitureCharacters } from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { cn } from "@/lib/utils/common"
import { useCallback, useMemo } from "react"

import {
  CharacterUnitSelector,
  type CharacterInfo,
} from "../../_components/character-unit-selector"

export interface CombinationEntry {
  characters: string[]
  deleted?: boolean
  id: number
  isNew?: boolean
}

interface ExcludedCombinationFieldsProps {
  combinations: CombinationEntry[]
  onChange: (combinations: CombinationEntry[]) => void
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
    onChange([...combinations, { characters: [], id: Date.now(), isNew: true }])
  }, [combinations, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(
        combinations.map((combo, i) => {
          if (i !== index) return combo
          return { ...combo, deleted: !combo.deleted }
        })
      )
    },
    [combinations, onChange]
  )

  const handleHardRemove = useCallback(
    (index: number) => {
      onChange(combinations.filter((_, i) => i !== index))
    },
    [combinations, onChange]
  )

  const handleToggleCharacter = useCallback(
    (combinationIndex: number, characterId: string) => {
      const updated = combinations.map((combo, i) => {
        if (i !== combinationIndex) return combo
        if (combo.deleted) return combo
        if (combo.characters.includes(characterId)) {
          return { ...combo, characters: combo.characters.filter((id) => id !== characterId) }
        }
        if (combo.characters.length >= 10) return combo
        return { ...combo, characters: [...combo.characters, characterId] }
      })
      onChange(updated)
    },
    [combinations, onChange]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>除外組み合わせ ({combinations.filter((c) => !c.deleted).length}件)</Label>
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
          key={combo.id}
          index={comboIndex}
          selectedCharacters={combo.characters}
          deleted={combo.deleted}
          charactersByUnit={charactersByUnit}
          onToggle={(charId) => handleToggleCharacter(comboIndex, charId)}
          onRemove={
            combo.isNew ? () => handleHardRemove(comboIndex) : () => handleRemove(comboIndex)
          }
        />
      ))}
    </div>
  )
}

interface CombinationItemProps {
  charactersByUnit: Map<string, CharacterInfo[]>
  deleted?: boolean
  index: number
  onRemove: () => void
  onToggle: (characterId: string) => void
  selectedCharacters: string[]
}

function CombinationItem({
  charactersByUnit,
  deleted,
  index,
  onRemove,
  onToggle,
  selectedCharacters,
}: CombinationItemProps) {
  return (
    <div
      className={cn(
        "space-y-3 rounded border border-slate-100 p-3 transition-opacity",
        deleted ? "bg-slate-50 opacity-50" : "bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium",
            deleted ? "text-slate-400 line-through" : "text-slate-500"
          )}
        >
          組み合わせ {index + 1}
          {selectedCharacters.length > 0 && (
            <span className={cn("ml-1", deleted ? "text-slate-400" : "text-teal-600")}>
              ({selectedCharacters.length}人)
            </span>
          )}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          title={deleted ? "復元" : "組み合わせを削除"}
        >
          <span
            className={cn(
              "material-symbols-outlined text-sm",
              deleted ? "text-slate-400 hover:text-teal-600" : "text-slate-400 hover:text-rose-500"
            )}
          >
            {deleted ? "undo" : "close"}
          </span>
        </Button>
      </div>

      <CharacterUnitSelector
        charactersByUnit={charactersByUnit}
        disabled={deleted}
        maxLimit={10}
        onToggle={onToggle}
        selectedCharacters={selectedCharacters}
      />
    </div>
  )
}

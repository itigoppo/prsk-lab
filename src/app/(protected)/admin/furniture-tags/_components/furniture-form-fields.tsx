"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/ui/form-field"
import { Label } from "@/components/ui/label"
import {
  useGetApiAdminFurnitureCharacters,
  useGetApiAdminFurnitureGroups,
  useGetApiAdminFurnitureGroupsGroupId,
} from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import {
  furnitureWithReactionsDtoSchema,
  reactionDtoSchema,
} from "@/lib/schemas/dto/admin/furniture-tag.dto"
import { cn } from "@/lib/utils/common"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useMemo } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

const uiReactionSchema = reactionDtoSchema.extend({
  _deleted: z.boolean().optional(),
})

const uiFurnitureSchema = furnitureWithReactionsDtoSchema
  .omit({ reactions: true })
  .extend({
    reactions: z.array(uiReactionSchema),
  })
  .superRefine((val, ctx) => {
    if (val.reactions.filter((r) => !r._deleted).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "少なくとも1つのリアクションが必要です",
        path: ["reactions"],
      })
    }
  })

export type FurnitureFormValues = z.infer<typeof uiFurnitureSchema>
export type ReactionFormValues = z.infer<typeof uiReactionSchema>

export const defaultReaction: ReactionFormValues = {
  characters: [],
  excludeFromGroup: false,
  id: null,
}
export const defaultFurniture: FurnitureFormValues = {
  groupId: null,
  id: null,
  name: "",
  reactions: [{ ...defaultReaction }],
}

type CharacterInfo = {
  bgColor: string
  code: string
  color: string
  id: string
  name: string
  short: string
}

interface FurnitureFormFieldsProps {
  defaultValues?: FurnitureFormValues
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: FurnitureFormValues) => Promise<void>
  submitLabel: string
}

export function FurnitureFormFields({
  defaultValues,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: FurnitureFormFieldsProps) {
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<FurnitureFormValues>({
    defaultValues: defaultValues ?? { ...defaultFurniture, reactions: [{ ...defaultReaction }] },
    resolver: zodResolver(uiFurnitureSchema),
  })

  const {
    append: appendReaction,
    fields: reactionFields,
    remove: removeReaction,
  } = useFieldArray({
    control,
    name: "reactions",
  })

  const { data: charactersData } = useGetApiAdminFurnitureCharacters()
  const { data: groupsData } = useGetApiAdminFurnitureGroups()

  const characters = useMemo(() => charactersData?.data?.characters ?? [], [charactersData])
  const groups = useMemo(() => groupsData?.data?.groups ?? [], [groupsData])

  const charactersByUnit = useMemo(() => {
    const map = new Map<string, typeof characters>()
    for (const char of characters) {
      const unitName = char.unit?.name ?? "その他"
      const list = map.get(unitName) ?? []
      list.push(char)
      map.set(unitName, list)
    }
    return map
  }, [characters])

  const groupId = watch("groupId")

  // 選択中グループの除外組み合わせを取得
  const { data: groupDetailData } = useGetApiAdminFurnitureGroupsGroupId(groupId ?? "", {
    query: { enabled: !!groupId },
  })
  const excludedCombinationKeys = useMemo(() => {
    const keys = new Set<string>()
    const combos = groupDetailData?.data?.group?.excludedCombinations
    if (!combos) return keys
    for (const combo of combos) {
      const key = combo.characters
        .map((c) => c.id)
        .sort()
        .join(",")
      keys.add(key)
    }
    return keys
  }, [groupDetailData])

  const handleAddReaction = useCallback(() => {
    appendReaction({ ...defaultReaction })
  }, [appendReaction])

  const handleFormSubmit = useCallback(
    (values: FurnitureFormValues) => {
      const activeReactions = values.reactions
        .filter((r) => !r._deleted)
        .map((r) => {
          const { _deleted, ...rest } = r
          return rest
        })
      onSubmit({ ...values, reactions: activeReactions })
    },
    [onSubmit]
  )

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-4">
      <FormField
        label="家具名"
        placeholder="家具名を入力"
        error={errors.name?.message}
        required
        {...register("name")}
      />

      <div className="space-y-2">
        <Label>グループ</Label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          value={groupId ?? ""}
          onChange={(e) => setValue("groupId", e.target.value || null)}
        >
          <option value="">なし</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>リアクション</Label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAddReaction}>
            <span className="material-symbols-outlined mr-1 text-sm">add</span>
            追加
          </Button>
        </div>

        {errors.reactions?.message && (
          <p className="text-xs text-rose-600">{errors.reactions.message}</p>
        )}

        {reactionFields.map((reactionField, reactionIndex) => (
          <ReactionItem
            key={reactionField.id}
            reactionIndex={reactionIndex}
            watch={watch}
            setValue={setValue}
            errors={errors}
            charactersByUnit={charactersByUnit}
            excludedCombinationKeys={excludedCombinationKeys}
            showExcludeFromGroup={!!groupId}
            totalFieldsCount={reactionFields.length}
            onToggleRemove={() => {
              const reactionId = getValues(`reactions.${reactionIndex}.id`)
              if (reactionId) {
                const currentDeleted = getValues(`reactions.${reactionIndex}._deleted`)
                setValue(`reactions.${reactionIndex}._deleted`, !currentDeleted)
              } else {
                removeReaction(reactionIndex)
              }
            }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          キャンセル
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isPending}
          onClick={handleSubmit(handleFormSubmit)}
        >
          {isPending ? "処理中..." : submitLabel}
        </Button>
      </div>
    </div>
  )
}

interface ReactionItemProps {
  charactersByUnit: Map<string, CharacterInfo[]>
  errors: ReturnType<typeof useForm<FurnitureFormValues>>["formState"]["errors"]
  excludedCombinationKeys: Set<string>
  onToggleRemove?: () => void
  reactionIndex: number
  setValue: ReturnType<typeof useForm<FurnitureFormValues>>["setValue"]
  showExcludeFromGroup: boolean
  totalFieldsCount: number
  watch: ReturnType<typeof useForm<FurnitureFormValues>>["watch"]
}

function ReactionItem({
  charactersByUnit,
  errors,
  excludedCombinationKeys,
  onToggleRemove,
  reactionIndex,
  setValue,
  showExcludeFromGroup,
  totalFieldsCount,
  watch,
}: ReactionItemProps) {
  const watchedCharacters = watch(`reactions.${reactionIndex}.characters`)
  const selectedCharacters = useMemo(() => watchedCharacters ?? [], [watchedCharacters])
  const excludeFromGroup = watch(`reactions.${reactionIndex}.excludeFromGroup`)
  const _deleted = watch(`reactions.${reactionIndex}._deleted`)
  const reactionErrors = errors.reactions?.[reactionIndex]

  // 選択中のキャラクターがグループの除外組み合わせに一致する場合、自動チェック
  // グループ切り替え時は常にグループの除外状態に合わせる
  const combinationKey = useMemo(
    () => [...selectedCharacters].sort().join(","),
    [selectedCharacters]
  )
  useEffect(() => {
    if (!showExcludeFromGroup || selectedCharacters.length === 0) return
    setValue(
      `reactions.${reactionIndex}.excludeFromGroup`,
      excludedCombinationKeys.has(combinationKey)
    )
  }, [
    combinationKey,
    excludedCombinationKeys,
    showExcludeFromGroup,
    selectedCharacters.length,
    setValue,
    reactionIndex,
  ])

  const selectedUnitName = useMemo(() => {
    if (selectedCharacters.length === 0) return null
    for (const [unitName, chars] of charactersByUnit.entries()) {
      if (chars.some((c) => selectedCharacters.includes(c.id))) {
        return unitName
      }
    }
    return null
  }, [selectedCharacters, charactersByUnit])

  const toggleCharacter = useCallback(
    (characterId: string) => {
      if (_deleted) return
      const path = `reactions.${reactionIndex}.characters` as const
      if (selectedCharacters.includes(characterId)) {
        setValue(
          path,
          selectedCharacters.filter((id) => id !== characterId)
        )
      } else if (selectedCharacters.length < 4) {
        setValue(path, [...selectedCharacters, characterId])
      }
    },
    [reactionIndex, selectedCharacters, setValue, _deleted]
  )

  return (
    <div
      className={cn(
        "space-y-3 rounded border border-slate-100 p-3 transition-opacity",
        _deleted ? "bg-slate-50 opacity-50" : "bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium",
            _deleted ? "text-slate-400 line-through" : "text-slate-500"
          )}
        >
          リアクション {reactionIndex + 1}
          {selectedCharacters.length > 0 && (
            <span className={cn("ml-1", _deleted ? "text-slate-400" : "text-teal-600")}>
              ({selectedCharacters.length}/4人)
            </span>
          )}
        </span>
        {(totalFieldsCount > 1 || _deleted) && onToggleRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleRemove}
            title={_deleted ? "復元" : "リアクションを削除"}
          >
            <span
              className={cn(
                "material-symbols-outlined text-sm",
                _deleted
                  ? "text-slate-400 hover:text-teal-600"
                  : "text-slate-400 hover:text-rose-400"
              )}
            >
              {_deleted ? "undo" : "close"}
            </span>
          </Button>
        )}
      </div>

      {reactionErrors?.characters?.message && (
        <p className="text-xs text-rose-600">{reactionErrors.characters.message}</p>
      )}

      <div className="space-y-2">
        {Array.from(charactersByUnit.entries()).map(([unitName, chars]) => {
          const isOtherUnitDiv = selectedUnitName !== null && selectedUnitName !== unitName
          return (
            <div key={unitName}>
              <div
                className={cn(
                  "mb-1 text-xs font-medium transition-colors",
                  selectedUnitName === unitName
                    ? "font-bold text-teal-600"
                    : isOtherUnitDiv
                      ? "text-slate-300"
                      : "text-slate-400"
                )}
              >
                {unitName}
              </div>
              <div className="flex flex-wrap gap-1">
                {chars.map((char) => {
                  const isSelected = selectedCharacters.includes(char.id)
                  const isOtherUnit = selectedUnitName !== null && selectedUnitName !== unitName
                  const isDisabled =
                    _deleted || (!isSelected && (selectedCharacters.length >= 4 || isOtherUnit))
                  return (
                    <button
                      key={char.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleCharacter(char.id)}
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
          )
        })}
      </div>

      {showExcludeFromGroup && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            disabled={_deleted}
            checked={excludeFromGroup}
            onCheckedChange={(checked) => {
              setValue(`reactions.${reactionIndex}.excludeFromGroup`, checked === true)
            }}
          />
          グループから除外
        </label>
      )}
    </div>
  )
}

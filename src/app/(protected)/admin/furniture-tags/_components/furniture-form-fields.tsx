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
import { cn } from "@/lib/utils/common"
import { zNullableString, zString } from "@/lib/utils/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useMemo } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

export const reactionFormSchema = z.object({
  characters: z
    .array(zString("キャラクターIDは必須です"))
    .min(1, "リアクションには少なくとも1人のキャラクターが必要です")
    .max(4, "リアクションのキャラクターは4人以内で指定してください"),
  excludeFromGroup: z.boolean(),
})

export const furnitureFormSchema = z.object({
  groupId: zNullableString("グループIDは必須です"),
  name: zString("家具名は必須です", {
    max: 100,
    maxMessage: "家具名は100文字以内で入力してください",
  }),
  reactions: z.array(reactionFormSchema).min(1, "少なくとも1つのリアクションが必要です"),
})

export type FurnitureFormValues = z.infer<typeof furnitureFormSchema>
export type ReactionFormValues = z.infer<typeof reactionFormSchema>

export const defaultReaction: ReactionFormValues = { characters: [], excludeFromGroup: false }
export const defaultFurniture: FurnitureFormValues = {
  groupId: null,
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
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<FurnitureFormValues>({
    defaultValues: defaultValues ?? { ...defaultFurniture, reactions: [{ ...defaultReaction }] },
    resolver: zodResolver(furnitureFormSchema),
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
            onRemove={reactionFields.length > 1 ? () => removeReaction(reactionIndex) : undefined}
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
          onClick={handleSubmit(onSubmit)}
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
  onRemove?: () => void
  reactionIndex: number
  setValue: ReturnType<typeof useForm<FurnitureFormValues>>["setValue"]
  showExcludeFromGroup: boolean
  watch: ReturnType<typeof useForm<FurnitureFormValues>>["watch"]
}

function ReactionItem({
  charactersByUnit,
  errors,
  excludedCombinationKeys,
  onRemove,
  reactionIndex,
  setValue,
  showExcludeFromGroup,
  watch,
}: ReactionItemProps) {
  const watchedCharacters = watch(`reactions.${reactionIndex}.characters`)
  const selectedCharacters = useMemo(() => watchedCharacters ?? [], [watchedCharacters])
  const excludeFromGroup = watch(`reactions.${reactionIndex}.excludeFromGroup`)
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
    [reactionIndex, selectedCharacters, setValue]
  )

  return (
    <div className="space-y-3 rounded border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          リアクション {reactionIndex + 1}
          {selectedCharacters.length > 0 && (
            <span className="ml-1 text-teal-600">({selectedCharacters.length}/4人)</span>
          )}
        </span>
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <span className="material-symbols-outlined text-sm text-rose-400">close</span>
          </Button>
        )}
      </div>

      {reactionErrors?.characters?.message && (
        <p className="text-xs text-rose-600">{reactionErrors.characters.message}</p>
      )}

      <div className="space-y-2">
        {Array.from(charactersByUnit.entries()).map(([unitName, chars]) => (
          <div key={unitName}>
            <div className="mb-1 text-xs font-medium text-slate-400">{unitName}</div>
            <div className="flex flex-wrap gap-1">
              {chars.map((char) => {
                const isSelected = selectedCharacters.includes(char.id)
                const isOtherUnit = selectedUnitName !== null && selectedUnitName !== unitName
                const isDisabled = !isSelected && (selectedCharacters.length >= 4 || isOtherUnit)
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
        ))}
      </div>

      {showExcludeFromGroup && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
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

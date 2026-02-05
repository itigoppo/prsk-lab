"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { IconLoading } from "@/components/icons/loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { useGetApiFurnituresUnitCode } from "@/lib/api/generated/furnitures/furnitures"
import {
  useDeleteApiReactionsReactionIdCheck,
  usePostApiReactionsReactionIdCheck,
} from "@/lib/api/generated/reactions/reactions"
import { useDebounce } from "@/lib/hooks/use-debounce"
import type { UnitListItem } from "@/lib/schemas/response/unit.response"
import { cn } from "@/lib/utils/common"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"

interface ReactionChecklistProps {
  unit: UnitListItem
}
export function ReactionChecklist({ unit }: ReactionChecklistProps) {
  const [searchInput, setSearchInput] = useState("")
  const [hideCompleted, setHideCompleted] = useState(true)
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [openTags, setOpenTags] = useState<Set<string>>(new Set())
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set())
  const [pendingReactionIds, setPendingReactionIds] = useState<Set<string>>(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const queryClient = useQueryClient()
  const debouncedSearch = useDebounce(searchInput, 500)

  const toggleTag = useCallback((tagId: string) => {
    setOpenTags((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }, [])

  // キャラクター一覧を取得するためのクエリ（フィルターなし）
  const { data: allData } = useGetApiFurnituresUnitCode(unit.code, {})

  // ユニークなキャラクター一覧を抽出（フィルター用）
  const uniqueCharacters = useMemo(() => {
    const characterMap = new Map<string, { color: string; id: string; short: string }>()
    const tags = allData?.data?.tags ?? []
    for (const tag of tags) {
      for (const furniture of tag.furnitures) {
        for (const reaction of furniture.reactions) {
          for (const character of reaction.characters) {
            if (!characterMap.has(character.id)) {
              characterMap.set(character.id, character)
            }
          }
        }
      }
    }
    return Array.from(characterMap.values())
  }, [allData?.data?.tags])

  const toggleCharacter = useCallback((characterId: string) => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev)
      if (next.has(characterId)) {
        next.delete(characterId)
      } else {
        next.add(characterId)
      }
      return next
    })
  }, [])

  const { data, error, isLoading, refetch } = useGetApiFurnituresUnitCode(unit.code, {
    characterIds:
      selectedCharacterIds.size > 0 ? Array.from(selectedCharacterIds).join(",") : undefined,
    hideCompleted: hideCompleted ? "true" : undefined,
    ownedOnly: ownedOnly ? "true" : undefined,
    q: debouncedSearch || undefined,
  })
  const filteredTags = useMemo(() => data?.data?.tags ?? [], [data?.data?.tags])

  const invalidateFurnitures = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: [`/api/furnitures/${unit.code}`] })
  }, [queryClient, unit.code])

  const removePendingReaction = useCallback((reactionId: string) => {
    setPendingReactionIds((prev) => {
      const next = new Set(prev)
      next.delete(reactionId)
      return next
    })
  }, [])

  const { mutate: checkReaction } = usePostApiReactionsReactionIdCheck({
    mutation: {
      onError: (_, variables) => {
        removePendingReaction(variables.reactionId)
      },
      onSuccess: async (_, variables) => {
        await invalidateFurnitures()
        removePendingReaction(variables.reactionId)
      },
    },
  })

  const { mutate: uncheckReaction } = useDeleteApiReactionsReactionIdCheck({
    mutation: {
      onError: (_, variables) => {
        removePendingReaction(variables.reactionId)
      },
      onSuccess: async (_, variables) => {
        await invalidateFurnitures()
        removePendingReaction(variables.reactionId)
      },
    },
  })

  const handleToggleReaction = useCallback(
    (reactionId: string, checked: boolean, checkedByGroup: boolean) => {
      // 既に処理中なら何もしない
      if (pendingReactionIds.has(reactionId)) return

      setPendingReactionIds((prev) => new Set(prev).add(reactionId))

      // checkedByGroupの場合は直接チェックされていないのでチェックを付ける
      if (checked && !checkedByGroup) {
        uncheckReaction({ reactionId })
      } else {
        checkReaction({ reactionId })
      }
    },
    [checkReaction, uncheckReaction, pendingReactionIds]
  )

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState title="家具情報の取得に失敗しました" onRetry={refetch} retrying={isLoading} />
    )
  }

  return (
    <>
      {/* 検索・フィルター（右下固定） */}
      <div className="fixed right-4 bottom-4 z-10 rounded-lg border border-slate-300 bg-white shadow-lg">
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex w-full cursor-pointer items-center gap-2 p-3"
        >
          <span className="material-symbols-outlined">screen_search_desktop</span>
          {isFilterOpen && <span className="text-sm font-bold">絞り込み検索</span>}
        </button>
        {isFilterOpen && (
          <div className="w-72 space-y-2 border-t border-slate-200 p-3">
            <Input
              type="text"
              placeholder="家具名で検索"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 text-sm"
            />
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => setHideCompleted(!hideCompleted)}
            >
              <Checkbox checked={hideCompleted} variant="primary" />
              <span className="text-xs">全員のリアクション閲覧済みは除外</span>
            </div>
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => setOwnedOnly(!ownedOnly)}
            >
              <Checkbox checked={ownedOnly} variant="primary" />
              <span className="text-xs">所持している家具のみ</span>
            </div>
            {/* メンバー絞り込み */}
            <div className="flex flex-wrap gap-1">
              {uniqueCharacters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => toggleCharacter(character.id)}
                  className={cn(
                    "cursor-pointer rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                    selectedCharacterIds.has(character.id)
                      ? "text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                  style={
                    selectedCharacterIds.has(character.id)
                      ? { backgroundColor: character.color }
                      : undefined
                  }
                >
                  {character.short}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{unit.name}版</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTags.length === 0 && (
              <div className="text-center text-sm text-slate-500">家具が見つかりません</div>
            )}
            {filteredTags.map((tag) => (
              <Collapsible
                key={tag.id}
                open={
                  debouncedSearch || selectedCharacterIds.size > 0 ? true : openTags.has(tag.id)
                }
                onOpenChange={() => toggleTag(tag.id)}
              >
                <CollapsibleTrigger className="border-b-2 border-slate-500 bg-emerald-50 px-6 py-4 font-bold">
                  {tag.name}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 py-4">
                  {tag.furnitures.map((furniture) => (
                    <div className="space-y-2" key={furniture.id}>
                      <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
                        <div className="flex items-center gap-1">
                          {furniture.reactions.every((reaction) => reaction.checked) && (
                            <span className="material-symbols-outlined text-lime-500">stars</span>
                          )}
                          <div>{furniture.name}</div>
                          <div>
                            ({furniture.reactions.filter((reaction) => reaction.checked).length} /{" "}
                            {furniture.reactions.length})
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                        {furniture.reactions.map((reaction) => {
                          const isPending = pendingReactionIds.has(reaction.id)
                          return (
                            <div
                              key={reaction.id}
                              className={cn(
                                "w-fit gap-2 rounded border border-slate-400 p-1.5 text-xs hover:cursor-pointer",
                                reaction.characters.length > 2
                                  ? "grid grid-cols-2"
                                  : "flex items-center",
                                isPending && "pointer-events-none bg-slate-100"
                              )}
                              onClick={() =>
                                handleToggleReaction(
                                  reaction.id,
                                  reaction.checked,
                                  reaction.checkedByGroup
                                )
                              }
                            >
                              {reaction.characters.map((character) => (
                                <div key={character.id} className="flex items-center gap-1">
                                  {isPending ? (
                                    <IconLoading
                                      style={{ fill: character.color }}
                                      className="size-4 animate-spin text-slate-300"
                                    />
                                  ) : (
                                    <Checkbox
                                      checked={reaction.checked}
                                      iconSize={20}
                                      indeterminate={reaction.checkedByGroup}
                                      style={{ color: character.color }}
                                    />
                                  )}
                                  <div>{character.short}</div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { IconLoading } from "@/components/icons/loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  useDeleteApiFurnituresOwnFurnitureId,
  useGetApiFurnitures,
  usePostApiFurnituresOwnFurnitureId,
} from "@/lib/api/generated/furnitures/furnitures"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { cn } from "@/lib/utils/common"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"

export function FurnitureInventory() {
  const [searchInput, setSearchInput] = useState("")
  const [openTags, setOpenTags] = useState<Set<string>>(new Set())
  const [pendingFurnitureIds, setPendingFurnitureIds] = useState<Set<string>>(new Set())
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

  const { data, error, isLoading, refetch } = useGetApiFurnitures({
    q: debouncedSearch || undefined,
  })
  const tags = useMemo(() => data?.data?.tags ?? [], [data?.data?.tags])

  const invalidateFurnitures = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ["/api/furnitures"] })
  }, [queryClient])

  const removePendingFurniture = useCallback((furnitureId: string) => {
    setPendingFurnitureIds((prev) => {
      const next = new Set(prev)
      next.delete(furnitureId)
      return next
    })
  }, [])

  const { mutate: ownFurniture } = usePostApiFurnituresOwnFurnitureId({
    mutation: {
      onError: (_, variables) => {
        removePendingFurniture(variables.furnitureId)
      },
      onSuccess: async (_, variables) => {
        await invalidateFurnitures()
        removePendingFurniture(variables.furnitureId)
      },
    },
  })

  const { mutate: unownFurniture } = useDeleteApiFurnituresOwnFurnitureId({
    mutation: {
      onError: (_, variables) => {
        removePendingFurniture(variables.furnitureId)
      },
      onSuccess: async (_, variables) => {
        await invalidateFurnitures()
        removePendingFurniture(variables.furnitureId)
      },
    },
  })

  const handleToggleOwnership = useCallback(
    (furnitureId: string, owned: boolean) => {
      if (pendingFurnitureIds.has(furnitureId)) return

      setPendingFurnitureIds((prev) => new Set(prev).add(furnitureId))

      if (owned) {
        unownFurniture({ furnitureId })
      } else {
        ownFurniture({ furnitureId })
      }
    },
    [ownFurniture, unownFurniture, pendingFurnitureIds]
  )

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState title="家具一覧の取得に失敗しました" onRetry={refetch} retrying={isLoading} />
    )
  }

  return (
    <>
      {/* 検索（右下固定） */}
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
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>リアクションチェック対象の家具一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tags.length === 0 && (
              <div className="text-center text-sm text-slate-500">家具が見つかりません</div>
            )}
            {tags.map((tag) => (
              <Collapsible
                key={tag.id}
                open={debouncedSearch ? true : openTags.has(tag.id)}
                onOpenChange={() => toggleTag(tag.id)}
              >
                <CollapsibleTrigger className="border-b-2 border-slate-500 bg-emerald-50 px-6 py-4 font-bold">
                  {tag.name}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({tag.furnitures.filter((f) => f.owned).length} / {tag.furnitures.length})
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="py-4">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {tag.furnitures.map((furniture) => {
                      const isPending = pendingFurnitureIds.has(furniture.id)
                      return (
                        <div
                          key={furniture.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded border border-slate-400 p-2 text-sm hover:bg-slate-50",
                            isPending && "pointer-events-none bg-slate-100"
                          )}
                          onClick={() => handleToggleOwnership(furniture.id, furniture.owned)}
                        >
                          {isPending ? (
                            <IconLoading className="size-4 animate-spin text-slate-400" />
                          ) : (
                            <Checkbox checked={furniture.owned} variant="primary" />
                          )}
                          <span className={cn(furniture.owned && "text-teal-700")}>
                            {furniture.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

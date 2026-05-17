"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { TextLink } from "@/components/ui/text-link"
import {
  getGetApiAdminFurnitureTagsQueryKey,
  useGetApiAdminFurnitureTagsTagId,
  usePatchApiAdminFurnitureTagsTagId,
} from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { getGetApiFurnituresQueryKey } from "@/lib/api/generated/furnitures/furnitures"
import {
  type ReorderDirection,
  ReorderDirection as ReorderDirectionEnum,
} from "@/lib/api/generated/models"
import { UnsavedChangesDialog, useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"
import { updateFurnitureTagDtoSchema } from "@/lib/schemas/dto/admin/furniture-tag.dto"
import { cn } from "@/lib/utils/common"
import { getApiErrorMessage } from "@/lib/utils/error"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"
import {
  FurnitureFormFields,
  type FurnitureFormValues,
} from "../../_components/furniture-form-fields"

const tagFormSchema = updateFurnitureTagDtoSchema.pick({ name: true })

type TagFormValues = z.infer<typeof tagFormSchema>

interface FurnitureEntry {
  deleted?: boolean
  id: number
  values: FurnitureFormValues
}

let furnitureIdCounter = 0

interface FurnitureTagDetailProps {
  tagId: string
}

export function FurnitureTagDetail({ tagId }: FurnitureTagDetailProps) {
  const queryClient = useQueryClient()
  const { data, error, isLoading, refetch } = useGetApiAdminFurnitureTagsTagId(tagId)
  const tag = useMemo(() => data?.data?.tag, [data?.data?.tag])

  const {
    formState: { errors, isDirty: isTagNameDirty },
    handleSubmit,
    register,
    reset: resetTagForm,
  } = useForm<TagFormValues>({
    defaultValues: { name: "" },
    resolver: zodResolver(tagFormSchema),
  })

  const { isPending, mutateAsync } = usePatchApiAdminFurnitureTagsTagId()

  const [furnitures, setFurnitures] = useState<FurnitureEntry[]>([])
  const [addingFurniture, setAddingFurniture] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const initialFurnituresJson = useRef("")

  // タグデータが読み込まれたらフォームとstateを初期化
  useEffect(() => {
    if (!tag) return
    resetTagForm({ name: tag.name })
    const entries = tag.furnitures.map((f) => ({
      groupId: f.groupId,
      id: f.id,
      name: f.name,
      reactions: f.reactions.map((r) => ({
        characters: r.characters.map((c) => c.id),
        excludeFromGroup: r.excludeFromGroup,
        id: r.id,
      })),
    }))
    setFurnitures(entries.map((values) => ({ id: ++furnitureIdCounter, values })))
    initialFurnituresJson.current = JSON.stringify(entries)
    setInitialized(true)
  }, [tag, resetTagForm])

  const isFurnituresDirty = useMemo(
    () =>
      JSON.stringify(furnitures.filter((f) => !f.deleted).map((f) => f.values)) !==
      initialFurnituresJson.current,
    [furnitures]
  )
  const isDirty = isTagNameDirty || isFurnituresDirty

  const { dialogProps, handleNavigation } = useUnsavedChanges(isDirty)

  const handleAddFurniture = useCallback(() => {
    setAddingFurniture(true)
  }, [])

  const handleFurnitureAdded = useCallback(async (values: FurnitureFormValues) => {
    setFurnitures((prev) => [...prev, { id: ++furnitureIdCounter, values }])
    setAddingFurniture(false)
  }, [])

  const handleCancelAdd = useCallback(() => {
    setAddingFurniture(false)
  }, [])

  const handleEditFurniture = useCallback((id: number, values: FurnitureFormValues) => {
    setFurnitures((prev) => prev.map((f) => (f.id === id ? { ...f, values } : f)))
  }, [])

  const handleMoveFurniture = useCallback((id: number, direction: ReorderDirection) => {
    setFurnitures((prev) => {
      const index = prev.findIndex((f) => f.id === id)
      if (index === -1) return prev
      if (direction === ReorderDirectionEnum.up && index === 0) return prev
      if (direction === ReorderDirectionEnum.down && index === prev.length - 1) return prev

      const newFurnitures = [...prev]
      const swapIndex = direction === ReorderDirectionEnum.up ? index - 1 : index + 1
      const temp = newFurnitures[index]
      newFurnitures[index] = newFurnitures[swapIndex]
      newFurnitures[swapIndex] = temp
      return newFurnitures
    })
  }, [])

  const handleRemoveFurniture = useCallback((id: number) => {
    setFurnitures((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target?.values.id) {
        return prev.map((f) => (f.id === id ? { ...f, deleted: !f.deleted } : f))
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const onSubmit = useCallback(
    async (tagValues: TagFormValues) => {
      try {
        await mutateAsync({
          data: {
            furnitures: furnitures.filter((f) => !f.deleted).map((f) => f.values),
            name: tagValues.name,
          },
          tagId,
        })
        toast.success("タグを更新しました")
        refetch()
        queryClient.invalidateQueries({ queryKey: getGetApiAdminFurnitureTagsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetApiFurnituresQueryKey() })
      } catch (error) {
        toast.error(getApiErrorMessage(error, "タグの更新に失敗しました"))
      }
    },
    [furnitures, mutateAsync, tagId, refetch, queryClient]
  )

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState title="タグの取得に失敗しました" onRetry={refetch} />
  if (!tag || !initialized) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-sm text-slate-500">
        <TextLink href="/admin">管理</TextLink>
        {" > "}
        <TextLink href="/admin/furniture-tags">タグ管理</TextLink>
        {" > "}
        <span className="text-slate-700">{tag.name}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>タグ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="タグ名" error={errors.name?.message} required {...register("name")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>家具一覧 ({furnitures.filter((f) => !f.deleted).length}件)</CardTitle>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddFurniture}
              disabled={addingFurniture}
            >
              <span className="material-symbols-outlined mr-1 text-sm">add</span>
              家具を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {furnitures.length === 0 && !addingFurniture && (
            <div className="py-6 text-center text-sm text-slate-500">家具がありません</div>
          )}

          {furnitures.map((furniture, index) => (
            <FurnitureCard
              key={furniture.id}
              furniture={furniture}
              isFirst={index === 0}
              isLast={index === furnitures.length - 1}
              onEdit={handleEditFurniture}
              onRemove={handleRemoveFurniture}
              onMove={handleMoveFurniture}
            />
          ))}

          {addingFurniture && (
            <FurnitureFormFields
              onSubmit={handleFurnitureAdded}
              onCancel={handleCancelAdd}
              submitLabel="追加"
              isPending={false}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => handleNavigation("/admin/furniture-tags")}
        >
          戻る
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className={cn(isDirty && "animate-pulse ring-2 ring-teal-400 ring-offset-2")}
        >
          {isPending ? "保存中..." : "保存"}
        </Button>
      </div>

      <UnsavedChangesDialog {...dialogProps} />
    </form>
  )
}

interface FurnitureCardProps {
  furniture: FurnitureEntry
  isFirst: boolean
  isLast: boolean
  onEdit: (id: number, values: FurnitureFormValues) => void
  onMove: (id: number, direction: ReorderDirection) => void
  onRemove: (id: number) => void
}

function FurnitureCard({
  furniture,
  isFirst,
  isLast,
  onEdit,
  onMove,
  onRemove,
}: FurnitureCardProps) {
  const [editing, setEditing] = useState(false)

  const handleSubmit = useCallback(
    async (values: FurnitureFormValues) => {
      onEdit(furniture.id, values)
      setEditing(false)
    },
    [furniture.id, onEdit]
  )

  if (editing) {
    return (
      <FurnitureFormFields
        defaultValues={furniture.values}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(false)}
        submitLabel="更新"
        isPending={false}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-opacity",
        furniture.deleted ? "bg-slate-50 opacity-50" : "bg-white"
      )}
    >
      <div>
        <div className={cn("font-medium", furniture.deleted && "text-slate-500 line-through")}>
          {furniture.values.name}
        </div>
        <div className="text-xs text-slate-500">
          リアクション {furniture.values.reactions.length} 件
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isFirst || furniture.deleted}
          onClick={() => onMove(furniture.id, ReorderDirectionEnum.up)}
          className="h-8 w-8 px-0 text-slate-400 hover:text-slate-700 disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-sm">arrow_upward</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLast || furniture.deleted}
          onClick={() => onMove(furniture.id, ReorderDirectionEnum.down)}
          className="h-8 w-8 px-0 text-slate-400 hover:text-slate-700 disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-sm">arrow_downward</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          disabled={furniture.deleted}
          className="h-8 w-8 px-0"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(furniture.id)}
          title={furniture.deleted ? "復元" : "リストから外す"}
          className="h-8 w-8 px-0"
        >
          <span
            className={cn(
              "material-symbols-outlined text-sm",
              furniture.deleted
                ? "text-slate-400 hover:text-teal-600"
                : "text-slate-400 hover:text-rose-500"
            )}
          >
            {furniture.deleted ? "undo" : "close"}
          </span>
        </Button>
      </div>
    </div>
  )
}

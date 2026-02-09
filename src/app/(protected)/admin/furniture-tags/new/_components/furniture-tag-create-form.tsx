"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { TextLink } from "@/components/ui/text-link"
import {
  getGetApiAdminFurnitureTagsQueryKey,
  usePostApiAdminFurnitureTags,
} from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { UnsavedChangesDialog, useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"
import { cn } from "@/lib/utils/common"
import { getApiErrorMessage } from "@/lib/utils/error"
import { zString } from "@/lib/utils/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"
import {
  FurnitureFormFields,
  type FurnitureFormValues,
} from "../../_components/furniture-form-fields"

const tagFormSchema = z.object({
  name: zString("タグ名は必須です", {
    max: 100,
    maxMessage: "タグ名は100文字以内で入力してください",
  }),
})

type TagFormValues = z.infer<typeof tagFormSchema>

interface FurnitureEntry {
  id: number
  values: FurnitureFormValues
}

let furnitureIdCounter = 0

export function FurnitureTagCreateForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    formState: { errors, isDirty: isTagNameDirty },
    handleSubmit,
    register,
  } = useForm<TagFormValues>({
    defaultValues: { name: "" },
    resolver: zodResolver(tagFormSchema),
  })

  const { isPending, mutateAsync } = usePostApiAdminFurnitureTags()

  const [furnitures, setFurnitures] = useState<FurnitureEntry[]>([])
  const [addingFurniture, setAddingFurniture] = useState(false)

  const isDirty = isTagNameDirty || furnitures.length > 0
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

  const handleRemoveFurniture = useCallback((id: number) => {
    setFurnitures((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const onSubmit = useCallback(
    async (tagValues: TagFormValues) => {
      if (furnitures.length === 0) {
        toast.error("少なくとも1つの家具を追加してください")
        return
      }

      try {
        const result = await mutateAsync({
          data: {
            furnitures: furnitures.map((f) => f.values),
            name: tagValues.name,
          },
        })
        toast.success("タグを作成しました")
        queryClient.invalidateQueries({ queryKey: getGetApiAdminFurnitureTagsQueryKey() })
        const tagId = result.data?.id
        router.push(tagId ? `/admin/furniture-tags/${tagId}` : "/admin/furniture-tags")
      } catch (error) {
        toast.error(getApiErrorMessage(error, "タグの作成に失敗しました"))
      }
    },
    [furnitures, mutateAsync, router, queryClient]
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-sm text-slate-500">
        <TextLink href="/admin">管理</TextLink>
        {" > "}
        <TextLink href="/admin/furniture-tags">タグ管理</TextLink>
        {" > "}
        <span className="text-slate-700">新規作成</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormField
            label="タグ名"
            placeholder="タグ名を入力"
            error={errors.name?.message}
            required
            {...register("name")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>家具一覧 ({furnitures.length}件)</CardTitle>
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
            <div className="py-6 text-center text-sm text-slate-500">
              家具がありません。「家具を追加」ボタンで追加できます。
            </div>
          )}

          {furnitures.map((furniture) => (
            <FurnitureCard
              key={furniture.id}
              furniture={furniture}
              onEdit={handleEditFurniture}
              onRemove={handleRemoveFurniture}
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
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className={cn(isDirty && "animate-pulse ring-2 ring-teal-400 ring-offset-2")}
        >
          {isPending ? "作成中..." : "タグを作成"}
        </Button>
      </div>

      <UnsavedChangesDialog {...dialogProps} />
    </form>
  )
}

interface FurnitureCardProps {
  furniture: FurnitureEntry
  onEdit: (id: number, values: FurnitureFormValues) => void
  onRemove: (id: number) => void
}

function FurnitureCard({ furniture, onEdit, onRemove }: FurnitureCardProps) {
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
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
      <div>
        <div className="font-medium">{furniture.values.name}</div>
        <div className="text-xs text-slate-500">
          リアクション {furniture.values.reactions.length} 件
        </div>
      </div>
      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <span className="material-symbols-outlined text-sm">edit</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(furniture.id)}>
          <span className="material-symbols-outlined text-sm text-rose-500">delete</span>
        </Button>
      </div>
    </div>
  )
}

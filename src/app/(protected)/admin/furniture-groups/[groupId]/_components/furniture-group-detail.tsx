"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { TextLink } from "@/components/ui/text-link"
import {
  getGetApiAdminFurnitureGroupsQueryKey,
  useGetApiAdminFurnitureGroupsGroupId,
  usePatchApiAdminFurnitureGroupsGroupId,
} from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { UnsavedChangesDialog, useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"
import { cn } from "@/lib/utils/common"
import { getApiErrorMessage } from "@/lib/utils/error"
import { zString } from "@/lib/utils/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"
import { ExcludedCombinationFields } from "../../_components/excluded-combination-fields"

const groupFormSchema = z.object({
  name: zString("グループ名は必須です", {
    max: 100,
    maxMessage: "グループ名は100文字以内で入力してください",
  }),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

interface FurnitureGroupDetailProps {
  groupId: string
}

export function FurnitureGroupDetail({ groupId }: FurnitureGroupDetailProps) {
  const queryClient = useQueryClient()
  const { data, error, isLoading, refetch } = useGetApiAdminFurnitureGroupsGroupId(groupId)
  const group = useMemo(() => data?.data?.group, [data?.data?.group])

  const {
    formState: { errors, isDirty: isNameDirty },
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<GroupFormValues>({
    defaultValues: { name: "" },
    resolver: zodResolver(groupFormSchema),
  })

  const { isPending, mutateAsync } = usePatchApiAdminFurnitureGroupsGroupId()

  const [combinations, setCombinations] = useState<string[][]>([])
  const [initialized, setInitialized] = useState(false)
  const initialCombinationsJson = useRef("")

  // グループデータが読み込まれたらフォームとstateを初期化
  useEffect(() => {
    if (!group) return
    resetForm({ name: group.name })
    const combos = group.excludedCombinations.map((ec) => ec.characters.map((c) => c.id))
    setCombinations(combos)
    initialCombinationsJson.current = JSON.stringify(combos)
    setInitialized(true)
  }, [group, resetForm])

  const isCombinationsDirty = useMemo(
    () => JSON.stringify(combinations) !== initialCombinationsJson.current,
    [combinations]
  )
  const isDirty = isNameDirty || isCombinationsDirty

  const { dialogProps, handleNavigation } = useUnsavedChanges(isDirty)

  const onSubmit = useCallback(
    async (values: GroupFormValues) => {
      try {
        await mutateAsync({
          data: {
            excludedCombinations: combinations,
            furnitureIds: group?.furnitures.map((f) => f.id) ?? [],
            name: values.name,
          },
          groupId,
        })
        toast.success("グループを更新しました")
        refetch()
        queryClient.invalidateQueries({ queryKey: getGetApiAdminFurnitureGroupsQueryKey() })
        // 除外組み合わせ変更がタグ詳細のexcludeFromGroup計算に影響するためタグキャッシュも無効化
        queryClient.invalidateQueries({
          predicate: (query) =>
            typeof query.queryKey[0] === "string" &&
            query.queryKey[0].startsWith("/api/admin/furniture-tags/"),
        })
      } catch (error) {
        toast.error(getApiErrorMessage(error, "グループの更新に失敗しました"))
      }
    },
    [combinations, group, mutateAsync, groupId, refetch, queryClient]
  )

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState title="グループの取得に失敗しました" onRetry={refetch} />
  if (!group || !initialized) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-sm text-slate-500">
        <TextLink href="/admin">管理</TextLink>
        {" > "}
        <TextLink href="/admin/furniture-groups">グループ管理</TextLink>
        {" > "}
        <span className="text-slate-700">{group.name}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>グループ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            label="グループ名"
            error={errors.name?.message}
            required
            {...register("name")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>除外組み合わせ</CardTitle>
        </CardHeader>
        <CardContent>
          <ExcludedCombinationFields combinations={combinations} onChange={setCombinations} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>所属家具 ({group.furnitures.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {group.furnitures.length === 0 ? (
            <div className="py-4 text-center text-sm text-slate-500">所属する家具がありません</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {group.furnitures.map((furniture) => (
                <div key={furniture.id} className="py-3">
                  <div className="font-medium">{furniture.name}</div>
                  <div className="text-xs text-slate-500">タグ: {furniture.tagName}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => handleNavigation("/admin/furniture-groups")}
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

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import { TextLink } from "@/components/ui/text-link"
import {
  getGetApiAdminFurnitureGroupsQueryKey,
  usePostApiAdminFurnitureGroups,
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
import { ExcludedCombinationFields } from "../../_components/excluded-combination-fields"

const groupFormSchema = z.object({
  name: zString("グループ名は必須です", {
    max: 100,
    maxMessage: "グループ名は100文字以内で入力してください",
  }),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

export function FurnitureGroupCreateForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    formState: { errors, isDirty: isNameDirty },
    handleSubmit,
    register,
  } = useForm<GroupFormValues>({
    defaultValues: { name: "" },
    resolver: zodResolver(groupFormSchema),
  })

  const { isPending, mutateAsync } = usePostApiAdminFurnitureGroups()

  const [combinations, setCombinations] = useState<string[][]>([])

  const isDirty = isNameDirty || combinations.length > 0
  const { dialogProps, handleNavigation } = useUnsavedChanges(isDirty)

  const onSubmit = useCallback(
    async (values: GroupFormValues) => {
      try {
        const result = await mutateAsync({
          data: {
            excludedCombinations: combinations,
            furnitureIds: [],
            name: values.name,
          },
        })
        toast.success("グループを作成しました")
        queryClient.invalidateQueries({ queryKey: getGetApiAdminFurnitureGroupsQueryKey() })
        const groupId = result.data?.id
        router.push(groupId ? `/admin/furniture-groups/${groupId}` : "/admin/furniture-groups")
      } catch (error) {
        toast.error(getApiErrorMessage(error, "グループの作成に失敗しました"))
      }
    },
    [combinations, mutateAsync, router, queryClient]
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-sm text-slate-500">
        <TextLink href="/admin">管理</TextLink>
        {" > "}
        <TextLink href="/admin/furniture-groups">グループ管理</TextLink>
        {" > "}
        <span className="text-slate-700">新規作成</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormField
            label="グループ名"
            placeholder="グループ名を入力"
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

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => handleNavigation("/admin/furniture-groups")}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className={cn(isDirty && "animate-pulse ring-2 ring-teal-400 ring-offset-2")}
        >
          {isPending ? "作成中..." : "グループを作成"}
        </Button>
      </div>

      <UnsavedChangesDialog {...dialogProps} />
    </form>
  )
}

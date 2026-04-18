"use client"

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog"
import { useDeleteApiAdminFurnitureTagsTagId } from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { getGetApiFurnituresQueryKey } from "@/lib/api/generated/furnitures/furnitures"
import { getApiErrorMessage } from "@/lib/utils/error"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import toast from "react-hot-toast"

interface FurnitureTagDeleteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  tagId: string
  tagName: string
}

export function FurnitureTagDeleteDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  tagId,
  tagName,
}: FurnitureTagDeleteDialogProps) {
  const { isPending, mutateAsync } = useDeleteApiAdminFurnitureTagsTagId()
  const queryClient = useQueryClient()

  const handleConfirm = useCallback(async () => {
    try {
      await mutateAsync({ tagId })
      toast.success("タグを削除しました")
      queryClient.invalidateQueries({ queryKey: getGetApiFurnituresQueryKey() })
      onSuccess()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "タグの削除に失敗しました"))
    }
  }, [mutateAsync, tagId, onSuccess, queryClient])

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      isDeleting={isPending}
      title={`「${tagName}」を削除`}
      description="このタグと関連する家具がすべて削除されます。この操作は取り消せません。"
    />
  )
}

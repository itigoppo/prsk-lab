"use client"

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog"
import { useDeleteApiAdminFurnitureGroupsGroupId } from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import { getApiErrorMessage } from "@/lib/utils/error"
import { useCallback } from "react"
import toast from "react-hot-toast"

interface FurnitureGroupDeleteDialogProps {
  groupId: string
  groupName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FurnitureGroupDeleteDialog({
  groupId,
  groupName,
  isOpen,
  onOpenChange,
  onSuccess,
}: FurnitureGroupDeleteDialogProps) {
  const { isPending, mutateAsync } = useDeleteApiAdminFurnitureGroupsGroupId()

  const handleConfirm = useCallback(async () => {
    try {
      await mutateAsync({ groupId })
      toast.success("グループを削除しました")
      onSuccess()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "グループの削除に失敗しました"))
    }
  }, [mutateAsync, groupId, onSuccess])

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      isDeleting={isPending}
      title={`「${groupName}」を削除`}
      description="このグループを削除すると、所属する家具のグループが解除されます。この操作は取り消せません。"
    />
  )
}

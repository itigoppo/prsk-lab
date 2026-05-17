"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getPageNumbers,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { TextLink } from "@/components/ui/text-link"
import {
  useGetApiAdminFurnitureGroups,
  usePatchApiAdminFurnitureGroupsGroupIdReorder,
} from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import {
  type ReorderDirection,
  ReorderDirection as ReorderDirectionEnum,
} from "@/lib/api/generated/models"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { FurnitureGroupDeleteDialog } from "./furniture-group-delete-dialog"

const PAGE_SIZE = 20

export function FurnitureGroupList() {
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { data, error, isLoading, refetch } = useGetApiAdminFurnitureGroups({
    limit: PAGE_SIZE,
    page,
  })
  const groups = useMemo(() => data?.data?.groups ?? [], [data?.data?.groups])
  const pagination = useMemo(() => data?.data?.pagination, [data?.data?.pagination])

  const handleDeleteSuccess = useCallback(() => {
    setDeleteTarget(null)
    refetch()
  }, [refetch])

  const { isPending: isReordering, mutate: reorder } =
    usePatchApiAdminFurnitureGroupsGroupIdReorder({
      mutation: {
        onError: () => {
          toast.error("並び順の更新に失敗しました")
        },
        onSuccess: () => {
          toast.success("並び順を更新しました")
          refetch()
        },
      },
    })

  const handleReorder = (groupId: string, direction: ReorderDirection) => {
    reorder({ data: { direction }, groupId })
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState title="グループ一覧の取得に失敗しました" onRetry={refetch} />

  return (
    <>
      <div className="space-y-4">
        <div className="text-sm text-slate-500">
          <TextLink href="/admin">管理</TextLink>
          {" > "}
          <span className="text-slate-700">グループ管理</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/furniture-groups/new">
            <Button variant="primary">
              <span className="material-symbols-outlined">add</span>
              グループを作成
            </Button>
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">グループが見つかりません</div>
        ) : (
          <>
            <Card>
              <CardContent className="divide-y divide-slate-200">
                {groups.map((group, index) => {
                  const isFirst = page === 1 && index === 0
                  const isLast =
                    pagination && page === pagination.totalPages && index === groups.length - 1

                  return (
                    <div key={group.id} className="flex items-center justify-between py-3">
                      <TextLink href={`/admin/furniture-groups/${group.id}`} className="flex-1">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-slate-500">
                          家具 {group.furnitureCount} 件 / 除外 {group.excludedCombinationCount} 件
                        </div>
                      </TextLink>

                      <div className="mr-4 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isFirst || isReordering}
                          onClick={() => handleReorder(group.id, ReorderDirectionEnum.up)}
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-xl">arrow_upward</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLast || isReordering}
                          onClick={() => handleReorder(group.id, ReorderDirectionEnum.down)}
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-xl">arrow_downward</span>
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: group.id, name: group.name })}
                      >
                        <span className="material-symbols-outlined text-slate-400 hover:text-rose-500">
                          delete
                        </span>
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {pagination && pagination.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text="前へ"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page > 1) setPage((p) => p - 1)
                      }}
                      aria-disabled={page <= 1}
                      className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {getPageNumbers(page, pagination.totalPages).map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(p)
                          }}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      text="次へ"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page < pagination.totalPages) setPage((p) => p + 1)
                      }}
                      aria-disabled={page >= pagination.totalPages}
                      className={
                        page >= pagination.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <FurnitureGroupDeleteDialog
          isOpen={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onSuccess={handleDeleteSuccess}
          groupId={deleteTarget.id}
          groupName={deleteTarget.name}
        />
      )}
    </>
  )
}

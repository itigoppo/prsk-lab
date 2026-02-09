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
import { useGetApiAdminFurnitureGroups } from "@/lib/api/generated/admin-furnitures/admin-furnitures"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
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
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between py-3">
                    <TextLink href={`/admin/furniture-groups/${group.id}`} className="flex-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-slate-500">
                        家具 {group.furnitureCount} 件 / 除外 {group.excludedCombinationCount} 件
                      </div>
                    </TextLink>
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
                ))}
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

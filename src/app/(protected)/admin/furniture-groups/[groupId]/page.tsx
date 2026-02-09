import type { Metadata } from "next"
import { FurnitureGroupDetail } from "./_components/furniture-group-detail"

export const metadata: Metadata = {
  title: "グループ詳細",
}

export default async function FurnitureGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">workspaces</span>
        <div>グループ詳細</div>
      </div>
      <FurnitureGroupDetail groupId={groupId} />
    </div>
  )
}

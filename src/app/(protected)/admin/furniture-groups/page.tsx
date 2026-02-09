import type { Metadata } from "next"
import { FurnitureGroupList } from "./_components/furniture-group-list"

export const metadata: Metadata = {
  title: "グループ管理",
}

export default function FurnitureGroupsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">workspaces</span>
        <div>グループ管理</div>
      </div>
      <FurnitureGroupList />
    </div>
  )
}

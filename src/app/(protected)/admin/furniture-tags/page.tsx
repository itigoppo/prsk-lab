import type { Metadata } from "next"
import { FurnitureTagList } from "./_components/furniture-tag-list"

export const metadata: Metadata = {
  title: "タグ管理",
}

export default function FurnitureTagsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">sell</span>
        <div>タグ管理</div>
      </div>
      <FurnitureTagList />
    </div>
  )
}

import type { Metadata } from "next"
import { FurnitureGroupCreateForm } from "./_components/furniture-group-create-form"

export const metadata: Metadata = {
  title: "グループ作成",
}

export default function FurnitureGroupCreatePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">workspaces</span>
        <div>グループ作成</div>
      </div>
      <FurnitureGroupCreateForm />
    </div>
  )
}

import type { Metadata } from "next"
import { FurnitureTagCreateForm } from "./_components/furniture-tag-create-form"

export const metadata: Metadata = {
  title: "タグ作成",
}

export default function FurnitureTagCreatePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">sell</span>
        <div>タグ作成</div>
      </div>
      <FurnitureTagCreateForm />
    </div>
  )
}

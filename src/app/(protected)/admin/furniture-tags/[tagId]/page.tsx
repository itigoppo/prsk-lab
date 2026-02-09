import type { Metadata } from "next"
import { FurnitureTagDetail } from "./_components/furniture-tag-detail"

export const metadata: Metadata = {
  title: "タグ詳細",
}

export default async function FurnitureTagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>
}) {
  const { tagId } = await params

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">sell</span>
        <div>タグ詳細</div>
      </div>
      <FurnitureTagDetail tagId={tagId} />
    </div>
  )
}

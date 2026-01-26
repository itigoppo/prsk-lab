import type { Metadata } from "next"
import { AnnivLinkList } from "./_components/anniv-link-list"

export const metadata: Metadata = {
  description: "プロジェクトセカイn周年記念のキャンペーン計算機",
  title: "周年キャンペーンの計算機",
}

export default function AnnivPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">celebration</span>
        <div>周年キャンペーンの計算機</div>
      </div>
      <AnnivLinkList />
    </div>
  )
}

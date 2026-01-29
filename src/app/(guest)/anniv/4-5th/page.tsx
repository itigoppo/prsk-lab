import type { Metadata } from "next"
import { WorldBloomView } from "./_components/world-bloom-view"

export const metadata: Metadata = {
  description: "プロジェクトセカイ4.5周年記念のワールドブルームキャンペーン計算機",
  title: "プロセカ4.5周年ワールドブルームキャンペーン",
}

export default function Anniv4Dot5thPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">celebration</span>
        <div>4.5周年ワールドブルームキャンペーン計算機</div>
      </div>
      <WorldBloomView />
    </div>
  )
}

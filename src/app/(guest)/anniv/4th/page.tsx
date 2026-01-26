import type { Metadata } from "next"
import { FortuneFlowerView } from "./_components/fortune-flower-view"

export const metadata: Metadata = {
  description: "プロジェクトセカイ4周年記念のフォーチュンフラワーパレードキャンペーン計算機",
  title: "プロセカ4周年フォーチュンフラワーパレード",
}

export default function Anniv4thPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">celebration</span>
        <div>4周年フォーチュンフラワーパレード計算機</div>
      </div>
      <FortuneFlowerView />
    </div>
  )
}

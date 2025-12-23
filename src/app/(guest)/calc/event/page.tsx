import type { Metadata } from "next"
import { DeckList } from "./_components/deck-list"

export const metadata: Metadata = {
  description: "プロジェクトセカイの基本イベントボーナスの計算機",
  title: "イベントボーナス計算機",
}

export default function EventCalcPage() {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
          <span className="material-symbols-outlined">calculate</span>
          <div>イベントボーナス計算機</div>
        </div>
        <DeckList />
      </div>
    </>
  )
}

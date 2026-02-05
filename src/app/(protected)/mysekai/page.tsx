import { IconTofu } from "@/components/icons/tofu"
import type { Metadata } from "next"
import { MySekai } from "./_components/mysekai"

export const metadata: Metadata = {
  description: "プロジェクトセカイのマイセカイリアクションチェックシート",
  title: "とうふの森リアクションチェックシート",
}

export default function MySekaiPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <IconTofu className="size-6 font-bold" />
        <div>とうふの森リアクションチェックシート</div>
      </div>
      <MySekai />
    </div>
  )
}

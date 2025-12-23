import { Card } from "@/components/ui/card"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  description: "プロジェクトセカイn周年記念のキャンペーン計算機",
  title: "周年キャンペーンの計算機",
}

const annivLinks = [
  {
    href: "/anniv/4-5th",
    period: "'25/03/30〜04/08",
    title: "4.5周年ワールドブルームキャンペーン",
  },
  {
    href: "/anniv/4th",
    period: "'24/09/30〜10/31",
    title: "4周年フォーチュンパレード",
  },
]

export default function AnnivPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">celebration</span>
        <div>周年キャンペーンの計算機</div>
      </div>

      <div className="relative space-y-6 border-l-2 border-stone-300 pl-6">
        {annivLinks.map((link, index) => (
          <div key={link.href} className="relative">
            <div
              className={`absolute top-1/2 -left-[31px] h-3 w-3 -translate-y-1/2 rounded-full ${
                index === 0 ? "bg-teal-500" : "bg-stone-400"
              }`}
            />
            <Link href={link.href} className="group block">
              <Card className="p-4 transition-all hover:border-teal-400 hover:shadow-lg">
                <div className="flex flex-col gap-1">
                  <div className="font-bold group-hover:text-teal-600">{link.title}</div>
                  <div className="text-sm text-gray-500">{link.period}</div>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

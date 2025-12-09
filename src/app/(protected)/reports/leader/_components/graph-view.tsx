import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMemo } from "react"

interface GraphViewProps {
  colorMap: Record<string, { bgColor: string; color: string; unitColor?: string }>
  data: Record<string, string>[]
  displayHeaders: string[]
  headers: string[]
}

export function GraphView({ colorMap, data, displayHeaders, headers }: GraphViewProps) {
  const totals = useMemo(() => {
    // 最初のヘッダー（日付列）を除外
    const characterHeaders = headers.slice(1)
    const characterDisplayHeaders = displayHeaders.slice(1)

    // 各キャラクターの合計を計算
    const characterTotals = characterHeaders.map((character, index) => {
      const total = data.reduce((sum, row) => {
        return sum + (parseInt(row[character]) || 0)
      }, 0)
      const colorInfo = colorMap[character]
      return {
        character: characterDisplayHeaders[index],
        color: colorInfo?.unitColor || colorInfo?.color || "#14b8a6",
        total,
      }
    })

    // 合計が多い順にソート
    return characterTotals.sort((a, b) => b.total - a.total)
  }, [data, headers, displayHeaders, colorMap])

  const maxTotal = Math.max(...totals.map((t) => t.total), 1)

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">データがありません</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>キャラクター別リーダー回数（合計）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {totals.map(({ character, color, total }) => (
            <div key={character} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{character}</span>
                <span className="text-slate-600">{total}回</span>
              </div>
              <div className="h-6 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full transition-all"
                  style={{ backgroundColor: color, width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

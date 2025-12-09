import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMemo } from "react"

interface TrendViewProps {
  data: Record<string, string>[]
  headers: string[]
}

export function TrendView({ data, headers }: TrendViewProps) {
  const trendData = useMemo(() => {
    const dateHeader = headers[0]
    const characterHeaders = headers.slice(1)

    return data.map((row) => {
      const date = row[dateHeader]
      const total = characterHeaders.reduce((sum, character) => {
        return sum + (parseInt(row[character]) || 0)
      }, 0)
      return { date, total }
    })
  }, [data, headers])

  const maxTotal = Math.max(...trendData.map((t) => t.total), 1)

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
        <CardTitle>日付別リーダー回数の推移</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trendData.map(({ date, total }) => (
            <div key={date} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{date}</span>
                <span className="text-slate-600">{total}回</span>
              </div>
              <div className="h-6 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

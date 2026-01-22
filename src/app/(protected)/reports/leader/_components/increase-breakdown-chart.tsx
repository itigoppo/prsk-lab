"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMemo } from "react"
import { ColorInfo } from "./registered"

interface IncreaseBreakdownChartProps {
  colorMap: Record<string, ColorInfo>
  data: Record<string, string>[]
  headers: string[]
  originalHeaders: string[]
}

export function IncreaseBreakdownChart({
  colorMap,
  data,
  headers,
  originalHeaders,
}: IncreaseBreakdownChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null

    // 2行目（data[0]）はベース値なので表示しない
    const baseData = data[0]
    const displayData = data.slice(1)

    // 日付列（1列目）を取得（年月のみ表示：'YY/MM形式）
    const dateHeader = originalHeaders[0]
    const dates = displayData.map((row) => {
      const fullDate = row[dateHeader]
      if (!fullDate) return fullDate

      const [year, month] = fullDate.split("/").map(Number)
      const date = new Date(year, month - 1)
      date.setMonth(date.getMonth() - 1)

      const displayYear = String(date.getFullYear()).substring(2)
      const displayMonth = String(date.getMonth() + 1).padStart(2, "0")
      return `'${displayYear}/${displayMonth}`
    })

    // メンバー列（2列目以降）を取得
    const memberHeaders = originalHeaders.slice(1)
    const memberDisplayHeaders = headers.slice(1)

    // 各メンバーの差分データを計算
    const memberData = memberHeaders.map((memberHeader, memberIndex) => {
      const baseValue = parseInt(baseData[memberHeader]) || 0
      const values = displayData.map((row) => parseInt(row[memberHeader]) || 0)
      const diffs: number[] = []

      for (let i = 0; i < values.length; i++) {
        if (i === 0) {
          diffs.push(values[i] - baseValue)
        } else {
          diffs.push(values[i] - values[i - 1])
        }
      }

      const colorInfo = colorMap[memberHeader]
      const bgColor = colorInfo?.bgColor || colorInfo?.unitBgColor || "#64748b"

      return {
        color: bgColor,
        diffs,
        name: memberDisplayHeaders[memberIndex],
      }
    })

    // 各月の合計値を計算
    const monthlyTotals = dates.map((_, monthIndex) => {
      return memberData.reduce((sum, member) => sum + member.diffs[monthIndex], 0)
    })

    const maxTotal = Math.max(...monthlyTotals, 1)

    return {
      dates,
      maxTotal,
      memberData,
      monthlyTotals,
    }
  }, [data, headers, originalHeaders, colorMap])

  if (!chartData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">データがありません</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>増加内訳</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* グラフエリア */}
          <div className="overflow-x-auto">
            <div className="flex items-end justify-around gap-2" style={{ minWidth: "600px" }}>
              {chartData.dates.map((date, monthIndex) => {
                const total = chartData.monthlyTotals[monthIndex]

                // 各メンバーの差分を積み上げる
                const stackItems = chartData.memberData.map((member) => ({
                  color: member.color,
                  name: member.name,
                  value: member.diffs[monthIndex],
                }))

                return (
                  <div key={monthIndex} className="flex flex-1 flex-col items-center gap-2">
                    {/* 棒グラフ */}
                    <div className="flex w-full flex-col">
                      {stackItems.map((item, itemIndex) => {
                        if (item.value === 0) return null
                        // 各メンバーの値を最大合計値に対する絶対値として表示（最大400px）
                        const maxHeight = 400
                        const itemHeight = (item.value / chartData.maxTotal) * maxHeight
                        return (
                          <Tooltip key={itemIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className="group relative flex items-center justify-center text-xs font-semibold text-white"
                                style={{
                                  backgroundColor: item.color,
                                  height: `${Math.max(itemHeight, 15)}px`,
                                }}
                              >
                                <span className="opacity-0 group-hover:opacity-100">
                                  {item.value > 0 ? "+" : ""}
                                  {item.value}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-center">
                                <div className="font-semibold">{item.name}</div>
                                <div>
                                  {item.value > 0 ? "+" : ""}
                                  {item.value}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                      {/* 合計値表示 - 積み上げの一番上 */}
                      <div className="flex items-center justify-center bg-slate-100 py-1 text-xs font-semibold text-slate-700">
                        {total > 0 ? `+${total}` : total}
                      </div>
                    </div>
                    {/* 日付ラベル */}
                    <div className="text-xs font-medium">{date}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 凡例 */}
          <div className="flex flex-wrap gap-3 border-t pt-4">
            {chartData.memberData.map((member) => (
              <div key={member.name} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded" style={{ backgroundColor: member.color }} />
                <span className="text-sm">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

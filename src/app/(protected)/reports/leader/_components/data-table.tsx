import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ColorInfo } from "./registered"

interface DataTableProps {
  colorMap: Record<string, ColorInfo>
  data: Record<string, string>[]
  headers: string[]
  originalHeaders: string[]
}

export function DataTable({ colorMap, data, headers, originalHeaders }: DataTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">データがありません</CardContent>
      </Card>
    )
  }

  // 2行目（data[0]）はベース値なので表示しない
  const baseData = data[0]
  const displayData = data.slice(1)

  // 日付列（1列目）を取得（年月のみ表示：'YY/MM形式）
  // 集計日が入力されているので、前月として表示
  const dateHeader = originalHeaders[0]
  const dates = displayData.map((row) => {
    const fullDate = row[dateHeader]
    if (!fullDate) return fullDate

    // "2025/11/08" -> Date object
    const [year, month] = fullDate.split("/").map(Number)
    const date = new Date(year, month - 1) // month は0-indexed

    // 1ヶ月前にする
    date.setMonth(date.getMonth() - 1)

    // 'YY/MM形式にフォーマット
    const displayYear = String(date.getFullYear()).substring(2)
    const displayMonth = String(date.getMonth() + 1).padStart(2, "0")
    return `'${displayYear}/${displayMonth}`
  })

  // メンバー列（2列目以降）を取得
  const memberHeaders = originalHeaders.slice(1)
  const memberDisplayHeaders = headers.slice(1)

  // 各メンバーの差分データと統計を計算
  const memberStats = memberHeaders.map((memberHeader) => {
    const baseValue = parseInt(baseData[memberHeader]) || 0
    const values = displayData.map((row) => parseInt(row[memberHeader]) || 0)
    const diffs: number[] = []

    // 前月（またはベース値）との差分を計算
    for (let i = 0; i < values.length; i++) {
      if (i === 0) {
        // 最初の月はベース値からの差分
        diffs.push(values[i] - baseValue)
      } else {
        diffs.push(values[i] - values[i - 1])
      }
    }

    // 現在回数（最終月の値）
    const currentCount = values[values.length - 1] || 0

    // 平均上昇値（全差分の平均）
    const averageIncrease =
      diffs.length > 0 ? diffs.reduce((sum, v) => sum + v, 0) / diffs.length : 0

    return {
      averageIncrease,
      currentCount,
      diffs,
    }
  })

  // 毎月の全メンバー合計を計算
  const monthlyTotals = dates.map((_, monthIndex) => {
    return memberStats.reduce((sum, stats) => sum + stats.diffs[monthIndex], 0)
  })

  // 全メンバーの現在回数合計
  const totalCurrentCount = memberStats.reduce((sum, stats) => sum + stats.currentCount, 0)

  // 合計行の平均上昇値
  const totalAverageIncrease =
    monthlyTotals.length > 0
      ? monthlyTotals.reduce((sum, v) => sum + v, 0) / monthlyTotals.length
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>一覧表</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2">
                <th className="sticky top-0 left-0 z-20 bg-slate-600 px-4 py-2 text-left font-bold whitespace-nowrap text-white">
                  メンバー
                </th>
                {dates.map((date) => (
                  <th
                    key={date}
                    className="sticky top-0 z-10 bg-slate-100 px-4 py-2 text-center font-bold whitespace-nowrap"
                  >
                    {date}
                  </th>
                ))}
                <th className="sticky top-0 z-10 bg-teal-100 px-4 py-2 text-center font-bold whitespace-nowrap">
                  現在回数
                </th>
                <th className="sticky top-0 z-10 bg-blue-100 px-4 py-2 text-center font-bold whitespace-nowrap">
                  平均上昇値
                </th>
              </tr>
            </thead>
            <tbody>
              {memberHeaders.map((memberHeader, index) => {
                const colorInfo = colorMap[memberHeader]
                const stats = memberStats[index]
                const bgColor = colorInfo?.bgColor || colorInfo?.unitBgColor || "#64748b"

                // 背景色を薄くする（RGBに変換してアルファを0.1に）
                const hexToRgba = (hex: string, alpha: number) => {
                  const r = parseInt(hex.slice(1, 3), 16)
                  const g = parseInt(hex.slice(3, 5), 16)
                  const b = parseInt(hex.slice(5, 7), 16)
                  return `rgba(${r}, ${g}, ${b}, ${alpha})`
                }
                const lightBgColor = hexToRgba(bgColor, 0.1)

                return (
                  <tr key={memberHeader} className="border-b hover:opacity-90">
                    <th
                      className="sticky left-0 z-10 px-4 py-2 text-left font-bold whitespace-nowrap text-white"
                      style={{
                        backgroundColor: bgColor,
                        color: colorInfo?.color || colorInfo?.unitColor || "#ffffff",
                      }}
                    >
                      {memberDisplayHeaders[index]}
                    </th>
                    {stats.diffs.map((diff, dateIndex) => (
                      <td
                        key={dateIndex}
                        className="px-4 py-2 text-right whitespace-nowrap"
                        style={{ backgroundColor: lightBgColor }}
                      >
                        <span className="flex items-center justify-end">
                          <span>{diff}</span>
                          {diff > 0 && (
                            <span className="material-symbols-outlined text-orange-400">
                              arrow_drop_up
                            </span>
                          )}
                        </span>
                      </td>
                    ))}
                    <td className="bg-teal-50 px-4 py-2 text-right font-bold whitespace-nowrap">
                      {stats.currentCount}
                    </td>
                    <td className="bg-blue-50 px-4 py-2 text-right font-bold whitespace-nowrap">
                      {stats.averageIncrease.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
              {/* 合計行 */}
              <tr className="border-t-2 bg-white font-semibold">
                <th className="sticky left-0 z-10 bg-white px-4 py-2 text-left font-bold whitespace-nowrap">
                  合計
                </th>
                {monthlyTotals.map((total, monthIndex) => (
                  <td
                    key={monthIndex}
                    className="px-4 py-2 text-right font-semibold whitespace-nowrap"
                  >
                    {total}
                  </td>
                ))}
                <td className="bg-teal-100 px-4 py-2 text-center font-bold whitespace-nowrap">
                  {totalCurrentCount}
                </td>
                <td className="bg-blue-100 px-4 py-2 text-center font-semibold whitespace-nowrap">
                  {totalAverageIncrease.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

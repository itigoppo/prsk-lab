"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils/common"
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  TooltipItem,
} from "chart.js"
import { useMemo, useRef, useState } from "react"
import { Line } from "react-chartjs-2"
import { ColorInfo } from "./registered"

// Chart.jsのコンポーネントを登録
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface TrendChartProps {
  colorMap: Record<string, ColorInfo>
  data: Record<string, string>[]
  headers: string[]
  originalHeaders: string[]
}

export function TrendChart({ colorMap, data, headers, originalHeaders }: TrendChartProps) {
  // 非表示にするメンバーの名前を管理
  const [hiddenMembers, setHiddenMembers] = useState<Set<string>>(new Set())
  // ハイライト中のメンバー名
  const [highlightedMember, setHighlightedMember] = useState<string | null>(null)
  // setHighlightedMemberをrefで保持（コールバック用）
  const setHighlightedMemberRef = useRef(setHighlightedMember)
  setHighlightedMemberRef.current = setHighlightedMember

  const toggleMember = (memberName: string) => {
    setHiddenMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberName)) {
        next.delete(memberName)
      } else {
        next.add(memberName)
      }
      return next
    })
  }

  // ユニット単位で一括ON/OFF
  const toggleUnit = (unitMembers: { name: string }[]) => {
    setHiddenMembers((prev) => {
      const next = new Set(prev)
      const memberNames = unitMembers.map((m) => m.name)
      const allHidden = memberNames.every((name) => prev.has(name))

      if (allHidden) {
        memberNames.forEach((name) => next.delete(name))
      } else {
        memberNames.forEach((name) => next.add(name))
      }
      return next
    })
  }

  const chartData = useMemo(() => {
    if (data.length === 0) return null

    // 2行目（data[0]）はベース値なので表示しない
    const displayData = data.slice(1)

    // 日付列（1列目）を取得（年月のみ表示：'YY/MM形式）
    const dateHeader = originalHeaders[0]
    const labels = displayData.map((row) => {
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

    // メンバー情報と色の配列を作成（ユニット情報も含める）
    const members = memberHeaders.map((memberHeader, index) => {
      const colorInfo = colorMap[memberHeader]
      const bgColor = colorInfo?.bgColor || colorInfo?.unitBgColor || "#64748b"

      return {
        color: bgColor,
        id: memberHeader,
        name: memberDisplayHeaders[index],
        unit: colorInfo?.unitName || null,
      }
    })

    // 合計を追加
    members.push({
      color: "#5B6369",
      id: "total",
      name: "合計",
      unit: null,
    })

    // 各メンバーのデータを取得
    const memberDataMap: Record<string, (number | null)[]> = {}
    members.forEach((member) => {
      if (member.id === "total") {
        // 合計を計算
        memberDataMap[member.name] = displayData.map((row) => {
          let total = 0
          memberHeaders.forEach((h) => {
            total += parseInt(row[h]) || 0
          })
          return total
        })
      } else {
        memberDataMap[member.name] = displayData.map((row) => {
          const val = parseInt(row[member.id]) || 0
          return val
        })
      }
    })

    // ユニットごとにグループ化
    const unitGroups: Record<string, typeof members> = {}
    members.forEach((member) => {
      const unitKey = member.unit || "その他"
      if (!unitGroups[unitKey]) {
        unitGroups[unitKey] = []
      }
      unitGroups[unitKey].push(member)
    })

    return {
      labels,
      memberDataMap,
      members,
      unitGroups,
    }
  }, [data, headers, originalHeaders, colorMap])

  // Chart.js用のデータとオプションを生成（hiddenMembersに依存して再計算）
  const { chartJsData, chartJsOptions, rightAxisMembers, useDualAxis } = useMemo(() => {
    if (!chartData) {
      return { chartJsData: null, chartJsOptions: null, rightAxisMembers: [], useDualAxis: false }
    }

    // 表示するメンバーのみをフィルタリング
    const visibleMembers = chartData.members.filter((m) => !hiddenMembers.has(m.name))
    // visibleMembersの名前リスト（onHoverで使用）
    const visibleMemberNames = visibleMembers.map((m) => m.name)

    // 表示メンバーで最大値を再計算（合計以外）
    const memberMaxValues: { max: number; name: string }[] = []
    visibleMembers.forEach((member) => {
      if (member.name === "合計") return
      const values = chartData.memberDataMap[member.name] || []
      const max = Math.max(...values.filter((v): v is number => v !== null))
      memberMaxValues.push({ max, name: member.name })
    })

    const maxValWithoutTotal =
      memberMaxValues.length > 0 ? Math.max(...memberMaxValues.map((v) => v.max)) : 0
    const minValWithoutTotal =
      memberMaxValues.filter((v) => v.max > 0).length > 0
        ? Math.min(...memberMaxValues.filter((v) => v.max > 0).map((v) => v.max))
        : 0

    // デュアル軸を使用する条件：3人以上 & 最大値/最小値が3倍以上
    const useDualAxis =
      visibleMembers.length >= 3 &&
      minValWithoutTotal > 0 &&
      maxValWithoutTotal / minValWithoutTotal >= 3

    // 右軸メンバー：デュアル軸の場合のみ、合計 + 最大値の70%以上のメンバー
    const rightAxisMembers: string[] = []
    if (useDualAxis) {
      // 合計が表示されている場合のみ追加
      if (!hiddenMembers.has("合計")) {
        rightAxisMembers.push("合計")
      }
      memberMaxValues
        .filter((v) => v.max >= maxValWithoutTotal * 0.7)
        .forEach((v) => rightAxisMembers.push(v.name))
    }

    // データセットを作成
    const datasets = visibleMembers.map((member) => {
      const isRightAxis = useDualAxis && rightAxisMembers.includes(member.name)

      // ハイライト時の透明度計算
      const isHighlighted = highlightedMember === member.name
      const isFaded = highlightedMember !== null && !isHighlighted

      return {
        backgroundColor: isRightAxis ? member.color : "#ffffff",
        borderColor: isFaded ? `${member.color}40` : member.color, // 40は約25%の透明度
        borderWidth: isHighlighted ? 3 : isRightAxis ? 2 : 1.5,
        data: chartData.memberDataMap[member.name],
        label: member.name,
        pointHoverRadius: isRightAxis ? 7 : 5,
        pointRadius: isHighlighted ? (isRightAxis ? 6 : 4) : isRightAxis ? 5 : 3,
        pointStyle: isRightAxis ? ("rectRot" as const) : ("circle" as const),
        spanGaps: true,
        tension: 0.3,
        yAxisID: isRightAxis ? "yRight" : "yLeft",
      }
    })

    const chartJsData = {
      datasets,
      labels: chartData.labels,
    }

    // スケール設定
    const scales: Record<string, object> = {
      yLeft: {
        position: "left" as const,
        title: {
          display: useDualAxis,
          text: "回数",
        },
        type: "linear" as const,
      },
    }

    if (useDualAxis) {
      scales.yRight = {
        grid: {
          drawOnChartArea: false,
        },
        position: "right" as const,
        title: {
          display: true,
          text: "合計/上位メンバー",
        },
        type: "linear" as const,
      }
    }

    const chartJsOptions = {
      interaction: {
        intersect: false,
        mode: "nearest" as const,
      },
      maintainAspectRatio: false,
      onHover: (_event: unknown, elements: { datasetIndex: number }[]) => {
        if (elements.length > 0) {
          const datasetIndex = elements[0].datasetIndex
          const memberName = visibleMemberNames[datasetIndex]
          if (memberName) {
            setHighlightedMemberRef.current(memberName)
          }
        } else {
          setHighlightedMemberRef.current(null)
        }
      },
      plugins: {
        legend: {
          display: false, // カスタム凡例を使用するため非表示
        },
        title: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"line">) => {
              const { dataIndex, dataset, raw } = context
              const label = dataset.label || ""
              const currentValue = raw as number

              // 前月のデータを取得
              if (dataIndex > 0) {
                const prevValue = dataset.data[dataIndex - 1] as number | null
                if (prevValue !== null && prevValue !== undefined) {
                  const diff = currentValue - prevValue
                  const sign = diff >= 0 ? "+" : ""
                  return `${label}: ${currentValue} (${sign}${diff})`
                }
              }
              return `${label}: ${currentValue}`
            },
          },
        },
      },
      responsive: true,
      scales,
    }

    return { chartJsData, chartJsOptions, rightAxisMembers, useDualAxis }
  }, [chartData, hiddenMembers, highlightedMember])

  if (!chartData || !chartJsData || !chartJsOptions) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">データがありません</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>推移</CardTitle>
      </CardHeader>
      <CardContent>
        {/* グラフ */}
        <div className="overflow-x-auto">
          <div
            className="min-w-[800px]"
            style={{ height: 500 }}
            onMouseLeave={() => setHighlightedMember(null)}
          >
            <Line data={chartJsData} options={chartJsOptions} />
          </div>
        </div>

        {/* カスタム凡例 */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:block md:space-y-2">
            {Object.entries(chartData.unitGroups).map(([unitName, unitMembers]) => {
              const memberNames = unitMembers.map((m) => m.name)
              const allHidden = memberNames.every((name) => hiddenMembers.has(name))
              const someHidden = !allHidden && memberNames.some((name) => hiddenMembers.has(name))

              return (
                <div key={unitName} className="md:block md:space-y-1">
                  {/* ユニット名（クリックで一括ON/OFF） */}
                  <button
                    type="button"
                    onClick={() => toggleUnit(unitMembers)}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-semibold transition-colors hover:bg-slate-200",
                      allHidden
                        ? "text-slate-400 line-through"
                        : someHidden
                          ? "text-slate-500"
                          : "text-slate-600"
                    )}
                  >
                    {unitName}
                  </button>
                  {/* メンバー一覧 */}
                  <div className="contents md:flex md:flex-wrap md:gap-x-3 md:gap-y-1">
                    {unitMembers.map((member) => {
                      const isHidden = hiddenMembers.has(member.name)
                      const isRightAxis = useDualAxis && rightAxisMembers.includes(member.name)
                      const isHighlighted = highlightedMember === member.name
                      return (
                        <button
                          key={member.name}
                          type="button"
                          onClick={() => toggleMember(member.name)}
                          onMouseEnter={() => !isHidden && setHighlightedMember(member.name)}
                          onMouseLeave={() => setHighlightedMember(null)}
                          className={cn(
                            "flex items-center gap-1.5 rounded px-1 py-0.5 transition-all hover:bg-slate-100",
                            isHidden && "opacity-40",
                            isHighlighted && "ring-2 ring-slate-400 ring-offset-1"
                          )}
                        >
                          {/* 右軸はひし形、左軸は四角 */}
                          <div
                            className="h-2.5 w-6 shrink-0"
                            style={{
                              backgroundColor: isHidden ? "#cbd5e1" : member.color,
                              borderRadius: isRightAxis ? "0" : "2px",
                              transform: isRightAxis ? "rotate(45deg) scale(0.7)" : "none",
                            }}
                          />
                          <span className={cn("truncate text-xs", isHidden && "line-through")}>
                            {member.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

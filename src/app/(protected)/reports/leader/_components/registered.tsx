"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetApiCharacters } from "@/lib/api/generated/characters/characters"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { DataTable } from "./data-table"
import { IncreaseBreakdownChart } from "./increase-breakdown-chart"
import { TrendChart } from "./trend-chart"

interface RegisteredProps {
  leaderSheetUrl: string
}

export interface ColorInfo {
  bgColor: string
  color: string
  unitBgColor?: string
  unitColor?: string
  unitName?: string
}

async function fetchLeaderData(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("データの取得に失敗しました")
  }
  const text = await response.text()
  return parseCSV(text)
}

function parseCSV(text: string) {
  const lines = text.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())
  const data = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    return headers.reduce(
      (obj, header, index) => {
        obj[header] = values[index]
        return obj
      },
      {} as Record<string, string>
    )
  })
  return { data, headers }
}

export function Registered({ leaderSheetUrl }: RegisteredProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  // キャラクター情報を取得
  const { data: charactersData } = useGetApiCharacters()
  const characters = useMemo(
    () => charactersData?.data?.characters || [],
    [charactersData?.data?.characters]
  )

  const {
    data: csvData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: () => fetchLeaderData(leaderSheetUrl),
    queryKey: ["leaderData", leaderSheetUrl],
    // キャッシュしない（都度最新データを取得）
    staleTime: 0,
  })

  // ヘッダーとカラー情報をマッピング（1列目は空欄、2列目以降はキャラクター名）
  const headerData = useMemo(() => {
    if (!csvData) return { colorMap: {}, displayHeaders: [] }

    const displayHeaders: string[] = []
    const colorMap: Record<string, ColorInfo> = {}

    csvData.headers.forEach((header, index) => {
      if (index === 0) {
        displayHeaders.push("") // 1列目は空欄
      } else {
        const character = characters.find((c) => c.code === header)
        if (character) {
          displayHeaders.push(character.name)
          colorMap[header] = {
            bgColor: character.bgColor,
            color: character.color,
            unitBgColor: character.unit?.bgColor,
            unitColor: character.unit?.color,
            unitName: character.unit?.name,
          }
        } else {
          displayHeaders.push(header)
        }
      }
    })

    return { colorMap, displayHeaders }
  }, [csvData, characters])

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    await refetch()
    setIsRetrying(false)
  }, [refetch])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState
        title="データの読み込みに失敗しました"
        message="リーダーボードデータを取得できませんでした。URLが正しいか確認してください。"
        onRetry={handleRetry}
        retrying={isRetrying}
      />
    )
  }

  if (!csvData) {
    return null
  }

  return (
    <Tabs defaultValue="data-table" className="space-y-4">
      <TabsList>
        <TabsTrigger value="data-table">一覧表</TabsTrigger>
        <TabsTrigger value="trend-chart">推移</TabsTrigger>
        <TabsTrigger value="increase-breakdown-chart">増加内訳</TabsTrigger>
      </TabsList>
      <TabsContent value="data-table">
        <DataTable
          data={csvData.data}
          headers={headerData.displayHeaders}
          originalHeaders={csvData.headers}
          colorMap={headerData.colorMap}
        />
      </TabsContent>
      <TabsContent value="trend-chart">
        <TrendChart
          data={csvData.data}
          headers={headerData.displayHeaders}
          originalHeaders={csvData.headers}
          colorMap={headerData.colorMap}
        />
      </TabsContent>
      <TabsContent value="increase-breakdown-chart">
        <IncreaseBreakdownChart
          data={csvData.data}
          headers={headerData.displayHeaders}
          originalHeaders={csvData.headers}
          colorMap={headerData.colorMap}
        />
      </TabsContent>
    </Tabs>
  )
}

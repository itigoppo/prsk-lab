"use client"
import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { useGetApiUsersSettings } from "@/lib/api/generated/settings/settings"
import { useCallback, useState } from "react"
import { Registered } from "./registered"
import { Unregistered } from "./unregistered"

export function LeaderReport() {
  // 設定の取得
  const { data, error, isLoading, refetch } = useGetApiUsersSettings()
  const leaderSheetUrl = data?.data?.leaderSheetUrl ?? null

  // リトライ状態
  const [isRetrying, setIsRetrying] = useState(false)

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
        title="設定の読み込みに失敗しました"
        message="設定情報を取得できませんでした。もう一度お試しください。"
        onRetry={handleRetry}
        retrying={isRetrying}
      />
    )
  }

  if (!leaderSheetUrl) {
    return <Unregistered />
  }

  return <Registered leaderSheetUrl={leaderSheetUrl} />
}

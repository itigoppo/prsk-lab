"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField } from "@/components/ui/form-field"
import {
  useGetApiUsersSettings,
  usePatchApiUsersSettings,
  usePostApiUsersSettings,
} from "@/lib/api/generated/settings/settings"
import type { UpdateSettingDto } from "@/lib/schemas/dto/setting"
import { updateSettingDtoSchema } from "@/lib/schemas/dto/setting"
import { getApiErrorMessage } from "@/lib/utils/error"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"

export function SettingsForm() {
  // 設定の取得
  const { data, error, isLoading, refetch } = useGetApiUsersSettings()
  const settings = data?.data

  // 設定の作成・更新
  const postMutation = usePostApiUsersSettings()
  const patchMutation = usePatchApiUsersSettings()

  // リトライ状態
  const [isRetrying, setIsRetrying] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<UpdateSettingDto>({
    defaultValues: {
      leaderSheetUrl: "",
    },
    resolver: zodResolver(updateSettingDtoSchema),
  })

  // 取得した設定を初期値にセット
  useEffect(() => {
    if (settings) {
      reset({
        leaderSheetUrl: settings.leaderSheetUrl || "",
      })
    }
  }, [settings, reset])

  const onSubmit = useCallback(
    async (values: UpdateSettingDto) => {
      try {
        if (settings?.isRegistered) {
          // 既存設定を更新
          await patchMutation.mutateAsync({
            data: { leaderSheetUrl: values.leaderSheetUrl },
          })
        } else {
          // 新規設定を作成
          await postMutation.mutateAsync({
            data: { leaderSheetUrl: values.leaderSheetUrl },
          })
        }
        toast.success("設定を保存しました")
      } catch (error) {
        const errorMessage = getApiErrorMessage(error, "設定の保存に失敗しました")
        toast.error(errorMessage)
      }
    },
    [settings?.isRegistered, patchMutation, postMutation]
  )

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    await refetch()
    setIsRetrying(false)
  }, [refetch])

  const isSaving = postMutation.isPending || patchMutation.isPending

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>アプリケーション設定</CardTitle>
        <CardDescription>リーダーボードスプレッドシートのURLを設定できます</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="リーダースプレッドシートURL"
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            error={errors.leaderSheetUrl?.message}
            description={
              <div className="space-y-2">
                <p>
                  Google
                  スプレッドシートをCSV形式で公開し、そのURLを入力してください。リーダーボードデータの集計に使用されます。
                </p>
                <div className="space-y-1">
                  <p className="font-semibold">CSV形式で公開する方法:</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>Google スプレッドシートを開く</li>
                    <li>「ファイル」→「共有」→「ウェブに公開」を選択</li>
                    <li>「リンク」タブで「カンマ区切り形式(.csv)」を選択</li>
                    <li>「公開」をクリックして表示されたURLをコピー</li>
                  </ol>
                </div>
                <p>
                  <a
                    href="/templates/leader-sheet-template.csv"
                    download
                    className="text-teal-600 underline hover:text-teal-700"
                  >
                    サンプルCSVをダウンロード
                  </a>
                  して、スプレッドシートのフォーマットを確認できます。
                </p>
              </div>
            }
            {...register("leaderSheetUrl")}
          />

          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils/common"

interface ErrorStateProps {
  error?: unknown
  message?: string
  onRetry: () => void
  retrying?: boolean
  title?: string
}

function getErrorMessage(error: unknown): string {
  if (!error) return ""
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null) {
    // Axios error
    if ("message" in error && typeof error.message === "string") {
      return error.message
    }
    // Response error
    if ("response" in error && typeof error.response === "object" && error.response !== null) {
      const response = error.response as { data?: { message?: string }; statusText?: string }
      if (response.data?.message) return response.data.message
      if (response.statusText) return response.statusText
    }
  }
  return "エラーが発生しました"
}

export function ErrorState({ error, message, onRetry, retrying, title }: ErrorStateProps) {
  const errorMessage = getErrorMessage(error)
  return (
    <Card className="mx-auto w-full max-w-2xl space-y-6">
      {title && (
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="material-symbols-outlined text-red-600">info</span>
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("space-y-6", !title && "pt-6")}>
        {message && (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={onRetry}
            disabled={retrying}
            className="flex items-center gap-2"
          >
            {retrying ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span>
                再試行中...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">refresh</span>
                再試行
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

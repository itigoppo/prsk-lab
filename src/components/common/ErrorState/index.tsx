import { Alert, AlertDescription } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { cn } from "@/lib/utils/common"

interface ErrorStateProps {
  error?: string
  message?: string
  onRetry: () => void
  retrying?: boolean
  title?: string
}

export function ErrorState({ error, message, onRetry, retrying, title }: ErrorStateProps) {
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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

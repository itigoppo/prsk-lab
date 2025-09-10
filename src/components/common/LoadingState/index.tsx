import { IconTofu } from "@/components/icons"

export function LoadingState() {
  return (
    <div className="mx-auto flex h-[calc(100vh-200px)] items-center justify-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <IconTofu className="w-20 text-slate-300" />
        </div>

        <div className="flex items-center gap-8">
          <div className="bg-prsk-player1-400 size-4 animate-ping rounded-full" />
          <div className="bg-prsk-player2-400 size-4 animate-ping rounded-full" />
          <div className="bg-prsk-player3-400 size-4 animate-ping rounded-full" />
          <div className="bg-prsk-player4-400 size-4 animate-ping rounded-full" />
          <div className="bg-prsk-player5-400 size-4 animate-ping rounded-full" />
          <div className="bg-prsk-left-400 size-4 animate-ping rounded-full" />
          <div className="bg-prsk-right-400 size-4 animate-ping rounded-full" />
        </div>
      </div>
    </div>
  )
}

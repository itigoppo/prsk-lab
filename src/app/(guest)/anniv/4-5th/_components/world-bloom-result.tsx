"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/common"
import { usePathname } from "next/navigation"
import { useWorldBloomContext } from "../_contexts/world-bloom-context"

export function WorldBloomResult() {
  const { state } = useWorldBloomContext()
  const pathname = usePathname()

  const selectedStamps = [
    state.acquisition.stamp.selectedStampLiveBonus,
    state.acquisition.stamp.selectedStampMusic,
    state.acquisition.stamp.selectedStampLive,
    state.acquisition.stamp.selectedStampEvent,
    state.acquisition.stamp.selectedStampMoney,
  ].filter((stamp) => stamp)

  return (
    <div className="sticky bottom-0 z-10 bg-slate-600 px-4 py-2 text-xs text-white">
      <div className="relative space-y-2">
        <div className="absolute top-1 right-1">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              window.location.href = pathname
            }}
          >
            reset
          </Button>
        </div>
        <div className="space-y-1">
          <div>ワールドピース残数</div>
        </div>

        <div>
          {(selectedStamps.length < 5 || selectedStamps.length > 5) && (
            <>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500">warning</span>
                <div>スタンプカードの枚数を見直してください ({selectedStamps.length}/5)</div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2 text-sm">
          {[
            {
              color: "text-white",
              count: state.result.worldPieces,
              icon: <span className="material-symbols-outlined">blur_circular</span>,
            },
          ].map(({ color, count, icon }, index) => (
            <div key={index} className={cn(color, "flex items-center gap-1")}>
              {icon}
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

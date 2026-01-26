"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/common"
import { usePathname } from "next/navigation"
import { useFortuneFlowerContext } from "../_contexts/fortune-flower-context"

export function FortuneFlowerResult() {
  const { state } = useFortuneFlowerContext()
  const pathname = usePathname()

  const selectedStampsBloom = [
    state.acquisition.stamp.bloom.selectedStampIroiro,
    state.acquisition.stamp.bloom.selectedStampLive,
    state.acquisition.stamp.bloom.selectedStampKizuna,
    state.acquisition.stamp.bloom.selectedStampLogin,
    state.acquisition.stamp.bloom.selectedStampGachi,
    state.acquisition.stamp.bloom.isStampShop,
  ].filter((stamp) => stamp)

  const selectedStampsConnect = [
    state.acquisition.stamp.connect.selectedStampIroiro,
    state.acquisition.stamp.connect.selectedStampLive,
    state.acquisition.stamp.connect.selectedStampKizuna,
    state.acquisition.stamp.connect.selectedStampLogin,
    state.acquisition.stamp.connect.selectedStampGachi,
  ].filter((stamp) => stamp)

  const selectedStampsCheer = [
    state.acquisition.stamp.cheer.selectedStampIroiro,
    state.acquisition.stamp.cheer.selectedStampLive,
    state.acquisition.stamp.cheer.selectedStampKizuna,
    state.acquisition.stamp.cheer.selectedStampLogin,
    state.acquisition.stamp.cheer.selectedStampGachi,
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
          <div>花びら残数</div>
          <div>
            ※全て花びら換算
            <br className="block md:hidden" />
            (花びら100=フォーチュンフラワー1)
          </div>
          <div>※補填で白と青は一律+25</div>
        </div>

        <div>
          {(selectedStampsBloom.length < 4 ||
            selectedStampsBloom.length > 4 ||
            selectedStampsConnect.length < 3 ||
            selectedStampsConnect.length > 3 ||
            selectedStampsCheer.length < 3 ||
            selectedStampsCheer.length > 3) && (
            <>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-500">warning</span>
                <div>
                  {(selectedStampsBloom.length < 4 || selectedStampsBloom.length > 4) && (
                    <div>
                      BLOOM期間のスタンプカード枚数を見直してください ({selectedStampsBloom.length}
                      /4)
                    </div>
                  )}
                  {(selectedStampsConnect.length < 3 || selectedStampsConnect.length > 3) && (
                    <div>
                      CONNECT期間のスタンプカード枚数を見直してください (
                      {selectedStampsConnect.length}/3)
                    </div>
                  )}
                  {(selectedStampsCheer.length < 3 || selectedStampsCheer.length > 3) && (
                    <div>
                      CHEER期間のスタンプカード枚数を見直してください ({selectedStampsCheer.length}
                      /3)
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-7 gap-2 text-sm">
          {[
            {
              color: "text-pink-300",
              count: state.result.wildFlowers,
              icon: (
                <>
                  <span className="grid size-6 place-items-center rounded-full bg-linear-to-r from-pink-300 to-purple-400 text-[10px] leading-4 font-bold text-white">
                    wild
                  </span>
                </>
              ),
            },
            {
              color: "text-white",
              count: state.result.whitePetals,
              icon: <span className="material-symbols-outlined">energy_savings_leaf</span>,
            },
            {
              color: "text-blue-500",
              count: state.result.bluePetals,
              icon: <span className="material-symbols-outlined">energy_savings_leaf</span>,
            },
            {
              color: "text-green-500",
              count: state.result.greenPetals,
              icon: <span className="material-symbols-outlined">energy_savings_leaf</span>,
            },
            {
              color: "text-red-500",
              count: state.result.redPetals,
              icon: <span className="material-symbols-outlined">energy_savings_leaf</span>,
            },
            {
              color: "text-orange-500",
              count: state.result.orangePetals,
              icon: <span className="material-symbols-outlined">energy_savings_leaf</span>,
            },
            {
              color: "text-purple-500",
              count: state.result.purplePetals,
              icon: <span className="material-symbols-outlined">energy_savings_leaf</span>,
            },
          ].map(({ color, count, icon }, index) => (
            <div key={index} className={cn(color, "flex flex-col items-center gap-1")}>
              {icon}
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

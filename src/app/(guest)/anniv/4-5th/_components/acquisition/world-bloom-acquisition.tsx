import { EntirePeriod } from "./entire-period/entire-period"

export function WorldBloomAcquisition() {
  return (
    <div className="text-sm">
      <div className="border-b-2 border-slate-700 bg-slate-100 p-4 text-base font-bold text-slate-700">
        獲得場所を選択する
      </div>

      {/* 全期間 */}
      <EntirePeriod />
    </div>
  )
}

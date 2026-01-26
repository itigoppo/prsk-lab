import { EntirePeriod } from "./entire-period/entire-period"
import { PeriodSection } from "./period-section"

export function FortuneFlowerAcquisition() {
  return (
    <div className="text-sm">
      <div className="border-b-2 border-slate-700 bg-slate-100 p-4 text-base font-bold text-slate-700">
        獲得場所を選択する
      </div>

      {/* 全期間 */}
      <EntirePeriod />

      {/* BLOOM期間 */}
      <PeriodSection times={1} />

      {/* CONNECT期間 */}
      <PeriodSection times={2} />

      {/* CHEER期間 */}
      <PeriodSection times={3} />
    </div>
  )
}

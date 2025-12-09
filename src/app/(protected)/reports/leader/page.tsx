import { LeaderReport } from "./_components/leader-report"

export default function LeaderReportPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">analytics</span>
        <div>リーダー回数</div>
      </div>
      <LeaderReport />
    </div>
  )
}

import type { Metadata } from "next"
import { AdminDashboard } from "./_components/admin-dashboard"

export const metadata: Metadata = {
  title: "管理",
}

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">admin_panel_settings</span>
        <div>管理</div>
      </div>
      <AdminDashboard />
    </div>
  )
}

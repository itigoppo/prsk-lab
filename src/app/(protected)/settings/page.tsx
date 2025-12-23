import type { Metadata } from "next"
import { SettingsForm } from "./_components/settings-form"

export const metadata: Metadata = {
  title: "設定",
}

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">settings</span>
        <div>設定</div>
      </div>
      <SettingsForm />
    </div>
  )
}

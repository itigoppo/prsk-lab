import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const adminSections = [
  {
    description: "家具タグの一覧・作成・編集・削除",
    href: "/admin/furniture-tags",
    icon: "sell",
    title: "タグ管理",
  },
  {
    description: "家具グループの一覧・作成・編集・削除",
    href: "/admin/furniture-groups",
    icon: "workspaces",
    title: "グループ管理",
  },
]

export function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {adminSections.map((section) => (
        <Link key={section.href} href={section.href}>
          <Card className="transition hover:shadow-md">
            <CardHeader>
              <CardTitle>
                <span className="material-symbols-outlined mr-2 align-middle">{section.icon}</span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

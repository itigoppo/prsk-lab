// ナビゲーションアイテムの型定義
interface NavigationItem {
  description?: string
  href: string
  icon?: string
  isAdmin?: boolean
  isProtected?: boolean
  title: string
}

// メインナビゲーション（ヘッダーの横並びメニュー）
export const mainNavigationItems: NavigationItem[] = [
  {
    description: "トップ",
    href: "/",
    title: "TOP",
  },
  {
    description: "とうふの森",
    href: "/mysekai",
    isProtected: true,
    title: "My SEKAI",
  },
  {
    description: "周年キャンペーン",
    href: "/anniv",
    title: "Anniversary",
  },
  {
    description: "イベントボーナス",
    href: "/calc/event",
    title: "Event Bonus",
  },
  {
    description: "キャラソート",
    href: "/play/sort",
    title: "Play Sort",
  },
  {
    description: "リーダー回数",
    href: "/reports/leader",
    isProtected: true,
    title: "Leader",
  },
  {
    description: "設定",
    href: "/settings",
    isProtected: true,
    title: "Settings",
  },
]

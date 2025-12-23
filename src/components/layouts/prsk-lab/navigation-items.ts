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
    description: "4.5周年キャンペーン",
    href: "/anniv/4-5th",
    title: "4.5th Anniversary",
  },
  {
    description: "4周年キャンペーン",
    href: "/anniv/4th",
    title: "4th Anniversary",
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

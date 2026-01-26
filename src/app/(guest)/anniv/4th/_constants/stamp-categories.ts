import {
  Stamp,
  stampGachiRegular,
  stampGachiUnlimited,
  stampIroiroRegular,
  stampIroiroUnlimited,
  stampKizunaCasual,
  stampKizunaRegular,
  stampLiveCasual,
  stampLiveRegular,
  stampLoginCasual,
  stampLoginRegular,
} from "./stamps"

export type StampType = "bloom" | "connect" | "cheer"
export type StampCategory = "Iroiro" | "Gachi" | "Live" | "Kizuna" | "Login"

type ColorConfig = {
  color: string
  colorKey: string
}

export const colorsByTimes: Record<number, ColorConfig[]> = {
  1: [
    { color: "ホワイト", colorKey: "white" },
    { color: "ブルー", colorKey: "blue" },
  ],
  2: [
    { color: "グリーン", colorKey: "green" },
    { color: "レッド", colorKey: "red" },
  ],
  3: [
    { color: "オレンジ", colorKey: "orange" },
    { color: "パープル", colorKey: "purple" },
  ],
}

type StampVariant = {
  name: string
  stamp: Stamp
  suffix: string
}

export type StampChild = {
  category: StampCategory
  level: string
  name: string
  stamp: Stamp
  stampType: StampType
  times: number
}

const generateChildren = (category: StampCategory, variants: StampVariant[]): StampChild[] => {
  return Object.entries(colorsByTimes).flatMap(([t, colors]) =>
    colors.flatMap(({ color, colorKey }) =>
      variants.map(({ name: variantName, stamp, suffix }) => ({
        category,
        level: `${colorKey}${suffix}`,
        name: `${color}${variantName}`,
        stamp,
        stampType: (Number(t) === 1 ? "bloom" : Number(t) === 2 ? "connect" : "cheer") as StampType,
        times: Number(t),
      }))
    )
  )
}

export type CardType = "iroiro" | "gachi" | "live" | "kizuna" | "login"

export type StampCategoryConfig = {
  category: StampCategory
  children: StampChild[]
  name: string
  stampCardType: CardType
}

export const stampCategories: StampCategoryConfig[] = [
  {
    category: "Iroiro",
    children: generateChildren("Iroiro", [
      { name: "レギュラー", stamp: stampIroiroRegular, suffix: "regular" },
      { name: "アンリミテッド", stamp: stampIroiroUnlimited, suffix: "unlimited" },
    ]),
    name: "イロイロ",
    stampCardType: "iroiro",
  },
  {
    category: "Gachi",
    children: generateChildren("Gachi", [
      { name: "レギュラー", stamp: stampGachiRegular, suffix: "regular" },
      { name: "アンリミテッド", stamp: stampGachiUnlimited, suffix: "unlimited" },
    ]),
    name: "ガチ",
    stampCardType: "gachi",
  },
  {
    category: "Live",
    children: generateChildren("Live", [
      { name: "カジュアル", stamp: stampLiveCasual, suffix: "casual" },
      { name: "レギュラー", stamp: stampLiveRegular, suffix: "regular" },
    ]),
    name: "ライブ",
    stampCardType: "live",
  },
  {
    category: "Kizuna",
    children: generateChildren("Kizuna", [
      { name: "カジュアル", stamp: stampKizunaCasual, suffix: "casual" },
      { name: "レギュラー", stamp: stampKizunaRegular, suffix: "regular" },
    ]),
    name: "キズナ",
    stampCardType: "kizuna",
  },
  {
    category: "Login",
    children: generateChildren("Login", [
      { name: "カジュアル", stamp: stampLoginCasual, suffix: "casual" },
      { name: "レギュラー", stamp: stampLoginRegular, suffix: "regular" },
    ]),
    name: "ログイン",
    stampCardType: "login",
  },
]

// ショップカード（times=1のみ）
export const shopCardConfig = {
  name: "ショップ",
  timesOnly: 1,
}

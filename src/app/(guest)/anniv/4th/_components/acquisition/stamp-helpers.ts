import { CardType, StampType } from "../../_constants/stamp-categories"
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
} from "../../_constants/stamps"

export type { CardType, StampType }

export const getStampType = (times: number): StampType =>
  times === 1 ? "bloom" : times === 2 ? "connect" : "cheer"

export const typeLabels: Record<CardType, string> = {
  gachi: "ガチ",
  iroiro: "イロイロ",
  kizuna: "キズナ",
  live: "ライブ",
  login: "ログイン",
}

export const colorLabels: Record<string, string> = {
  blue: "ブルー",
  green: "グリーン",
  orange: "オレンジ",
  purple: "パープル",
  red: "レッド",
  white: "ホワイト",
}

export const levelSuffixLabels: Record<string, string> = {
  casual: "カジュアル",
  regular: "レギュラー",
  unlimited: "アンリミテッド",
}

export const extractColorFromLevel = (level: string | null): string | null => {
  if (!level) return null
  const colors = ["white", "blue", "green", "red", "orange", "purple"]
  return colors.find((c) => level.startsWith(c)) ?? null
}

export const getStampFromTypeAndLevel = (type: CardType, level: string | null): Stamp | null => {
  if (!level) return null
  const isRegular = level.endsWith("regular")
  const isUnlimited = level.endsWith("unlimited")
  const isCasual = level.endsWith("casual")

  switch (type) {
    case "iroiro":
      return isRegular ? stampIroiroRegular : isUnlimited ? stampIroiroUnlimited : null
    case "gachi":
      return isRegular ? stampGachiRegular : isUnlimited ? stampGachiUnlimited : null
    case "live":
      return isCasual ? stampLiveCasual : isRegular ? stampLiveRegular : null
    case "kizuna":
      return isCasual ? stampKizunaCasual : isRegular ? stampKizunaRegular : null
    case "login":
      return isCasual ? stampLoginCasual : isRegular ? stampLoginRegular : null
  }
}

export const createColorRequired = (color: string | null, value: number) => ({
  blue: color === "blue" ? value : 0,
  green: color === "green" ? value : 0,
  orange: color === "orange" ? value : 0,
  purple: color === "purple" ? value : 0,
  red: color === "red" ? value : 0,
  white: color === "white" ? value : 0,
  wild: 0,
})

export const getSelectedStampKey = (type: CardType) =>
  `selectedStamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "selectedStampIroiro"
    | "selectedStampGachi"
    | "selectedStampLive"
    | "selectedStampKizuna"
    | "selectedStampLogin"

export const getStampKey = (type: CardType) =>
  `stamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "stampIroiro"
    | "stampGachi"
    | "stampLive"
    | "stampKizuna"
    | "stampLogin"

export const getSetStampKey = (type: CardType) =>
  `setStamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "setStampIroiro"
    | "setStampGachi"
    | "setStampLive"
    | "setStampKizuna"
    | "setStampLogin"

export const buildLabel = (
  selectedLevel: string | null,
  color: string | null,
  type: CardType
): string | null => {
  if (!selectedLevel || !color) return null
  const colorLabel = colorLabels[color]
  const typeLabel = typeLabels[type]
  const suffix = selectedLevel.replace(color, "")
  const suffixLabel = levelSuffixLabels[suffix]
  return `${colorLabel} ${typeLabel}カード ${suffixLabel}`
}

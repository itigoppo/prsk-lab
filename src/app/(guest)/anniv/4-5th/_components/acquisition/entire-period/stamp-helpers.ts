import {
  Stamp,
  stampEventCasual,
  stampEventRegular,
  stampEventUnlimited,
  stampLiveBonusCasual,
  stampLiveBonusRegular,
  stampLiveBonusUnlimited,
  stampLiveCasual,
  stampLiveRegular,
  stampLiveUnlimited,
  stampMoneyDiamond,
  stampMoneyGold,
  stampMoneyStandard,
  stampMusicCasual,
  stampMusicRegular,
  stampMusicUnlimited,
  StampType,
} from "../../../_constants/stamps"

export type { StampType }

export const typeLabels: Record<StampType, string> = {
  event: "イベントP",
  live: "ライブ",
  liveBonus: "ライブボーナス",
  money: "ガチャ/ショップ",
  music: "楽曲",
}

export const levelLabels: Record<string, string> = {
  casual: "カジュアル",
  diamond: "ダイヤモンド",
  gold: "ゴールド",
  regular: "レギュラー",
  standard: "スタンダード",
  unlimited: "アンリミテッド",
}

export const getStampFromTypeAndLevel = (type: StampType, level: string | null): Stamp | null => {
  if (!level) return null

  const stampMapping: Record<StampType, Record<string, Stamp>> = {
    event: {
      casual: stampEventCasual,
      regular: stampEventRegular,
      unlimited: stampEventUnlimited,
    },
    live: {
      casual: stampLiveCasual,
      regular: stampLiveRegular,
      unlimited: stampLiveUnlimited,
    },
    liveBonus: {
      casual: stampLiveBonusCasual,
      regular: stampLiveBonusRegular,
      unlimited: stampLiveBonusUnlimited,
    },
    money: {
      diamond: stampMoneyDiamond,
      gold: stampMoneyGold,
      standard: stampMoneyStandard,
    },
    music: {
      casual: stampMusicCasual,
      regular: stampMusicRegular,
      unlimited: stampMusicUnlimited,
    },
  }

  return stampMapping[type]?.[level] ?? null
}

export const getSelectedStampKey = (type: StampType) =>
  `selectedStamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "selectedStampLiveBonus"
    | "selectedStampMusic"
    | "selectedStampLive"
    | "selectedStampEvent"
    | "selectedStampMoney"

export const getStampKey = (type: StampType) =>
  `stamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "stampLiveBonus"
    | "stampMusic"
    | "stampLive"
    | "stampEvent"
    | "stampMoney"

export const getSetStampKey = (type: StampType) =>
  `setStamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "setStampLiveBonus"
    | "setStampMusic"
    | "setStampLive"
    | "setStampEvent"
    | "setStampMoney"

export const getSetSelectedStampKey = (type: StampType) =>
  `setSelectedStamp${type.charAt(0).toUpperCase()}${type.slice(1)}` as
    | "setSelectedStampLiveBonus"
    | "setSelectedStampMusic"
    | "setSelectedStampLive"
    | "setSelectedStampEvent"
    | "setSelectedStampMoney"

export const buildLabel = (level: string | null, type: StampType): string | null => {
  if (!level) return null
  const levelLabel = levelLabels[level]
  const typeLabel = typeLabels[type]
  return `${levelLabel}${typeLabel}カード`
}

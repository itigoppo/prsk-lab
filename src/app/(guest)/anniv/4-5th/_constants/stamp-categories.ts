import {
  Stamp,
  stampEventCasual,
  stampEventRegular,
  stampEventUnlimited,
  StampLevel1,
  StampLevel2,
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
} from "./stamps"

export type StampChild = {
  level: StampLevel1 | StampLevel2
  name: string
  stamp: Stamp
}

export type StampCategory = {
  children: StampChild[]
  name: string
  type: StampType
}

export const stampCategories: StampCategory[] = [
  {
    children: [
      { level: "casual", name: "カジュアルライブボーナス", stamp: stampLiveBonusCasual },
      { level: "regular", name: "レギュラーライブボーナス", stamp: stampLiveBonusRegular },
      { level: "unlimited", name: "アンリミテッドライブボーナス", stamp: stampLiveBonusUnlimited },
    ],
    name: "ライブボーナス",
    type: "liveBonus",
  },
  {
    children: [
      { level: "casual", name: "カジュアル楽曲", stamp: stampMusicCasual },
      { level: "regular", name: "レギュラー楽曲", stamp: stampMusicRegular },
      { level: "unlimited", name: "アンリミテッド楽曲", stamp: stampMusicUnlimited },
    ],
    name: "楽曲",
    type: "music",
  },
  {
    children: [
      { level: "casual", name: "カジュアルライブ", stamp: stampLiveCasual },
      { level: "regular", name: "レギュラーライブ", stamp: stampLiveRegular },
      { level: "unlimited", name: "アンリミテッドライブ", stamp: stampLiveUnlimited },
    ],
    name: "ライブ",
    type: "live",
  },
  {
    children: [
      { level: "casual", name: "カジュアルイベントP", stamp: stampEventCasual },
      { level: "regular", name: "レギュラーイベントP", stamp: stampEventRegular },
      { level: "unlimited", name: "アンリミテッドイベントP", stamp: stampEventUnlimited },
    ],
    name: "イベントP",
    type: "event",
  },
  {
    children: [
      { level: "standard", name: "スタンダードガチャ/ショップ", stamp: stampMoneyStandard },
      { level: "gold", name: "ゴールドガチャ/ショップ", stamp: stampMoneyGold },
      { level: "diamond", name: "ダイヤモンドガチャ/ショップ", stamp: stampMoneyDiamond },
    ],
    name: "ガチャ/ショップ",
    type: "money",
  },
]

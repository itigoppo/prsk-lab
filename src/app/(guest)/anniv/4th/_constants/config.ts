// 報酬交換レート (花びら消費量)
export const REWARD_COSTS = {
  crystal: 25, // 石
  drink: 25, // ライボ
  droplet: 25, // 雫
  practice: 25, // 練スコ
  skill: 25, // スキスコ
  virtualCoin: 25, // バチャコ
} as const

// 純結晶の必要コスト
export const UNIT_CRYSTAL_COST = 100

// イベント交換所の倍率
export const EVENT_BADGE_MULTIPLIER = 5

// ブルフェス
export const FES_BONUS_INTERVAL = 50

// 服ガチャ報酬
export const GACHA_COSTUME_REWARD = 100

// ハピネスガチャ報酬
export const HAPPINESS_REWARD = 2

// 補填報酬
export const COMPENSATION_REWARD = 25

// アニバカード所持報酬
export const ANNIV_CARD_REWARD = 1

// 後夜祭ステッカー
export const AFTER_PARTY_STICKER = {
  color: 10, // 色付き
  wild: 1, // ワイルド
} as const

export type FortuneFlowerConfig = {
  bonusButtonLabel: string
  dateEnd: string
  dateStart?: string
  dateStrikethrough?: string
  gradientClass: string
  name: string
}

export const fortuneFlowerConfigByTimes: Record<number, FortuneFlowerConfig> = {
  1: {
    bonusButtonLabel: "ブルフェスガチャボーナス",
    dateEnd: "10/12",
    dateStart: "9/30〜",
    dateStrikethrough: "10/11",
    gradientClass: "from-white to-sky-200",
    name: "BLOOM",
  },
  2: {
    bonusButtonLabel: "ハッピネスガチャおまけ",
    dateEnd: "10/12〜10/21",
    dateStrikethrough: "10/11",
    gradientClass: "from-green-200 to-red-200",
    name: "CONNECT",
  },
  3: {
    bonusButtonLabel: "フラワーアソートガチャ交換所",
    dateEnd: "10/21〜10/31",
    gradientClass: "from-orange-200 to-purple-200",
    name: "CHEER",
  },
}

export type EventConfig = {
  date: string
  dateStrikethrough?: string
  name: string
}

export const eventConfigByTimes: Record<number, EventConfig> = {
  1: { date: "09/30〜10/09", name: "混合寧々バナー" },
  2: { date: "10/12〜10/19", dateStrikethrough: "10/11", name: "25箱瑞希バナー" },
  3: { date: "10/21〜10/29", name: "VBS箱彰人バナー" },
}

export const eventRankRange = [
  {
    petals: 100,
    rank: 10000,
  },
  {
    petals: 75,
    rank: 50000,
  },
  {
    petals: 50,
    rank: 100000,
  },
  {
    petals: 25,
    rank: 300000,
  },
  {
    petals: 0,
    rank: 0,
  },
]

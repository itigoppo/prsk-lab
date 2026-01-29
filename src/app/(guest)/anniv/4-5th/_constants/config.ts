// キャンペーン日程
export const CAMPAIGN_DATES = {
  end: "04/08",
  start: "03/30",
} as const

export const CAMPAIGN_PERIOD = `${CAMPAIGN_DATES.start}〜${CAMPAIGN_DATES.end}`

// 報酬交換レート (ワールドピース消費量)
export const REWARD_COSTS = {
  crystal: 10, // 石
  drink: 10, // ライボ
  droplet: 30, // 雫
  gachaTicket: 300, // ガチャチケ
  miracleGem: 5, // 虹ジェム
  practice: 10, // 練スコ
  pureCrystal: 200, // 純結晶
  skill: 30, // スキスコ
  virtualCoin: 10, // バチャコ
} as const

// イベント関連
export const EVENT_BADGE_MULTIPLIER = 10 // イベント交換所の倍率

// ブルフェス
export const FES_BONUS = {
  interval: 50, // 50毎に
  reward: 100, // 100ワールドピース
} as const

// ギフトガチャ
export type GiftGachaType = "premium" | "heartfelt"

export const GIFT_GACHA_CONFIG: Record<GiftGachaType, { label: string; reward: number }> = {
  heartfelt: { label: "ハートフルギフトガチャ", reward: 200 },
  premium: { label: "プレミアムプレゼントガチャ", reward: 200 },
}

// スタンプカード必要枚数
export const REQUIRED_STAMP_CARDS = 5

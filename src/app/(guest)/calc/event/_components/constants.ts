// デッキの総数
export const NUM_DECKS = 5

// 星4レアリティのマスターランクボーナス率
const STAR4_RATES = [10, 12.5, 15, 17.5, 20, 25]

export const MASTER_RANK_RATE: Record<string, number[]> = {
  bd: [5, 7, 9, 11, 13, 15],
  pu: STAR4_RATES,
  star1: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
  star2: [0, 0.2, 0.4, 0.6, 0.8, 1],
  star3: [0, 1, 2, 3, 4, 5],
  star4: STAR4_RATES,
}

// レアリティの表示名
export const RANK_NAMES: Record<string, string> = {
  bd: "BD",
  star1: "★1",
  star2: "★2",
  star3: "★3",
  star4: "★4",
}

// イベントボーナスのパーセンテージ
export const BONUS_PERCENTAGE = 25 // タイプ/キャラクター一致時の共通ボーナス
export const BOUNS_TYPE = BONUS_PERCENTAGE
export const BOUNS_CHARACTER = BONUS_PERCENTAGE
export const BOUNS_CHARACTER_VS = BONUS_PERCENTAGE
export const PU_CHARACTER = 20

// レアリティのキー（選択順）
export const RARE_KEYS = ["pu", "star4", "bd", "star3", "star2", "star1"] as const

// ボーナス設定のキー
export const BONUS_TYPE_KEYS = ["on", "off"] as const
export const BONUS_CHARACTER_KEYS = ["on", "vs", "off"] as const

// デッキのUIバリアント
export const DECK_VARIANTS = ["deck1", "deck2", "deck3", "deck4", "deck5"] as const

// デッキ設定のUIラベル
export const RARE_LABELS = ["PU★4", "既存★4", "BD", "★3", "★2", "★1"] as const
export const MASTER_RANK_LABELS = Array.from({ length: 6 }, (_, i) => String(i))
export const BONUS_TYPE_LABELS = ["一致", "不一致"] as const
export const BONUS_CHARACTER_LABELS = ["一致", "無印バチャシン", "不一致"] as const

// ボーナス計算表示用のランク表示順（puを除外）
export const RANK_DISPLAY_ORDER = ["star4", "bd", "star3", "star2", "star1"] as const

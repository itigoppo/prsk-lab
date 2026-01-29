export type StampType = "liveBonus" | "music" | "live" | "event" | "money"
export type StampLevel1 = "casual" | "regular" | "unlimited" | null
export type StampLevel2 = "standard" | "gold" | "diamond" | null

type Mission = {
  mission: string
  substitute?: string
}

export type Stamp = {
  complete: number
  missions: Mission[]
}

// ライボカード
export const stampLiveBonusCasual: Stamp = {
  complete: 5,
  missions: [
    { mission: "ライボ5消費" },
    { mission: "ライボ10消費" },
    { mission: "ライボ15消費" },
    { mission: "ライボ20消費" },
    { mission: "ライボ30消費" },
    { mission: "ライボ40消費" },
    { mission: "ライボ50消費" },
  ],
}

export const stampLiveBonusRegular: Stamp = {
  complete: 10,
  missions: [
    { mission: "ライボ10消費" },
    { mission: "ライボ20消費" },
    { mission: "ライボ30消費" },
    { mission: "ライボ40消費" },
    { mission: "ライボ60消費" },
    { mission: "ライボ80消費" },
    { mission: "ライボ100消費" },
  ],
}

export const stampLiveBonusUnlimited: Stamp = {
  complete: 20,
  missions: [
    { mission: "ライボ30消費" },
    { mission: "ライボ50消費" },
    { mission: "ライボ100消費" },
    { mission: "ライボ150消費" },
    { mission: "ライボ200消費" },
    { mission: "ライボ250消費" },
    { mission: "ライボ300消費" },
  ],
}

// 楽曲カード
export const stampMusicCasual: Stamp = {
  complete: 5,
  missions: [
    { mission: "1種クリア(オート可)" },
    { mission: "2種クリア(オート可)" },
    { mission: "3種クリア(オート可)" },
    { mission: "4種クリア(オート可)" },
    { mission: "5種クリア(オート可)" },
    { mission: "7種クリア(オート可)" },
    { mission: "10種クリア(オート可)" },
  ],
}

export const stampMusicRegular: Stamp = {
  complete: 10,
  missions: [
    { mission: "1種クリア(オート可)" },
    { mission: "3種クリア(オート可)" },
    { mission: "5種クリア(オート可)" },
    { mission: "10種クリア(オート可)" },
    { mission: "15種クリア(オート可)" },
    { mission: "20種クリア(オート可)" },
    { mission: "25種クリア(オート可)" },
  ],
}

export const stampMusicUnlimited: Stamp = {
  complete: 20,
  missions: [
    { mission: "1種クリア(オート可)" },
    { mission: "5種クリア(オート可)" },
    { mission: "10種クリア(オート可)" },
    { mission: "20種クリア(オート可)" },
    { mission: "30種クリア(オート可)" },
    { mission: "40種クリア(オート可)" },
    { mission: "50種クリア(オート可)" },
  ],
}

// ライブカード
export const stampLiveCasual: Stamp = {
  complete: 5,
  missions: [
    { mission: "1回ライブ" },
    { mission: "5回ライブ" },
    { mission: "10回ライブ" },
    { mission: "15回ライブ" },
    { mission: "20回ライブ" },
    { mission: "25回ライブ" },
    { mission: "30回ライブ" },
  ],
}

export const stampLiveRegular: Stamp = {
  complete: 20,
  missions: [
    { mission: "1回フルコン" },
    { mission: "2回フルコン" },
    { mission: "3回フルコン" },
    { mission: "5回フルコン" },
    { mission: "7回フルコン" },
    { mission: "10回フルコン" },
    { mission: "15回フルコン" },
  ],
}

export const stampLiveUnlimited: Stamp = {
  complete: 30,
  missions: [
    { mission: "1回AP" },
    { mission: "2回AP" },
    { mission: "3回AP" },
    { mission: "5回AP" },
    { mission: "7回AP" },
    { mission: "10回AP" },
    { mission: "15回AP" },
  ],
}

// イベントPカード
export const stampEventCasual: Stamp = {
  complete: 10,
  missions: [
    { mission: "イベントPを1万獲得" },
    { mission: "イベントPを3万獲得" },
    { mission: "イベントPを5万獲得" },
    { mission: "イベントPを10万獲得" },
    { mission: "イベントPを15万獲得" },
    { mission: "イベントPを20万獲得" },
    { mission: "イベントPを30万獲得" },
  ],
}

export const stampEventRegular: Stamp = {
  complete: 20,
  missions: [
    { mission: "イベントPを1万獲得" },
    { mission: "イベントPを5万獲得" },
    { mission: "イベントPを15万獲得" },
    { mission: "イベントPを30万獲得" },
    { mission: "イベントPを50万獲得" },
    { mission: "イベントPを75万獲得" },
    { mission: "イベントPを100万獲得" },
  ],
}

export const stampEventUnlimited: Stamp = {
  complete: 30,
  missions: [
    { mission: "イベントPを1万獲得" },
    { mission: "イベントPを10万獲得" },
    { mission: "イベントPを30万獲得" },
    { mission: "イベントPを50万獲得" },
    { mission: "イベントPを100万獲得" },
    { mission: "イベントPを150万獲得" },
    { mission: "イベントPを200万獲得" },
  ],
}

// 課金カード
export const stampMoneyStandard: Stamp = {
  complete: 10,
  missions: [
    { mission: "1回ガチャ" },
    { mission: "5回ガチャ" },
    { mission: "10回ガチャ" },
    { mission: "20回ガチャ" },
    { mission: "30回ガチャ" },
    { mission: "40回ガチャ" },
    { mission: "50回ガチャ" },
  ],
}

export const stampMoneyGold: Stamp = {
  complete: 50,
  missions: [
    { mission: "100回ガチャ" },
    { mission: "フェスorレオニ箱ガチャを50回" },
    { mission: "プレミアムプレゼントガチャ1回" },
    { mission: "セレクトガチャ1回" },
    { mission: "ハートフルギフトガチャ1回" },
    { mission: "周年セット1種購入" },
    { mission: "プレパスorマイセカイミッションパス購入" },
  ],
}

export const stampMoneyDiamond: Stamp = {
  complete: 100,
  missions: [
    { mission: "200回ガチャ" },
    { mission: "フェスorレオニ箱ガチャを100回" },
    { mission: "プレミアムプレゼントガチャ1回" },
    { mission: "セレクトガチャ1回" },
    { mission: "ハートフルギフトガチャ1回" },
    { mission: "周年セット2種購入" },
    { mission: "プレパスorマイセカイミッションパス購入" },
  ],
}

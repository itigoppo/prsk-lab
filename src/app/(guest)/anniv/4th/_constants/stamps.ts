export type StampLevel1Bloom =
  | "whiteregular"
  | "whiteunlimited"
  | "blueregular"
  | "blueunlimited"
  | null
export type StampLevel2Bloom = "whitecasual" | "whiteregular" | "bluecasual" | "blueregular" | null

export type StampLevel1Connect =
  | "greenregular"
  | "greenunlimited"
  | "redregular"
  | "redunlimited"
  | null
export type StampLevel2Connect = "greencasual" | "greenregular" | "redcasual" | "redregular" | null

export type StampLevel1Cheer =
  | "orangeregular"
  | "orangeunlimited"
  | "purpleregular"
  | "purpleunlimited"
  | null
export type StampLevel2Cheer =
  | "orangecasual"
  | "orangeregular"
  | "purplecasual"
  | "purpleregular"
  | null

type Mission = {
  mission: string
  petals: number
  substitute?: string
}

export type Stamp = {
  complete: number
  missions: Mission[]
}

export const stampIroiroRegular: Stamp = {
  complete: 40,
  missions: [
    { mission: "SF5回", petals: 4 },
    { mission: "対象のユニットキャラを編成して10回ライブ", petals: 4 },
    { mission: "イベント報酬の星3をLV50にする", petals: 4 },
    { mission: "イベスト最終話読む", petals: 4 },
    { mission: "アフライ参加", petals: 5 },
    { mission: "ライボ100消費", petals: 7 },
    { mission: "イベントP、70万獲得", petals: 7 },
  ],
}

export const stampIroiroUnlimited: Stamp = {
  complete: 50,
  missions: [
    { mission: "SF10回", petals: 5 },
    { mission: "対象のユニットキャラを編成して20回ライブ", petals: 5 },
    {
      mission: "イベント関連のサイストを4話読む",
      petals: 5,
      substitute: "イベント関連のサイストを1話読む",
    },
    { mission: "イベストすべてちゃんと読む", petals: 5 },
    { mission: "アフライ参加して1500応援", petals: 10 },
    { mission: "ライボ300消費", petals: 10 },
    { mission: "イベントP、150万獲得", petals: 10 },
  ],
}

export const stampLiveCasual: Stamp = {
  complete: 15,
  missions: [
    { mission: "熱風を5回", petals: 1 },
    { mission: "対象のユニット曲を10回", petals: 2 },
    { mission: "10曲クリア", petals: 1 },
    { mission: "みんらい10回", petals: 1 },
    { mission: "50回ライブ", petals: 1 },
    { mission: "2DMVモードで5回ライブ", petals: 2 },
    { mission: "3DMVモードで5回ライブ", petals: 2 },
  ],
}

export const stampLiveRegular: Stamp = {
  complete: 30,
  missions: [
    { mission: "熱風を10回", petals: 2 },
    { mission: "対象のユニット曲を15回", petals: 3 },
    { mission: "15曲クリア", petals: 2 },
    { mission: "みんらい15回", petals: 2 },
    { mission: "100回ライブ", petals: 3 },
    { mission: "パーフェクト2万回", petals: 3 },
    { mission: "フルコン15回", petals: 5 },
  ],
}

export const stampKizunaCasual: Stamp = {
  complete: 15,
  missions: [
    { mission: "1組ランクアップ", petals: 1 },
    { mission: "3組ランクアップ", petals: 1 },
    { mission: "5組ランクアップ", petals: 1 },
    { mission: "7組ランクアップ", petals: 1 },
    { mission: "9組ランクアップ", petals: 1 },
    { mission: "12組ランクアップ", petals: 2 },
    { mission: "15組ランクアップ", petals: 3 },
  ],
}

export const stampKizunaRegular: Stamp = {
  complete: 30,
  missions: [
    { mission: "1組ランクアップ", petals: 2 },
    { mission: "5組ランクアップ", petals: 3 },
    { mission: "10組ランクアップ", petals: 3 },
    { mission: "15組ランクアップ", petals: 3 },
    { mission: "20組ランクアップ", petals: 3 },
    { mission: "25組ランクアップ", petals: 3 },
    { mission: "30組ランクアップ", petals: 3 },
  ],
}

export const stampLoginCasual: Stamp = {
  complete: 8,
  missions: [
    { mission: "1日", petals: 1 },
    { mission: "2日", petals: 1 },
    { mission: "3日", petals: 1 },
    { mission: "4日", petals: 1 },
    { mission: "5日", petals: 1 },
    { mission: "6日", petals: 1 },
    { mission: "7日", petals: 1 },
  ],
}

export const stampLoginRegular: Stamp = {
  complete: 15,
  missions: [
    { mission: "1日", petals: 1 },
    { mission: "2日", petals: 1 },
    { mission: "3日", petals: 1 },
    { mission: "4日", petals: 1 },
    { mission: "5日", petals: 1 },
    { mission: "7日", petals: 2 },
    { mission: "10日", petals: 3 },
  ],
}

export const stampGachiRegular: Stamp = {
  complete: 15,
  missions: [
    { mission: "MVP/SUPERSTARを5回", petals: 1 },
    { mission: "ランクマ10回", petals: 1 },
    { mission: "Lv27-28を5回フルコン", petals: 1 },
    { mission: "Lv29を5回フルコン", petals: 1 },
    { mission: "Lv30以上を5回クリア", petals: 1 },
    { mission: "熱風難易度5つをフルコン", petals: 2 },
    { mission: "エキスパ以上AP5回", petals: 3 },
  ],
}

export const stampGachiUnlimited: Stamp = {
  complete: 30,
  missions: [
    { mission: "MVP/SUPERSTARを10回", petals: 2 },
    { mission: "ランクマ20回", petals: 2 },
    { mission: "Lv30-31を5回フルコン", petals: 2 },
    { mission: "Lv32を5回フルコン", petals: 2 },
    { mission: "Lv33以上を5回クリア", petals: 2 },
    { mission: "熱風難易度5つをAP", petals: 4 },
    { mission: "マスターでAP3回", petals: 6 },
  ],
}

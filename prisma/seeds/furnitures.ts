import { createId } from "@paralleldrive/cuid2"
import { PrismaClient } from "@prisma/client"

// キャラクターコード定数
const Characters = {
  // Leo/need
  ichika: "leoneed_ichica",
  saki: "leoneed_saki",
  honami: "leoneed_honami",
  shiho: "leoneed_shiho",
  ln_miku: "leoneed_miku",
  ln_luka: "leoneed_luka",
  // MMJ
  minori: "mmj_minori",
  haruka: "mmj_haruka",
  airi: "mmj_airi",
  shizuku: "mmj_shizuku",
  mmj_miku: "mmj_miku",
  mmj_rin: "mmj_rin",
  // VBS
  kohane: "vbs_kohane",
  an: "vbs_an",
  akito: "vbs_akito",
  toya: "vbs_toya",
  vbs_miku: "vbs_miku",
  vbs_len: "vbs_len",
  vbs_meiko: "vbs_meiko",
  // WxS
  tsukasa: "ws_tsukasa",
  emu: "ws_emu",
  nene: "ws_nene",
  rui: "ws_rui",
  ws_miku: "ws_miku",
  ws_kaito: "ws_kaito",
  // 25時
  kanade: "oclock_kanade",
  mafuyu: "oclock_mafuyu",
  ena: "oclock_ena",
  mizuki: "oclock_mizuki",
  oc_miku: "oclock_miku",
} as const

// リアクション定義の型
type ReactionDef = string[] // Character.code[]

// 家具定義の型
type FurnitureDef = {
  name: string
  reactions: ReactionDef[]
  groupName?: string
}

// タグ定義の型
type TagDef = {
  name: string
  furnitures: FurnitureDef[]
}

// ヘルパー: ソロリアクション生成
const solo = (memberIds: string[]): ReactionDef[] => memberIds.map((id) => [id])

// ヘルパー: ペア（2人組み合わせ）生成
const pairs = (memberIds: string[]): ReactionDef[] => {
  const result: ReactionDef[] = []
  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      result.push([memberIds[i], memberIds[j]])
    }
  }
  return result
}

// ヘルパー: 指定メンバーを除外
const exclude = (memberIds: string[], excludeIds: string[]): string[] =>
  memberIds.filter((id) => !excludeIds.includes(id))

// ヘルパー: 指定メンバーのみ
const only = (memberIds: string[], includeIds: string[]): string[] =>
  memberIds.filter((id) => includeIds.includes(id))

// メンバー定義
const leoneed = [
  Characters.ichika,
  Characters.saki,
  Characters.honami,
  Characters.shiho,
  Characters.ln_miku,
  Characters.ln_luka,
]
const mmj = [
  Characters.minori,
  Characters.haruka,
  Characters.airi,
  Characters.shizuku,
  Characters.mmj_miku,
  Characters.mmj_rin,
]
const vbs = [
  Characters.kohane,
  Characters.an,
  Characters.akito,
  Characters.toya,
  Characters.vbs_miku,
  Characters.vbs_len,
  Characters.vbs_meiko,
]
const ws = [
  Characters.tsukasa,
  Characters.emu,
  Characters.nene,
  Characters.rui,
  Characters.ws_miku,
  Characters.ws_kaito,
]
const oclock = [
  Characters.kanade,
  Characters.mafuyu,
  Characters.ena,
  Characters.mizuki,
  Characters.oc_miku,
]

// 家具グループ定義
const furnitureGroups = [
  { name: "ソファ群" },
  { name: "ミュージックプレイヤー" },
  { name: "花壇" },
  { name: "ラティスプランター" },
  { name: "ガーデンカート" },
  { name: "狐像" },
  { name: "スタンドマイク" },
  { name: "ロマンチックガーデンの彫刻" },
]

// グループ内でリアクション共有から除外するキャラクター組み合わせ
// 除外された組み合わせはグループ内の他の家具とチェック状態を共有しない
// exclusions: 各要素が1つの除外組み合わせ（ソロなら1要素、ペアなら2要素の配列）
const furnitureGroupExclusions: { groupName: string; exclusions: string[][] }[] = [
  {
    // ソファ群: 遥、愛莉、雫は各ソファで別リアクション
    groupName: "ソファ群",
    exclusions: [
      ...solo(only(mmj, [Characters.haruka, Characters.airi, Characters.shizuku])),
      ...solo(only(oclock, [Characters.mizuki])),
    ],
  },
  {
    // ミュージックプレイヤー: ln_miku と mmj_miku のみグループ共有、他は個別
    groupName: "ミュージックプレイヤー",
    exclusions: [
      ...solo(exclude(leoneed, [Characters.ln_miku])),
      ...solo(exclude(mmj, [Characters.mmj_miku])),
      ...solo(vbs),
      ...solo(ws),
      ...solo(oclock),
    ],
  },
]

// タグデータ
const tags: TagDef[] = [
  // きらめく流星ルーム
  {
    name: "きらめく流星ルーム",
    furnitures: [
      { name: "きらめく流星のチェスト", reactions: solo(leoneed) },
      { name: "きらめく流星のベッド", reactions: solo(leoneed) },
      { name: "きらめく流星のテーブル", reactions: solo(leoneed) },
      { name: "きらめく流星のラグ", reactions: solo(leoneed) },
      { name: "きらめく流星のソファ", reactions: pairs(leoneed), groupName: "ソファ群" },
      {
        name: "あの日のジャングルジム",
        reactions: [[Characters.ichika, Characters.saki, Characters.honami, Characters.shiho]],
      },
    ],
  },
  // かがやくクローバールーム
  {
    name: "かがやくクローバールーム",
    furnitures: [
      { name: "かがやくクローバーのチェスト", reactions: solo(mmj) },
      { name: "かがやくクローバーのベッド", reactions: solo(mmj) },
      { name: "かがやくクローバーのテーブル", reactions: solo(mmj) },
      { name: "かがやくクローバーのラグ", reactions: solo(mmj) },
      { name: "かがやくクローバーのソファ", reactions: pairs(mmj), groupName: "ソファ群" },
      {
        name: "配信用カメラ",
        reactions: [[Characters.minori, Characters.haruka, Characters.airi, Characters.shizuku]],
      },
    ],
  },
  // 鮮やかなユニゾンルーム
  {
    name: "鮮やかなユニゾンルーム",
    furnitures: [
      { name: "鮮やかなユニゾンのチェスト", reactions: solo(vbs) },
      { name: "鮮やかなユニゾンのベッド", reactions: solo(vbs) },
      { name: "鮮やかなユニゾンのテーブル", reactions: solo(vbs) },
      { name: "鮮やかなユニゾンのラグ", reactions: solo(vbs) },
      { name: "鮮やかなユニゾンのソファ", reactions: pairs(vbs), groupName: "ソファ群" },
      {
        name: "ぷよぷよ通",
        reactions: [[Characters.kohane, Characters.an, Characters.akito, Characters.toya]],
      },
    ],
  },
  // はじけるクラウンルーム
  {
    name: "はじけるクラウンルーム",
    furnitures: [
      { name: "はじけるクラウンのチェスト", reactions: solo(ws) },
      { name: "はじけるクラウンのベッド", reactions: solo(ws) },
      { name: "はじけるクラウンのテーブル", reactions: solo(ws) },
      { name: "はじけるクラウンのラグ", reactions: solo(ws) },
      { name: "はじけるクラウンのソファ", reactions: pairs(ws), groupName: "ソファ群" },
      {
        name: "ネネロボのオブジェ",
        reactions: [[Characters.tsukasa, Characters.emu, Characters.nene, Characters.rui]],
      },
    ],
  },
  // ひび割れたハートルーム
  {
    name: "ひび割れたハートルーム",
    furnitures: [
      { name: "ひび割れたハートのチェスト", reactions: solo(oclock) },
      { name: "ひび割れたハートのベッド", reactions: solo(oclock) },
      { name: "ひび割れたハートのテーブル", reactions: solo(oclock) },
      { name: "ひび割れたハートのラグ", reactions: solo(oclock) },
      { name: "ひび割れたハートのソファ", reactions: pairs(oclock), groupName: "ソファ群" },
      {
        name: "いつものファミレス席",
        reactions: [[Characters.kanade, Characters.mafuyu, Characters.ena, Characters.mizuki]],
      },
    ],
  },
  // ミュージックプレイヤー
  {
    name: "ミュージックプレイヤー",
    furnitures: [
      {
        name: "コンポーネントオーディオ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.rui, Characters.ws_miku, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
        groupName: "ミュージックプレイヤー",
      },
      {
        name: "レコードプレイヤー",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.ws_miku, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
        groupName: "ミュージックプレイヤー",
      },
      {
        name: "蓄音機",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
        groupName: "ミュージックプレイヤー",
      },
    ],
  },
  // ひみつのおみせ
  {
    name: "ひみつのおみせ",
    furnitures: [
      {
        name: "シンプルなノートパソコン",
        reactions: [
          ...solo(only(mmj, [Characters.minori, Characters.shizuku])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
      {
        name: "シンプルなデスクトップパソコン",
        reactions: [
          ...solo(only(leoneed, [Characters.ln_luka])),
          ...solo(only(vbs, [Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
    ],
  },
  // ゲート
  {
    name: "ゲート",
    furnitures: [
      {
        name: "ゲート",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
    ],
  },
  // ナチュラル
  {
    name: "ナチュラル",
    furnitures: [
      {
        name: "ナチュラルなチェスト",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
      {
        name: "ナチュラルなベッド",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ナチュラルなダイニングテーブル",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ナチュラルな本棚",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ナチュラルなクローゼット",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ナチュラルなドレッサー",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_len, Characters.vbs_meiko])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "ナチュラルなローテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.honami])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "ナチュラルな2人掛けソファ",
        groupName: "ソファ群",
        reactions: [
          ...solo(exclude(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(only(oclock, [Characters.mizuki])),
          ...pairs(leoneed),
          ...pairs(mmj),
          ...pairs(vbs),
          ...pairs(ws),
          ...pairs(oclock),
        ],
      },
      {
        name: "ナチュラルな1人掛けソファ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.vbs_miku])),
          ...solo(only(ws, [Characters.ws_miku])),
          ...solo(oclock),
        ],
      },
      {
        name: "ナチュラルな液晶テレビ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.toya])),
          ...solo(only(ws, [Characters.ws_miku, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.mafuyu])),
          [Characters.haruka, Characters.shizuku],
        ],
      },
    ],
  },
  // シンプルポップキッチン
  {
    name: "シンプルポップキッチン",
    furnitures: [
      {
        name: "コンロ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu])),
          [Characters.an, Characters.akito],
          [Characters.vbs_miku, Characters.vbs_meiko],
        ],
      },
      {
        name: "シンク",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.airi])),
          ...solo(only(vbs, [Characters.an, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.ena])),
        ],
      },
      {
        name: "冷蔵庫",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "カッティングボード",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu, Characters.ena])),
          [Characters.an, Characters.toya],
          [Characters.rui, Characters.ws_miku],
        ],
      },
      {
        name: "調味料ラック",
        reactions: [
          ...solo(only(leoneed, [Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku])),
          ...solo(only(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
        ],
      },
      {
        name: "積み重なった食器",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.emu])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
      {
        name: "コーヒーメーカー",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.airi, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu, Characters.ena])),
          [Characters.akito, Characters.toya],
        ],
      },
      {
        name: "ポップアップトースター",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu, Characters.ena])),
          [Characters.ichika, Characters.ln_miku],
        ],
      },
      {
        name: "オーブンレンジ",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.kohane, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.emu, Characters.rui])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
          [Characters.ichika, Characters.honami],
        ],
      },
      {
        name: "野菜バスケット",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami])),
          ...solo(exclude(mmj, [Characters.airi, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
    ],
  },
  // クリーンパウダールーム
  {
    name: "クリーンパウダールーム",
    furnitures: [
      {
        name: "洗面台",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.emu, Characters.nene])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "洗濯機",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.emu, Characters.nene])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "ハンディ掃除機",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
          [Characters.haruka, Characters.mmj_rin],
        ],
      },
      {
        name: "歯ブラシとコップ",
        reactions: [
          ...solo(only(mmj, [Characters.airi, Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito])),
          ...solo(only(ws, [Characters.emu])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
          [Characters.tsukasa, Characters.ws_miku],
        ],
      },
      {
        name: "ドライヤー",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
          [Characters.shiho, Characters.ln_luka],
        ],
      },
    ],
  },
  // ガーデン
  {
    name: "ガーデン",
    furnitures: [
      {
        name: "ガーデンの素朴な花壇",
        groupName: "花壇",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
          [Characters.emu, Characters.rui],
        ],
      },
      {
        name: "ガーデンの素朴な花壇/ポピー",
        groupName: "花壇",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンの素朴な花壇/コスモス",
        groupName: "花壇",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンの素朴な花壇/ラベンダー",
        groupName: "花壇",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンのパラソルテーブル",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(exclude(ws, [Characters.emu, Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
          [Characters.ws_miku, Characters.ws_kaito],
        ],
      },
      {
        name: "ガーデンのベンチ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_miku, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(
            only(vbs, [
              Characters.toya,
              Characters.vbs_miku,
              Characters.vbs_len,
              Characters.vbs_meiko,
            ])
          ),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンのアイアンチェア",
        reactions: [...solo(only(mmj, [Characters.shizuku]))],
      },
      {
        name: "ガーデンのラティスプランター",
        groupName: "ラティスプランター",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
          [Characters.haruka, Characters.mmj_miku],
        ],
      },
      {
        name: "ガーデンのラティスプランター/ポピー",
        groupName: "ラティスプランター",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンのラティスプランター/コスモス",
        groupName: "ラティスプランター",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンのラティスプランター/ラベンダー",
        groupName: "ラティスプランター",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンのステップラダー",
        reactions: [
          ...solo(only(leoneed, [Characters.ln_miku])),
          ...solo(only(mmj, [Characters.shizuku])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンツールシェルフ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_miku, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.an, Characters.akito])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンカート",
        groupName: "ガーデンカート",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンカート/ポピー",
        groupName: "ガーデンカート",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンカート/コスモス",
        groupName: "ガーデンカート",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンカート/ラベンダー",
        groupName: "ガーデンカート",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "ガーデンのブリキじょうろ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an])),
          ...solo(ws),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
    ],
  },
  // 公園
  {
    name: "公園",
    furnitures: [
      {
        name: "ブランコ",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.shiho, Characters.ln_miku],
          [Characters.emu, Characters.nene],
        ],
      },
      {
        name: "滑り台",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "くまのスプリング遊具",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.an, Characters.toya, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.airi, Characters.mmj_rin],
        ],
      },
      {
        name: "砂場",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.akito, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.ichika, Characters.ln_luka],
        ],
      },
      {
        name: "シーソー",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "公園のベンチ",
        reactions: [
          ...solo(only(vbs, [Characters.an, Characters.toya])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
      {
        name: "公園の時計",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "公園の噴水",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.akito, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.emu, Characters.ws_miku],
        ],
      },
      {
        name: "鉄棒",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.minori, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.nene, Characters.ws_miku],
        ],
      },
      {
        name: "公園のタイヤ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "回転ジャングルジム",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "クラシックな街灯",
        reactions: [
          ...solo(only(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu])),
        ],
      },
      {
        name: "バケツとスコップ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.akito, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.ena])),
          [Characters.nene, Characters.rui],
        ],
      },
      {
        name: "土管",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho])),
          ...solo(only(mmj, [Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.tsukasa, Characters.rui],
        ],
      },
    ],
  },
  // 素朴な和室
  {
    name: "素朴な和室",
    furnitures: [
      {
        name: "和風の素朴な鏡台",
        reactions: [
          ...solo(only(leoneed, [Characters.shiho, Characters.ln_miku, Characters.ln_luka])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
      {
        name: "和風の素朴なちゃぶ台",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.saki, Characters.ln_luka],
        ],
      },
      {
        name: "和風の素朴なテレビ",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.an, Characters.vbs_len],
        ],
      },
      {
        name: "和風の素朴な戸棚",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.vbs_miku])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene, Characters.rui])),
          ...solo(oclock),
        ],
      },
      {
        name: "和風の素朴なやかん",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki])),
          ...solo(exclude(mmj, [Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(exclude(ws, [Characters.tsukasa, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.mizuki])),
          [Characters.saki, Characters.ln_miku],
        ],
      },
      {
        name: "和風の素朴な急須",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.mizuki])),
          [Characters.kanade, Characters.mafuyu],
        ],
      },
      {
        name: "和風の素朴な黒電話",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.rui, Characters.ws_kaito],
        ],
      },
      {
        name: "和風の素朴な招き猫",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.akito, Characters.vbs_miku],
        ],
      },
    ],
  },
  // キッズルーム
  {
    name: "キッズルーム",
    furnitures: [
      {
        name: "キッズルームのカラフルチェスト",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
        ],
      },
      {
        name: "キッズルームのくまさんベッド",
        reactions: [
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(only(vbs, [Characters.an, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.rui])),
        ],
      },
      {
        name: "キッズルームのテーブル",
        reactions: [
          ...solo(only(mmj, [Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.an, Characters.toya])),
          ...solo(only(ws, [Characters.emu])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "キッズルームの絵本棚",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
          [Characters.toya, Characters.vbs_miku],
        ],
      },
      {
        name: "キッズルームのおもちゃ箱",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "キッズルームの木馬",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.oc_miku])),
          [Characters.kohane, Characters.vbs_len],
        ],
      },
      {
        name: "キッズルームの汽車のおもちゃ",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "キッズルームのミニカー",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
          [Characters.tsukasa, Characters.ws_kaito],
        ],
      },
      {
        name: "キッズルームのぞうのぬいぐるみ",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "キッズルームのびっくり箱",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.toya, Characters.vbs_len])
          ),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
          [Characters.mafuyu, Characters.mizuki],
        ],
      },
      {
        name: "キッズルームの積み木",
        reactions: [
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.toya])),
          ...solo(exclude(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
    ],
  },
  // カジュアル
  {
    name: "カジュアル",
    furnitures: [
      {
        name: "カジュアルなチェスト",
        reactions: [
          ...solo(only(leoneed, [Characters.shiho])),
          ...solo(only(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.akito, Characters.toya])),
          ...solo(only(ws, [Characters.rui])),
        ],
      },
      {
        name: "カジュアルな卓上鏡",
        reactions: [...solo(only(vbs, [Characters.toya])), ...solo(only(ws, [Characters.tsukasa]))],
      },
      {
        name: "カジュアルなベッド",
        reactions: [
          ...solo(only(leoneed, [Characters.shiho])),
          ...solo(only(vbs, [Characters.akito])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui])),
        ],
      },
      {
        name: "カジュアルな学習机",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu])),
        ],
      },
      {
        name: "カジュアルな本棚",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
          [Characters.kohane, Characters.toya],
        ],
      },
      {
        name: "カジュアルなチェッカー柄ラグ",
        reactions: [...solo(only(vbs, [Characters.vbs_len]))],
      },
      {
        name: "カジュアルなデスクライト",
        reactions: [...solo(only(vbs, [Characters.toya])), ...solo(only(ws, [Characters.tsukasa]))],
      },
      {
        name: "カジュアルな読みかけの漫画",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
          [Characters.mizuki, Characters.oc_miku],
        ],
      },
      {
        name: "カジュアルな携帯ゲーム機",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
      {
        name: "カジュアルなRCカー",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
          [Characters.emu, Characters.ws_kaito],
        ],
      },
      {
        name: "カジュアルな目覚まし時計",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mizuki])),
          [Characters.vbs_miku, Characters.vbs_len],
        ],
      },
      {
        name: "カジュアルなビーグル犬のぬいぐるみ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(
            only(vbs, [Characters.akito, Characters.toya, Characters.vbs_len, Characters.vbs_meiko])
          ),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          [Characters.honami, Characters.shiho],
        ],
      },
      {
        name: "カジュアルなハンガーラック",
        reactions: [
          ...solo(only(vbs, [Characters.akito, Characters.toya, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
          [Characters.kohane, Characters.akito],
        ],
      },
    ],
  },
  // キュート
  {
    name: "キュート",
    furnitures: [
      {
        name: "キュートなチェスト",
        reactions: [
          ...solo(only(leoneed, [Characters.honami])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "キュートなドレッサー",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami])),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki, Characters.oc_miku])),
          [Characters.an, Characters.vbs_miku],
        ],
      },
      {
        name: "キュートなベッド",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "キュートなローテブル",
        reactions: [...solo(only(mmj, [Characters.minori])), ...solo(only(ws, [Characters.nene]))],
      },
      {
        name: "キュートなクッション",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami])),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki, Characters.oc_miku])),
          [Characters.an, Characters.vbs_meiko],
        ],
      },
      {
        name: "キュートなワードローブ",
        reactions: [
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "キュートなフロアライト",
        reactions: [
          ...solo(only(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "キュートなリボンチェア",
        reactions: [
          ...solo(only(mmj, [Characters.mmj_rin])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "キュートなラグ",
        reactions: [...solo(only(oclock, [Characters.ena]))],
      },
      {
        name: "キュートなうさぎのぬいぐるみ",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.oc_miku])),
          [Characters.saki, Characters.shiho],
        ],
      },
      {
        name: "キュートなメイクボックス",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami])),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mafuyu])),
          [Characters.mafuyu, Characters.ena],
        ],
      },
      {
        name: "キュートな香水",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami])),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki, Characters.oc_miku])),
          [Characters.ena, Characters.mizuki],
        ],
      },
    ],
  },
  // フレンチスタイル
  {
    name: "フレンチスタイル",
    furnitures: [
      {
        name: "フレンチスタイルのチェスト",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.oc_miku])),
        ],
      },
      {
        name: "フレンチスタイルの姿見",
        reactions: [
          ...solo(only(leoneed, [Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.haruka])),
          ...solo(only(vbs, [Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
          [Characters.minori, Characters.shizuku],
        ],
      },
      {
        name: "フレンチスタイルのベッド",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "フレンチスタイルのラウンドテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.an, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "フレンチスタイルのソファ",
        groupName: "ソファ群",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.honami])),
          ...solo(exclude(mmj, [Characters.minori, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.an, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.oc_miku])),
          ...pairs(leoneed),
          ...pairs(mmj),
          ...pairs(vbs),
          ...pairs(ws),
          ...pairs(oclock),
        ],
      },
      {
        name: "フレンチスタイルの本棚",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(exclude(vbs, [Characters.akito, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "フレンチスタイルのテーブルライト",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.an, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
      {
        name: "フレンチスタイルのシェルフ",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_miku, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "フレンチスタイルのポールハンガー",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.vbs_miku, Characters.vbs_meiko])
          ),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "フレンチスタイルのハートラグ",
        reactions: [...solo(only(mmj, [Characters.mmj_miku]))],
      },
      {
        name: "フレンチスタイルのファッション誌",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.vbs_miku, Characters.vbs_meiko])
          ),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
          [Characters.kohane, Characters.vbs_meiko],
        ],
      },
      {
        name: "フレンチスタイルのフラワーベース",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_miku, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
      {
        name: "フレンチスタイルのアロマキャンドル",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.vbs_miku, Characters.vbs_meiko])
          ),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
          [Characters.nene, Characters.ws_kaito],
        ],
      },
      {
        name: "フレンチスタイルのくまのぬいぐるみ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.kohane])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
          [Characters.kanade, Characters.ena],
        ],
      },
      {
        name: "フレンチスタイルのティーセット",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.saki])),
          ...solo(exclude(mmj, [Characters.minori, Characters.mmj_miku])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.vbs_miku, Characters.vbs_meiko])
          ),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
          [Characters.honami, Characters.ln_luka],
          [Characters.kohane, Characters.an],
        ],
      },
    ],
  },
  // トレーニングルーム
  {
    name: "トレーニングルーム",
    furnitures: [
      {
        name: "ウォーターサーバー",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori])),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.oc_miku])),
          [Characters.kanade, Characters.oc_miku],
        ],
      },
      {
        name: "ヨガマット",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.shiho])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "腹筋ローラー",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "バランスボール",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.oc_miku])),
          [Characters.minori, Characters.airi],
        ],
      },
      {
        name: "ランニングマシン",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(exclude(ws, [Characters.tsukasa])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "2人用ランニングマシン",
        reactions: [
          ...solo(only(ws, [Characters.tsukasa, Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki])),
          [Characters.haruka, Characters.airi],
        ],
      },
      {
        name: "フィットネスバイク",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.oc_miku])),
          [Characters.tsukasa, Characters.emu],
        ],
      },
      {
        name: "ダンベル",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.oc_miku])),
          [Characters.minori, Characters.haruka],
        ],
      },
    ],
  },
  // 音楽スタジオ
  {
    name: "音楽スタジオ",
    furnitures: [
      {
        name: "シンセサイザー",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(exclude(oclock, [Characters.ena, Characters.mizuki])),
          [Characters.kanade, Characters.mizuki],
        ],
      },
      {
        name: "エレキギター",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "エレキベース",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "ドラムセット",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(exclude(oclock, [Characters.ena, Characters.mizuki])),
          [Characters.ena, Characters.oc_miku],
        ],
      },
      {
        name: "アンプ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.honami])),
          ...solo(only(vbs, [Characters.toya])),
          [Characters.ichika, Characters.shiho],
        ],
      },
      {
        name: "ヘッドホン",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "スタンドマイク",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.honami])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki])),
        ],
        groupName: "スタンドマイク",
      },
      {
        name: "山積みのCD",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.akito, Characters.vbs_len],
        ],
      },
    ],
  },
  // イベント会場
  {
    name: "イベント会場",
    furnitures: [
      {
        name: "折りたたみ会議テーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.honami])),
          ...solo(only(ws, [Characters.rui])),
        ],
      },
      {
        name: "ホワイトボード",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami])),
          ...solo(only(mmj, [Characters.airi])),
          ...solo(only(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.mizuki])),
          [Characters.saki, Characters.honami],
        ],
      },
    ],
  },
  // ゲームセンター
  {
    name: "ゲームセンター",
    furnitures: [
      {
        name: "クレーンゲーム",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami])),
          ...solo(exclude(mmj, [Characters.shizuku])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
      {
        name: "ぷよぷよeスポーツ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami])),
          ...solo(exclude(mmj, [Characters.shizuku])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.airi, Characters.mmj_miku],
        ],
      },
      {
        name: "プリシ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami])),
          ...solo(exclude(mmj, [Characters.shizuku])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.minori, Characters.mmj_rin],
        ],
      },
      {
        name: "CHUNITHM",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami])),
          ...solo(exclude(mmj, [Characters.shizuku])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.tsukasa, Characters.nene],
        ],
      },
    ],
  },
  // グリーン
  {
    name: "グリーン",
    furnitures: [
      {
        name: "アンスリウム",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.rui])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "モンステラ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.rui])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "ユッカ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi])),
          ...solo(only(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "エケベリア",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.rui])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.ena])),
          [Characters.akito, Characters.vbs_meiko],
        ],
      },
    ],
  },
  // ぽかぽかなピクニック
  {
    name: "ぽかぽかなピクニック",
    furnitures: [
      {
        name: "ぽかぽかなピクニックのレジャーシート",
        reactions: [
          ...solo(exclude(leoneed, [Characters.shiho])),
          ...solo(exclude(mmj, [Characters.haruka, Characters.shizuku])),
          ...solo(vbs),
          ...solo(exclude(ws, [Characters.tsukasa])),
          ...solo(oclock),
        ],
      },
      {
        name: "ぽかぽかなピクニックの木の箱テーブル",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.tsukasa, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
      {
        name: "ぽかぽかなピクニックの自転車",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.ln_miku])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(oclock),
          [Characters.vbs_len, Characters.vbs_meiko],
        ],
      },
      {
        name: "ぽかぽかなピクニックの切り株",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.vbs_miku])),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
      {
        name: "ぽかぽかなピクニックのサンドイッチボックス",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.mafuyu, Characters.oc_miku],
        ],
      },
      {
        name: "ぽかぽかなピクニックのフルーツジュース瓶",
        reactions: [
          ...solo(leoneed),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.minori, Characters.mmj_miku],
        ],
      },
      {
        name: "ぽかぽかなピクニックのバスケット",
        reactions: [
          ...solo(leoneed),
          ...solo(exclude(mmj, [Characters.haruka])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
      {
        name: "ぽかぽかなピクニックの花かご",
        reactions: [
          ...solo(leoneed),
          ...solo(exclude(mmj, [Characters.airi])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.shizuku, Characters.mmj_miku],
        ],
      },
      {
        name: "ぽかぽかなピクニックのお弁当箱",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.kohane, Characters.vbs_miku],
        ],
      },
      {
        name: "ぽかぽかなピクニックの水筒",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(exclude(mmj, [Characters.haruka, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.nene])),
          ...solo(exclude(oclock, [Characters.kanade])),
          [Characters.airi, Characters.shizuku],
        ],
      },
      {
        name: "ぽかぽかなピクニックのチェア",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.nene, Characters.rui])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
      {
        name: "ぽかぽかなピクニックのツリー",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
    ],
  },
  // 月が見える旅館
  {
    name: "月が見える旅館",
    furnitures: [
      {
        name: "月が見える旅館の洋箪笥",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.toya, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "月が見える旅館の座卓",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito])),
          ...solo(only(ws, [Characters.nene, Characters.rui, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "月が見える旅館の座椅子",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene, Characters.rui])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "月が見える旅館の布団",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.an, Characters.akito, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.rui, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "月が見える旅館の茶箪笥",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.vbs_len, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.rui])),
          ...solo(oclock),
        ],
      },
      {
        name: "月が見える旅館の行灯",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(oclock),
          [Characters.toya, Characters.vbs_len],
        ],
      },
      {
        name: "月が見える旅館の屏風",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.ichika, Characters.saki],
        ],
      },
      {
        name: "月が見える旅館の盆栽",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
          [Characters.shizuku, Characters.mmj_rin],
        ],
      },
      {
        name: "月が見える旅館の花瓶",
        reactions: [
          ...solo(leoneed),
          ...solo(exclude(mmj, [Characters.mmj_miku])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
    ],
  },
  // 雷神祭
  {
    name: "雷神祭",
    furnitures: [
      {
        name: "雷神祭の和太鼓",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "雷神祭の提灯",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.an, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "雷神祭のおめん屋台",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.saki, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(
            only(vbs, [Characters.kohane, Characters.an, Characters.akito, Characters.vbs_len])
          ),
          ...solo(only(ws, [Characters.tsukasa, Characters.ws_miku, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
      {
        name: "雷神祭のわたがし屋台",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.airi, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene, Characters.rui, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "雷神祭の灯籠",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.toya, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "雷神祭の池",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "雷神祭の狐像/右向き",
        groupName: "狐像",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_len])),
          ...solo(only(ws, [Characters.rui, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "雷神祭の狐像/左向き",
        groupName: "狐像",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_len])),
          ...solo(only(ws, [Characters.rui, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.ena])),
        ],
      },
      {
        name: "雷神祭の鳥居",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_miku, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.an, Characters.akito, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mafuyu])),
        ],
      },
      {
        name: "雷神祭の縁台",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.shiho, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.emu, Characters.nene, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
    ],
  },
  // 天文学者の研究室
  {
    name: "天文学者の研究室",
    furnitures: [
      {
        name: "天文学者の研究室のチェスト",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(only(ws, [Characters.emu, Characters.nene])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "天文学者の研究室の鏡",
        reactions: [
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(only(ws, [Characters.tsukasa])),
          ...solo(only(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "天文学者の研究室の天体望遠鏡",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(oclock),
          [Characters.honami, Characters.ln_miku],
        ],
      },
      {
        name: "天文学者の研究室の天蓋つきベッド",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.nene])),
          ...solo(oclock),
          [Characters.mmj_miku, Characters.mmj_rin],
        ],
      },
      {
        name: "天文学者の研究室の本棚",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki])),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(oclock),
          [Characters.toya, Characters.vbs_meiko],
        ],
      },
      {
        name: "天文学者の研究室の机",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(only(vbs, [Characters.toya])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "天文学者の研究室の椅子",
        reactions: [
          ...solo(only(ws, [Characters.rui])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "天文学者の研究室の巻紙入りの箱",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.toya, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki])),
        ],
      },
      {
        name: "天文学者の研究室の天球儀",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_rin])),
          ...solo(vbs),
          ...solo(only(ws, [Characters.nene, Characters.rui, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.ena])),
          [Characters.ln_miku, Characters.ln_luka],
        ],
      },
      {
        name: "天文学者の研究室の積み重なった本",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(vbs),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(oclock),
        ],
      },
      {
        name: "天文学者の研究室のテーブルライト",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.nene, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.mizuki])),
        ],
      },
    ],
  },
  // 旅人のキャンプ
  {
    name: "旅人のキャンプ",
    furnitures: [
      {
        name: "旅人のキャンプのテント",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "旅人のキャンプのアウトドアチェア",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.haruka])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.toya])),
          ...solo(exclude(ws, [Characters.tsukasa, Characters.emu])),
          ...solo(exclude(oclock, [Characters.mafuyu])),
        ],
      },
      {
        name: "旅人のキャンプのアウトドアテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_len, Characters.vbs_meiko])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "旅人のキャンプの焚き火料理",
        reactions: [
          ...solo(leoneed),
          ...solo(mmj),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
      {
        name: "旅人のキャンプの薪",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika])),
          ...solo(only(mmj, [Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "旅人のキャンプの雪だるま",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "旅人のキャンプのリュック",
        reactions: [
          ...solo(leoneed),
          ...solo(exclude(mmj, [Characters.minori, Characters.haruka])),
          ...solo(vbs),
          ...solo(ws),
          ...solo(oclock),
        ],
      },
      {
        name: "旅人のキャンプのアウトドアボックス",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.an, Characters.toya])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "旅人のキャンプのランタン",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.toya, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "旅人のキャンプのケトル",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.mizuki])),
        ],
      },
    ],
  },
  // スポーツ
  {
    name: "スポーツ",
    furnitures: [
      {
        name: "バスケットボール",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.shiho, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene, Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
          [Characters.kohane, Characters.an],
          [Characters.toya, Characters.vbs_len],
          [Characters.kanade, Characters.oc_miku],
        ],
      },
      {
        name: "サッカーボール",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami])),
          ...solo(only(mmj, [Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.mizuki])),
          [Characters.minori, Characters.haruka],
          [Characters.ws_miku, Characters.ws_kaito],
        ],
      },
      {
        name: "バドミントンラケット",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.an, Characters.toya])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.rui])),
          [Characters.kanade, Characters.ena],
        ],
      },
      {
        name: "テニスラケットバッグ",
        reactions: [
          ...solo(only(leoneed, [Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.emu, Characters.nene, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
          [Characters.saki, Characters.honami],
        ],
      },
      {
        name: "野球バットとグローブ",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(only(ws, [Characters.ws_miku])),
          ...solo(only(oclock, [Characters.kanade, Characters.mizuki])),
          [Characters.tsukasa, Characters.rui],
        ],
      },
      {
        name: "卓球台",
        reactions: [
          [Characters.ichika, Characters.shiho],
          [Characters.ln_miku, Characters.ln_luka],
          [Characters.airi, Characters.shizuku],
          [Characters.mmj_miku, Characters.mmj_rin],
          [Characters.akito, Characters.toya],
          [Characters.vbs_miku, Characters.vbs_meiko],
          [Characters.tsukasa, Characters.ws_kaito],
          [Characters.emu, Characters.nene],
          [Characters.mafuyu, Characters.mizuki],
        ],
      },
    ],
  },
  // 虹色アトリエルーム
  {
    name: "虹色アトリエルーム",
    furnitures: [
      {
        name: "虹色アトリエルームのチェスト",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.akito, Characters.toya])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
      {
        name: "虹色アトリエルームのスツール",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu])),
        ],
      },
      {
        name: "虹色アトリエルームのイーゼル",
        reactions: [
          ...solo(leoneed),
          ...solo(exclude(mmj, [Characters.haruka, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.tsukasa, Characters.nene])),
          ...solo(exclude(oclock, [Characters.oc_miku])),
        ],
      },
      {
        name: "虹色アトリエルームの机",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "虹色アトリエルームのシェルフ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika])),
          ...solo(exclude(mmj, [Characters.minori, Characters.airi])),
          ...solo(exclude(vbs, [Characters.toya, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.ws_kaito])),
          ...solo(oclock),
        ],
      },
      {
        name: "虹色アトリエルームのパレット",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.an, Characters.akito])),
          ...solo(exclude(ws, [Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
    ],
  },
  // リゾート
  {
    name: "リゾート",
    furnitures: [
      {
        name: "リゾートのデッキチェア",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.akito, Characters.toya, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.rui, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "リゾートの浮き輪",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.kanade, Characters.oc_miku])),
        ],
      },
      {
        name: "リゾートのパラソル",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.airi])),
          ...solo(only(vbs, [Characters.vbs_miku, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "リゾートのプール",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "リゾートのジェットバス",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "リゾートのハンモック",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ユスラヤシ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.mmj_miku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu])),
        ],
      },
      {
        name: "リゾートのローテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_len, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "リゾートのダブルソファ",
        reactions: [
          ...pairs(leoneed),
          ...pairs(mmj),
          ...pairs(vbs),
          ...pairs(ws),
          ...pairs(oclock),
        ],
        groupName: "ソファ群",
      },
    ],
  },
  // ガレージ
  {
    name: "ガレージ",
    furnitures: [
      {
        name: "ガレージの工具棚",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(only(vbs, [Characters.akito, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_kaito])),
        ],
      },
      {
        name: "ガレージの作業机",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.ln_luka])),
          ...solo(only(vbs, [Characters.akito, Characters.toya, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
      {
        name: "ガレージの車",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ガレージのバイク",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ガレージのペンキ缶",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka])),
          ...solo(only(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
    ],
  },
  // ドリーミィベビールーム
  {
    name: "ドリーミィベビールーム",
    furnitures: [
      {
        name: "ドリーミィベビールームのベッド",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami])),
          ...solo(exclude(mmj, [Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.an])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
      {
        name: "ドリーミィベビールームの絵本棚",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "ドリーミィベビールームのロッキングアニマル",
        reactions: [
          ...solo(leoneed),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_kaito])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
        ],
      },
      {
        name: "ドリーミィベビールームのクッション",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.kohane])),
          ...solo(only(ws, [Characters.nene, Characters.rui])),
          ...solo(only(oclock, [Characters.mizuki])),
        ],
      },
    ],
  },
  // たまごっちコラボ
  {
    name: "たまごっちコラボ",
    furnitures: [
      {
        name: "まめっち",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "くちぱっち",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "みみっち",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "めめっち",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
    ],
  },
  // セカイステージ
  {
    name: "セカイステージ",
    furnitures: [
      {
        name: "セカイステージのスタンドマイク",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.honami])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki])),
        ],
        groupName: "スタンドマイク",
      },
      {
        name: "セカイステージのテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
      {
        name: "セカイステージのハイテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.honami])),
          ...solo(only(mmj, [Characters.minori])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.nene])),
          ...solo(only(oclock, [Characters.ena])),
        ],
      },
      {
        name: "セカイステージのハイチェア",
        reactions: [
          ...solo(only(leoneed, [Characters.saki])),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(ws, [Characters.emu])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
      {
        name: "セカイステージのスピーカー",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.honami])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.akito, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "セカイステージのステージライト",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka])),
          ...solo(only(vbs, [Characters.kohane])),
          ...solo(only(ws, [Characters.emu, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu])),
        ],
      },
      {
        name: "セカイステージのDJブース",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
    ],
  },
  // バースデーチェア
  {
    name: "バースデーチェア",
    furnitures: [
      {
        name: "バースデーチェア",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
    ],
  },
  // ロマンチックガーデン
  {
    name: "ロマンチックガーデン",
    furnitures: [
      {
        name: "ロマンチックガーデンの馬車",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ロマンチックガーデンの彫刻/右",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
        groupName: "ロマンチックガーデンの彫刻",
      },
      {
        name: "ロマンチックガーデンの彫刻/左",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
        groupName: "ロマンチックガーデンの彫刻",
      },
      {
        name: "ロマンチックガーデンの鉢植え",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.kohane, Characters.toya])),
          ...solo(only(ws, [Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "ロマンチックガーデンの池",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ロマンチックガーデンのアーチ",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ロマンチックガーデンの紅茶",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_len, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene])),
          ...solo(only(oclock, [Characters.kanade])),
        ],
      },
      {
        name: "ロマンチックガーデンの糸杉",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "ロマンチックガーデンのガゼボ",
        reactions: [
          [Characters.ichika, Characters.ln_miku],
          [Characters.saki, Characters.ln_luka],
          [Characters.honami, Characters.shiho],
          [Characters.minori, Characters.mmj_miku],
          [Characters.haruka, Characters.shizuku],
          [Characters.airi, Characters.mmj_rin],
          [Characters.kohane, Characters.vbs_miku],
          [Characters.emu, Characters.ws_miku],
          [Characters.nene, Characters.ws_miku],
          [Characters.kanade, Characters.mafuyu],
          [Characters.mafuyu, Characters.oc_miku],
          [Characters.ena, Characters.mizuki],
        ],
      },
    ],
  },
  // ハロウィン
  {
    name: "ハロウィン",
    furnitures: [
      {
        name: "ハロウィンのかぼちゃ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.ichika, Characters.saki])),
          ...solo(exclude(mmj, [Characters.haruka, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.akito, Characters.toya])),
          ...solo(exclude(ws, [Characters.tsukasa, Characters.rui])),
          ...solo(exclude(oclock, [Characters.kanade, Characters.mizuki])),
          [Characters.ichika, Characters.saki],
          [Characters.haruka, Characters.mmj_rin],
          [Characters.akito, Characters.toya],
          [Characters.tsukasa, Characters.rui],
          [Characters.kanade, Characters.mizuki],
        ],
      },
      {
        name: "ハロウィンの枯れ木",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.rui])),
          ...solo(only(oclock, [Characters.kanade, Characters.oc_miku])),
        ],
      },
      {
        name: "ハロウィンのキャンディ",
        reactions: [
          ...solo(exclude(leoneed, [Characters.shiho, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.shizuku, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.toya])),
          ...solo(only(ws, [Characters.emu, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.kanade])),
          [Characters.shiho, Characters.ln_luka],
          [Characters.minori, Characters.airi],
          [Characters.vbs_len, Characters.vbs_meiko],
          [Characters.nene, Characters.ws_kaito],
          [Characters.mafuyu, Characters.ena],
        ],
      },
      {
        name: "ハロウィンのおばけ",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.shizuku, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.toya, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.emu, Characters.rui])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
          [Characters.honami, Characters.ln_miku],
          [Characters.shizuku, Characters.mmj_miku],
          [Characters.kohane, Characters.an],
          [Characters.akito, Characters.vbs_len],
          [Characters.emu, Characters.rui],
          [Characters.ena, Characters.oc_miku],
        ],
      },
    ],
  },
  // ヴィンテージスタイル
  {
    name: "ヴィンテージスタイル",
    furnitures: [
      {
        name: "ヴィンテージスタイルのチェスト",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.an, Characters.toya, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena])),
        ],
      },
      {
        name: "ヴィンテージスタイルの鏡",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(only(mmj, [Characters.haruka, Characters.airi, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.akito, Characters.toya, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.tsukasa, Characters.nene])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "ヴィンテージスタイルのベッド",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.airi, Characters.shizuku])),
          ...solo(only(vbs, [Characters.kohane, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene, Characters.rui])),
          ...solo(only(oclock, [Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "ヴィンテージスタイルの本棚",
        reactions: [
          ...solo(exclude(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "ヴィンテージスタイルのシェルフ",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.shiho, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.emu, Characters.ws_miku])),
          ...solo(exclude(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "ヴィンテージスタイルのポールハンガー",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.ln_miku])),
          ...solo(exclude(mmj, [Characters.haruka, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mafuyu])),
        ],
      },
      {
        name: "ヴィンテージスタイルのコーヒーメーカー",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.vbs_miku])),
          ...solo(exclude(ws, [Characters.emu, Characters.rui])),
          ...solo(only(oclock, [Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "ヴィンテージスタイルのソファ",
        reactions: [
          ...pairs(leoneed),
          ...pairs(mmj),
          ...pairs(vbs),
          ...pairs(ws),
          ...pairs(oclock),
        ],
        groupName: "ソファ群",
      },
    ],
  },
  // ほっこり温泉
  {
    name: "ほっこり温泉",
    furnitures: [
      {
        name: "ほっこり温泉の露天風呂",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "ほっこり温泉の足湯",
        reactions: [
          ...solo(exclude(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(exclude(mmj, [Characters.minori, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.kohane, Characters.toya, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "ほっこり温泉の温泉たまご",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.akito, Characters.vbs_miku])),
          ...solo(only(ws, [Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
      {
        name: "ほっこり温泉のフルーツ牛乳",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.saki, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.kohane, Characters.akito, Characters.vbs_len])),
          ...solo(exclude(ws, [Characters.nene, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.ena, Characters.oc_miku])),
        ],
      },
      {
        name: "ほっこり温泉の樽風呂",
        reactions: [
          ...solo(only(leoneed, [Characters.honami, Characters.shiho, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.nene, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.mizuki])),
        ],
      },
    ],
  },
  // クリスマス
  {
    name: "クリスマス",
    furnitures: [
      {
        name: "クリスマスのソリ",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.mmj_rin])),
          ...solo(only(vbs, [Characters.an, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.ws_miku])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "クリスマスのプレゼント",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.an, Characters.toya, Characters.vbs_len])),
          ...solo(only(ws, [Characters.nene, Characters.rui, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu])),
        ],
      },
      {
        name: "クリスマスのツリー",
        reactions: [
          [Characters.ln_miku, Characters.ln_luka],
          [Characters.mmj_miku, Characters.mmj_rin],
          [Characters.ws_miku, Characters.ws_kaito],
          [Characters.mizuki, Characters.oc_miku],
          [Characters.vbs_miku, Characters.vbs_len, Characters.vbs_meiko],
          [Characters.ichika, Characters.saki, Characters.honami, Characters.shiho],
          [Characters.minori, Characters.haruka, Characters.shizuku, Characters.airi],
          [Characters.kohane, Characters.an, Characters.akito, Characters.toya],
          [Characters.tsukasa, Characters.emu, Characters.nene, Characters.rui],
          [Characters.kanade, Characters.mafuyu, Characters.ena, Characters.mizuki],
        ],
      },
    ],
  },
  // 正月
  {
    name: "正月",
    furnitures: [
      {
        name: "門松",
        reactions: [
          [Characters.ichika, Characters.saki, Characters.ln_miku],
          [Characters.honami, Characters.shiho, Characters.ln_luka],
          [Characters.minori, Characters.haruka, Characters.mmj_miku],
          [Characters.airi, Characters.shizuku, Characters.mmj_rin],
          [Characters.kohane, Characters.an, Characters.vbs_miku],
          [Characters.akito, Characters.toya, Characters.vbs_len],
          [Characters.vbs_miku, Characters.vbs_len, Characters.vbs_meiko],
          [Characters.tsukasa, Characters.emu, Characters.ws_miku],
          [Characters.nene, Characters.rui, Characters.ws_kaito],
          [Characters.kanade, Characters.mafuyu, Characters.oc_miku],
          [Characters.ena, Characters.mizuki, Characters.oc_miku],
        ],
      },
    ],
  },
  // コズミックシャトル
  {
    name: "コズミックシャトル",
    furnitures: [
      {
        name: "コズミックシャトルのベッド",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.shiho])),
          ...solo(only(mmj, [Characters.minori, Characters.haruka, Characters.mmj_rin])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(exclude(ws, [Characters.emu, Characters.nene])),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.oc_miku])),
        ],
      },
      {
        name: "コズミックシャトルのテーブル",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.saki, Characters.ln_luka])),
          ...solo(only(mmj, [Characters.minori, Characters.airi, Characters.mmj_miku])),
          ...solo(only(vbs, [Characters.an, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(only(ws, [Characters.tsukasa, Characters.emu, Characters.rui])),
          ...solo(only(oclock, [Characters.ena, Characters.mizuki, Characters.oc_miku])),
        ],
      },
      {
        name: "コズミックシャトルのロボット",
        reactions: [
          ...solo(only(leoneed, [Characters.saki, Characters.honami, Characters.shiho])),
          ...solo(exclude(mmj, [Characters.minori, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.an, Characters.vbs_miku])),
          ...solo(ws),
          ...solo(exclude(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "コズミックシャトルの操縦席",
        reactions: [...solo(leoneed), ...solo(mmj), ...solo(vbs), ...solo(ws), ...solo(oclock)],
      },
      {
        name: "コズミックシャトルの柱",
        reactions: [
          ...solo(only(leoneed, [Characters.shiho, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.minori, Characters.shizuku])),
          ...solo(only(vbs, [Characters.akito, Characters.vbs_miku, Characters.vbs_meiko])),
          ...solo(only(ws, [Characters.tsukasa, Characters.nene, Characters.ws_kaito])),
          ...solo(only(oclock, [Characters.mafuyu, Characters.ena])),
        ],
      },
      {
        name: "コズミックシャトルの植物",
        reactions: [
          ...solo(only(leoneed, [Characters.ichika, Characters.honami, Characters.ln_miku])),
          ...solo(only(mmj, [Characters.haruka, Characters.shizuku, Characters.mmj_miku])),
          ...solo(exclude(vbs, [Characters.kohane, Characters.vbs_miku, Characters.vbs_len])),
          ...solo(only(ws, [Characters.emu, Characters.rui])),
          ...solo(only(oclock, [Characters.kanade, Characters.mafuyu])),
        ],
      },
    ],
  },
]

export const seedFurnitures = async (prisma: PrismaClient) => {
  console.log("start seeding furniture...")

  // キャラクター情報を取得
  const characters = await prisma.character.findMany({
    select: { id: true, code: true },
  })

  // codeからCharacter IDを取得するヘルパー
  const getCharacterId = (code: string): string | null => {
    const character = characters.find((c) => c.code === code)
    if (!character) {
      console.warn(`Character not found for code: ${code}`)
      return null
    }
    return character.id
  }

  // 既存データを削除
  console.log("  deleting existing data...")
  await prisma.userReactionCheck.deleteMany() // 家具が消えるならユーザーのリアクションチェックも消えないとidがずれる
  await prisma.userFurniture.deleteMany() // 家具が消えるならユーザーの家具所持状況も消えないとidがずれる
  await prisma.furnitureReactionCharacter.deleteMany()
  await prisma.furnitureReaction.deleteMany()
  await prisma.furniture.deleteMany()
  await prisma.furnitureGroupExcludedCharacter.deleteMany()
  await prisma.furnitureGroup.deleteMany()
  await prisma.furnitureTag.deleteMany()

  // 家具グループを作成
  console.log("  creating furniture groups...")
  const groupMap = new Map<string, string>()
  const now = new Date()
  for (const group of furnitureGroups) {
    const created = await prisma.furnitureGroup.create({
      data: { id: createId(), name: group.name, updatedAt: now },
    })
    groupMap.set(group.name, created.id)
  }

  // グループ除外キャラクターを作成
  console.log("  creating furniture group excluded characters...")
  for (const exclusion of furnitureGroupExclusions) {
    const groupId = groupMap.get(exclusion.groupName)
    if (!groupId) {
      console.warn(`Group not found for exclusion: ${exclusion.groupName}`)
      continue
    }
    // 各組み合わせに対してcombinationIdを生成
    for (const combination of exclusion.exclusions) {
      const combinationId = createId()
      for (const code of combination) {
        const characterId = getCharacterId(code)
        if (characterId) {
          await prisma.furnitureGroupExcludedCharacter.create({
            data: {
              id: createId(),
              groupId,
              combinationId,
              characterId,
            },
          })
        }
      }
    }
  }

  // タグ・家具・リアクションを作成
  console.log("  creating tags, furnitures, and reactions...")
  for (const tag of tags) {
    const createdTag = await prisma.furnitureTag.create({
      data: { id: createId(), name: tag.name, updatedAt: now },
    })

    for (const furniture of tag.furnitures) {
      const createdFurniture = await prisma.furniture.create({
        data: {
          id: createId(),
          name: furniture.name,
          tagId: createdTag.id,
          groupId: furniture.groupName ? (groupMap.get(furniture.groupName) ?? null) : null,
          updatedAt: now,
        },
      })

      for (const reaction of furniture.reactions) {
        const createdReaction = await prisma.furnitureReaction.create({
          data: { id: createId(), furnitureId: createdFurniture.id, updatedAt: now },
        })

        for (const code of reaction) {
          const characterId = getCharacterId(code)
          if (characterId) {
            await prisma.furnitureReactionCharacter.create({
              data: {
                id: createId(),
                reactionId: createdReaction.id,
                characterId: characterId,
              },
            })
          }
        }
      }
    }
  }

  console.log("success")
}

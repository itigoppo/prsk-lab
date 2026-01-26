"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  AFTER_PARTY_STICKER,
  ANNIV_CARD_REWARD,
  COMPENSATION_REWARD,
  EVENT_BADGE_MULTIPLIER,
  eventRankRange,
  FES_BONUS_INTERVAL,
  GACHA_COSTUME_REWARD,
  HAPPINESS_REWARD,
  REWARD_COSTS,
  UNIT_CRYSTAL_COST,
} from "../_constants/config"
import {
  liveMissionSchedule,
  premiumLiveMissionSchedule,
} from "../_constants/live-mission-schedule"
import { loginSchedule } from "../_constants/login-schedule"
import {
  stampGachiRegular,
  stampGachiUnlimited,
  stampIroiroRegular,
  stampIroiroUnlimited,
  stampKizunaCasual,
  stampKizunaRegular,
  StampLevel1Bloom,
  StampLevel1Cheer,
  StampLevel1Connect,
  StampLevel2Bloom,
  StampLevel2Cheer,
  StampLevel2Connect,
  stampLiveCasual,
  stampLiveRegular,
  stampLoginCasual,
  stampLoginRegular,
} from "../_constants/stamps"

const FortuneFlowerContext = createContext<
  | {
      dispatch: {
        acquisition: {
          setAnniversaryEventRank: Dispatch<SetStateAction<number>>
          setFesBonus: Dispatch<SetStateAction<number>>
          setHasCmpensationAnnivCard: Dispatch<SetStateAction<boolean>>
          setIsGacha25: Dispatch<SetStateAction<boolean>>
          setIsGachaLn: Dispatch<SetStateAction<boolean>>
          setIsGachaMmj: Dispatch<SetStateAction<boolean>>
          setIsGachaVbs: Dispatch<SetStateAction<boolean>>
          setIsGachaVs: Dispatch<SetStateAction<boolean>>
          setIsGachaWs: Dispatch<SetStateAction<boolean>>
          setIsHappiness: Dispatch<SetStateAction<boolean>>
          setIsPremiumLiveMission: Dispatch<SetStateAction<boolean>>
          setLiveMission: Dispatch<SetStateAction<number>>
          setLoginDays: Dispatch<SetStateAction<string[]>>
          setNumberOfEventBadgeBlue: Dispatch<SetStateAction<number>>
          setNumberOfEventBadgeGreen: Dispatch<SetStateAction<number>>
          setNumberOfEventBadgeOrange: Dispatch<SetStateAction<number>>
          setNumberOfEventBadgePurple: Dispatch<SetStateAction<number>>
          setNumberOfEventBadgeRed: Dispatch<SetStateAction<number>>
          setNumberOfEventBadgeWhite: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerBlue: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerGreen: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerOrange: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerPurple: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerRed: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerWhite: Dispatch<SetStateAction<number>>
          setNumberOfRewardAfterPartyStickerWild: Dispatch<SetStateAction<number>>
          setOclockEventRank: Dispatch<SetStateAction<number>>
          setVbsEventRank: Dispatch<SetStateAction<number>>
          stamp: {
            bloom: {
              setIsStampShop: Dispatch<SetStateAction<boolean>>
              setSelectedStampGachi: Dispatch<SetStateAction<StampLevel1Bloom>>
              setSelectedStampIroiro: Dispatch<SetStateAction<StampLevel1Bloom>>
              setSelectedStampKizuna: Dispatch<SetStateAction<StampLevel2Bloom>>
              setSelectedStampLive: Dispatch<SetStateAction<StampLevel2Bloom>>
              setSelectedStampLogin: Dispatch<SetStateAction<StampLevel2Bloom>>
              setStampGachi: Dispatch<SetStateAction<number[]>>
              setStampIroiro: Dispatch<SetStateAction<number[]>>
              setStampKizuna: Dispatch<SetStateAction<number[]>>
              setStampLive: Dispatch<SetStateAction<number[]>>
              setStampLogin: Dispatch<SetStateAction<number[]>>
            }
            cheer: {
              setSelectedStampGachi: Dispatch<SetStateAction<StampLevel1Cheer>>
              setSelectedStampIroiro: Dispatch<SetStateAction<StampLevel1Cheer>>
              setSelectedStampKizuna: Dispatch<SetStateAction<StampLevel2Cheer>>
              setSelectedStampLive: Dispatch<SetStateAction<StampLevel2Cheer>>
              setSelectedStampLogin: Dispatch<SetStateAction<StampLevel2Cheer>>
              setStampGachi: Dispatch<SetStateAction<number[]>>
              setStampIroiro: Dispatch<SetStateAction<number[]>>
              setStampKizuna: Dispatch<SetStateAction<number[]>>
              setStampLive: Dispatch<SetStateAction<number[]>>
              setStampLogin: Dispatch<SetStateAction<number[]>>
            }
            connect: {
              setSelectedStampGachi: Dispatch<SetStateAction<StampLevel1Connect>>
              setSelectedStampIroiro: Dispatch<SetStateAction<StampLevel1Connect>>
              setSelectedStampKizuna: Dispatch<SetStateAction<StampLevel2Connect>>
              setSelectedStampLive: Dispatch<SetStateAction<StampLevel2Connect>>
              setSelectedStampLogin: Dispatch<SetStateAction<StampLevel2Connect>>
              setStampGachi: Dispatch<SetStateAction<number[]>>
              setStampIroiro: Dispatch<SetStateAction<number[]>>
              setStampKizuna: Dispatch<SetStateAction<number[]>>
              setStampLive: Dispatch<SetStateAction<number[]>>
              setStampLogin: Dispatch<SetStateAction<number[]>>
            }
          }
        }
        reward: {
          flowers: {
            setIsReward25Bottle: Dispatch<SetStateAction<boolean>>
            setIsReward25Crystal: Dispatch<SetStateAction<boolean>>
            setIsRewardCostume: Dispatch<SetStateAction<boolean>>
            setIsRewardLnBottle: Dispatch<SetStateAction<boolean>>
            setIsRewardLnCrystal: Dispatch<SetStateAction<boolean>>
            setIsRewardMmjBottle: Dispatch<SetStateAction<boolean>>
            setIsRewardMmjCrystal: Dispatch<SetStateAction<boolean>>
            setIsRewardSkill: Dispatch<SetStateAction<boolean>>
            setIsRewardVbsBottle: Dispatch<SetStateAction<boolean>>
            setIsRewardVbsCrystal: Dispatch<SetStateAction<boolean>>
            setIsRewardVsBottle: Dispatch<SetStateAction<boolean>>
            setIsRewardVsCrystal: Dispatch<SetStateAction<boolean>>
            setIsRewardWsBottle: Dispatch<SetStateAction<boolean>>
            setIsRewardWsCrystal: Dispatch<SetStateAction<boolean>>
          }
          petals: {
            setNumberOfRewardCrystal: Dispatch<SetStateAction<number>>
            setNumberOfRewardDrink: Dispatch<SetStateAction<number>>
            setNumberOfRewardDroplet: Dispatch<SetStateAction<number>>
            setNumberOfRewardPractice: Dispatch<SetStateAction<number>>
            setNumberOfRewardSkill: Dispatch<SetStateAction<number>>
            setNumberOfRewardVirtualCoin: Dispatch<SetStateAction<number>>
          }
        }
      }
      state: {
        acquisition: {
          anniversaryEventRank: number
          fesBonus: number
          hasCmpensationAnnivCard: boolean
          isGacha25: boolean
          isGachaLn: boolean
          isGachaMmj: boolean
          isGachaVbs: boolean
          isGachaVs: boolean
          isGachaWs: boolean
          isHappiness: boolean
          isPremiumLiveMission: boolean
          liveMission: number
          loginDays: string[]
          numberOfEventBadgeBlue: number
          numberOfEventBadgeGreen: number
          numberOfEventBadgeOrange: number
          numberOfEventBadgePurple: number
          numberOfEventBadgeRed: number
          numberOfEventBadgeWhite: number
          numberOfRewardAfterPartyStickerBlue: number
          numberOfRewardAfterPartyStickerGreen: number
          numberOfRewardAfterPartyStickerOrange: number
          numberOfRewardAfterPartyStickerPurple: number
          numberOfRewardAfterPartyStickerRed: number
          numberOfRewardAfterPartyStickerWhite: number
          numberOfRewardAfterPartyStickerWild: number
          oclockEventRank: number
          stamp: {
            bloom: {
              isStampShop: boolean
              selectedStampGachi: StampLevel1Bloom
              selectedStampIroiro: StampLevel1Bloom
              selectedStampKizuna: StampLevel2Bloom
              selectedStampLive: StampLevel2Bloom
              selectedStampLogin: StampLevel2Bloom
              stampGachi: number[]
              stampIroiro: number[]
              stampKizuna: number[]
              stampLive: number[]
              stampLogin: number[]
            }
            cheer: {
              selectedStampGachi: StampLevel1Cheer
              selectedStampIroiro: StampLevel1Cheer
              selectedStampKizuna: StampLevel2Cheer
              selectedStampLive: StampLevel2Cheer
              selectedStampLogin: StampLevel2Cheer
              stampGachi: number[]
              stampIroiro: number[]
              stampKizuna: number[]
              stampLive: number[]
              stampLogin: number[]
            }
            connect: {
              selectedStampGachi: StampLevel1Connect
              selectedStampIroiro: StampLevel1Connect
              selectedStampKizuna: StampLevel2Connect
              selectedStampLive: StampLevel2Connect
              selectedStampLogin: StampLevel2Connect
              stampGachi: number[]
              stampIroiro: number[]
              stampKizuna: number[]
              stampLive: number[]
              stampLogin: number[]
            }
          }
          vbsEventRank: number
        }
        result: {
          bluePetals: number
          greenPetals: number
          orangePetals: number
          purplePetals: number
          redPetals: number
          whitePetals: number
          wildFlowers: number
        }
        reward: {
          flowers: {
            isReward25Bottle: boolean
            isReward25Crystal: boolean
            isRewardCostume: boolean
            isRewardLnBottle: boolean
            isRewardLnCrystal: boolean
            isRewardMmjBottle: boolean
            isRewardMmjCrystal: boolean
            isRewardSkill: boolean
            isRewardVbsBottle: boolean
            isRewardVbsCrystal: boolean
            isRewardVsBottle: boolean
            isRewardVsCrystal: boolean
            isRewardWsBottle: boolean
            isRewardWsCrystal: boolean
          }
          petals: {
            numberOfRewardCrystal: number
            numberOfRewardDrink: number
            numberOfRewardDroplet: number
            numberOfRewardPractice: number
            numberOfRewardSkill: number
            numberOfRewardVirtualCoin: number
          }
        }
      }
    }
  | undefined
>(undefined)

export const FortuneFlowerContextProvider = ({ children }: { children: ReactNode }) => {
  // フラワー
  const [wildFlowers, setWildFlowers] = useState<number>(0)

  // 花びら
  const [whitePetals, setWhitePetals] = useState<number>(0)
  const [bluePetals, setBluePetals] = useState<number>(0)
  const [greenPetals, setGreenPetals] = useState<number>(0)
  const [redPetals, setRedPetals] = useState<number>(0)
  const [orangePetals, setOrangePetals] = useState<number>(0)
  const [purplePetals, setPurplePetals] = useState<number>(0)

  const searchParams = useSearchParams()
  // 交換所
  // 周年衣装
  const initialIsRewardCostume = !!searchParams.get("isRewardCostume")
  const [isRewardCostume, setIsRewardCostume] = useState<boolean>(initialIsRewardCostume)

  // スキルセット
  const initialIsRewardSkill = !!searchParams.get("isRewardSkill")
  const [isRewardSkill, setIsRewardSkill] = useState<boolean>(initialIsRewardSkill)

  // 各小瓶
  const initialIsRewardVsBottle = !!searchParams.get("isRewardVsBottle")
  const [isRewardVsBottle, setIsRewardVsBottle] = useState<boolean>(initialIsRewardVsBottle)
  const initialIsRewardLnBottle = !!searchParams.get("isRewardLnBottle")
  const [isRewardLnBottle, setIsRewardLnBottle] = useState<boolean>(initialIsRewardLnBottle)
  const initialIsRewardMmjBottle = !!searchParams.get("isRewardMmjBottle")
  const [isRewardMmjBottle, setIsRewardMmjBottle] = useState<boolean>(initialIsRewardMmjBottle)
  const initialIsRewardVbsBottle = !!searchParams.get("isRewardVbsBottle")
  const [isRewardVbsBottle, setIsRewardVbsBottle] = useState<boolean>(initialIsRewardVbsBottle)
  const initialIsRewardWsBottle = !!searchParams.get("isRewardWsBottle")
  const [isRewardWsBottle, setIsRewardWsBottle] = useState<boolean>(initialIsRewardWsBottle)
  const initialIsReward25Bottle = !!searchParams.get("isReward25Bottle")
  const [isReward25Bottle, setIsReward25Bottle] = useState<boolean>(initialIsReward25Bottle)

  // 各純結晶
  const initialIsRewardVsCrystal = !!searchParams.get("isRewardVsCrystal")
  const [isRewardVsCrystal, setIsRewardVsCrystal] = useState<boolean>(initialIsRewardVsCrystal)
  const initialIsRewardLnCrystal = !!searchParams.get("isRewardLnCrystal")
  const [isRewardLnCrystal, setIsRewardLnCrystal] = useState<boolean>(initialIsRewardLnCrystal)
  const initialIsRewardMmjCrystal = !!searchParams.get("isRewardMmjCrystal")
  const [isRewardMmjCrystal, setIsRewardMmjCrystal] = useState<boolean>(initialIsRewardMmjCrystal)
  const initialIsRewardVbsCrystal = !!searchParams.get("isRewardVbsCrystal")
  const [isRewardVbsCrystal, setIsRewardVbsCrystal] = useState<boolean>(initialIsRewardVbsCrystal)
  const initialIsRewardWsCrystal = !!searchParams.get("isRewardWsCrystal")
  const [isRewardWsCrystal, setIsRewardWsCrystal] = useState<boolean>(initialIsRewardWsCrystal)
  const initialIsReward25Crystal = !!searchParams.get("isReward25Crystal")
  const [isReward25Crystal, setIsReward25Crystal] = useState<boolean>(initialIsReward25Crystal)

  // 雫
  const initialNumberOfRewardDroplet = parseInt(
    searchParams.get("numberOfRewardDroplet") ?? "0",
    10
  )
  const [numberOfRewardDroplet, setNumberOfRewardDroplet] = useState<number>(
    initialNumberOfRewardDroplet
  )

  // スキスコ
  const initialNumberOfRewardSkill = parseInt(searchParams.get("numberOfRewardSkill") ?? "0", 10)
  const [numberOfRewardSkill, setNumberOfRewardSkill] = useState<number>(initialNumberOfRewardSkill)

  // 練スコ
  const initialNumberOfRewardPractice = parseInt(
    searchParams.get("numberOfRewardPractice") ?? "0",
    10
  )
  const [numberOfRewardPractice, setNumberOfRewardPractice] = useState<number>(
    initialNumberOfRewardPractice
  )

  // 石
  const initialNumberOfRewardCrystal = parseInt(
    searchParams.get("numberOfRewardCrystal") ?? "0",
    10
  )
  const [numberOfRewardCrystal, setNumberOfRewardCrystal] = useState<number>(
    initialNumberOfRewardCrystal
  )

  // バチャコ
  const initialNumberOfRewardVirtualCoin = parseInt(
    searchParams.get("numberOfRewardVirtualCoin") ?? "0",
    10
  )
  const [numberOfRewardVirtualCoin, setNumberOfRewardVirtualCoin] = useState<number>(
    initialNumberOfRewardVirtualCoin
  )

  // ライボ
  const initialNumberOfRewardDrink = parseInt(searchParams.get("numberOfRewardDrink") ?? "0", 10)
  const [numberOfRewardDrink, setNumberOfRewardDrink] = useState<number>(initialNumberOfRewardDrink)

  // 獲得場所
  // 補填
  // アニバイベントのガチャカード所持
  const initialHasCmpensationAnnivCard = !!searchParams.get("hasCmpensationAnnivCard")
  const [hasCmpensationAnnivCard, setHasCmpensationAnnivCard] = useState<boolean>(
    initialHasCmpensationAnnivCard
  )

  // 服ガチャ
  const initialIsGachaVs = !!searchParams.get("isGachaVs")
  const [isGachaVs, setIsGachaVs] = useState<boolean>(initialIsGachaVs)

  const initialIsGachaLn = !!searchParams.get("isGachaLn")
  const [isGachaLn, setIsGachaLn] = useState<boolean>(initialIsGachaLn)

  const initialIsGachaMmj = !!searchParams.get("isGachaMmj")
  const [isGachaMmj, setIsGachaMmj] = useState<boolean>(initialIsGachaMmj)

  const initialIsGachaVbs = !!searchParams.get("isGachaVbs")
  const [isGachaVbs, setIsGachaVbs] = useState<boolean>(initialIsGachaVbs)

  const initialIsGachaWs = !!searchParams.get("isGachaWs")
  const [isGachaWs, setIsGachaWs] = useState<boolean>(initialIsGachaWs)

  const initialIsGacha25 = !!searchParams.get("isGacha25")
  const [isGacha25, setIsGacha25] = useState<boolean>(initialIsGacha25)

  // ログイン
  const initialLoginDays = searchParams.getAll("loginDays")
  const [loginDays, setLoginDays] = useState<string[]>(initialLoginDays)

  // ライブミッション
  const initialLiveMission = parseInt(searchParams.get("liveMission") ?? "0", 10)
  const [liveMission, setLiveMission] = useState<number>(initialLiveMission)

  // プレミアムライブミッション
  const initialIsPremiumLiveMission = !!searchParams.get("isPremiumLiveMission")
  const [isPremiumLiveMission, setIsPremiumLiveMission] = useState<boolean>(
    initialIsPremiumLiveMission
  )

  // ブルフェス
  const initialFesBonus = parseInt(searchParams.get("fesBonus") ?? "0", 10)
  const [fesBonus, setFesBonus] = useState<number>(initialFesBonus)

  // イベント交換所
  const initialNumberOfEventBadgeWhite = parseInt(
    searchParams.get("numberOfEventBadgeWhite") ?? "0",
    10
  )
  const [numberOfEventBadgeWhite, setNumberOfEventBadgeWhite] = useState<number>(
    initialNumberOfEventBadgeWhite
  )
  const initialNumberOfEventBadgeBlue = parseInt(
    searchParams.get("numberOfEventBadgeBlue") ?? "0",
    10
  )
  const [numberOfEventBadgeBlue, setNumberOfEventBadgeBlue] = useState<number>(
    initialNumberOfEventBadgeBlue
  )

  const initialNumberOfEventBadgeGreen = parseInt(
    searchParams.get("numberOfEventBadgeGreen") ?? "0",
    10
  )
  const [numberOfEventBadgeGreen, setNumberOfEventBadgeGreen] = useState<number>(
    initialNumberOfEventBadgeGreen
  )
  const initialNumberOfEventBadgeRed = parseInt(
    searchParams.get("numberOfEventBadgeRed") ?? "0",
    10
  )
  const [numberOfEventBadgeRed, setNumberOfEventBadgeRed] = useState<number>(
    initialNumberOfEventBadgeRed
  )

  const initialNumberOfEventBadgeOrange = parseInt(
    searchParams.get("numberOfEventBadgeOrange") ?? "0",
    10
  )
  const [numberOfEventBadgeOrange, setNumberOfEventBadgeOrange] = useState<number>(
    initialNumberOfEventBadgeOrange
  )
  const initialNumberOfEventBadgePurple = parseInt(
    searchParams.get("numberOfEventBadgePurple") ?? "0",
    10
  )
  const [numberOfEventBadgePurple, setNumberOfEventBadgePurple] = useState<number>(
    initialNumberOfEventBadgePurple
  )

  // イベントランキング
  const initialAnniversaryEventRank = parseInt(searchParams.get("anniversaryEventRank") ?? "0", 10)
  const [anniversaryEventRank, setAnniversaryEventRank] = useState<number>(
    initialAnniversaryEventRank
  )

  const initialOclockEventRank = parseInt(searchParams.get("oclockEventRank") ?? "0", 10)
  const [oclockEventRank, setOclockEventRank] = useState<number>(initialOclockEventRank)

  const initialVbsEventRank = parseInt(searchParams.get("vbsEventRank") ?? "0", 10)
  const [vbsEventRank, setVbsEventRank] = useState<number>(initialVbsEventRank)

  // ハピネス
  const initialIsHappiness = !!searchParams.get("isHappiness")
  const [isHappiness, setIsHappiness] = useState<boolean>(initialIsHappiness)

  // 後夜祭
  // ワイルド
  const initialNumberOfRewardAfterPartyStickerWild = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerWild") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerWild, setNumberOfRewardAfterPartyStickerWild] =
    useState<number>(initialNumberOfRewardAfterPartyStickerWild)

  // 白
  const initialNumberOfRewardAfterPartyStickerWhite = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerWhite") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerWhite, setNumberOfRewardAfterPartyStickerWhite] =
    useState<number>(initialNumberOfRewardAfterPartyStickerWhite)

  // 青
  const initialNumberOfRewardAfterPartyStickerBlue = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerBlue") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerBlue, setNumberOfRewardAfterPartyStickerBlue] =
    useState<number>(initialNumberOfRewardAfterPartyStickerBlue)

  // 緑
  const initialNumberOfRewardAfterPartyStickerGreen = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerGreen") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerGreen, setNumberOfRewardAfterPartyStickerGreen] =
    useState<number>(initialNumberOfRewardAfterPartyStickerGreen)

  // 赤
  const initialNumberOfRewardAfterPartyStickerRed = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerRed") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerRed, setNumberOfRewardAfterPartyStickerRed] =
    useState<number>(initialNumberOfRewardAfterPartyStickerRed)

  // 橙
  const initialNumberOfRewardAfterPartyStickerOrange = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerOrange") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerOrange, setNumberOfRewardAfterPartyStickerOrange] =
    useState<number>(initialNumberOfRewardAfterPartyStickerOrange)

  // 紫
  const initialNumberOfRewardAfterPartyStickerPurple = parseInt(
    searchParams.get("numberOfRewardAfterPartyStickerPurple") ?? "0",
    10
  )
  const [numberOfRewardAfterPartyStickerPurple, setNumberOfRewardAfterPartyStickerPurple] =
    useState<number>(initialNumberOfRewardAfterPartyStickerPurple)

  // スタンプミッション
  // BLOOM
  // イロイロ
  const searchParamSelectedStampIroiroBloom = searchParams.get("selectedStampIroiroBloom")
  let initialSelectedStampIroiroBloom: StampLevel1Bloom = null
  if (
    searchParamSelectedStampIroiroBloom === "whiteregular" ||
    searchParamSelectedStampIroiroBloom === "whiteunlimited" ||
    searchParamSelectedStampIroiroBloom === "blueregular" ||
    searchParamSelectedStampIroiroBloom === "blueunlimited"
  ) {
    initialSelectedStampIroiroBloom = searchParamSelectedStampIroiroBloom
  }
  const [selectedStampIroiroBloom, setSelectedStampIroiroBloom] = useState<StampLevel1Bloom>(
    initialSelectedStampIroiroBloom
  )

  const initialStampIroiroBloom = searchParams.getAll("stampIroiroBloom")
  const [stampIroiroBloom, setStampIroiroBloom] = useState<number[]>(
    initialStampIroiroBloom.map((item) => parseInt(item ?? "0", 10))
  )

  // ライブ
  const searchParamSelectedStampLiveBloom = searchParams.get("selectedStampLiveBloom")
  let initialSelectedStampLiveBloom: StampLevel2Bloom = null
  if (
    searchParamSelectedStampLiveBloom === "whitecasual" ||
    searchParamSelectedStampLiveBloom === "whiteregular" ||
    searchParamSelectedStampLiveBloom === "bluecasual" ||
    searchParamSelectedStampLiveBloom === "blueregular"
  ) {
    initialSelectedStampLiveBloom = searchParamSelectedStampLiveBloom
  }
  const [selectedStampLiveBloom, setSelectedStampLiveBloom] = useState<StampLevel2Bloom>(
    initialSelectedStampLiveBloom
  )

  const initialStampLiveBloom = searchParams.getAll("stampLiveBloom")
  const [stampLiveBloom, setStampLiveBloom] = useState<number[]>(
    initialStampLiveBloom.map((item) => parseInt(item ?? "0", 10))
  )

  // キズナ
  const searchParamSelectedStampKizunaBloom = searchParams.get("selectedStampKizunaBloom")
  let initialSelectedStampKizunaBloom: StampLevel2Bloom = null
  if (
    searchParamSelectedStampKizunaBloom === "whitecasual" ||
    searchParamSelectedStampKizunaBloom === "whiteregular" ||
    searchParamSelectedStampKizunaBloom === "bluecasual" ||
    searchParamSelectedStampKizunaBloom === "blueregular"
  ) {
    initialSelectedStampKizunaBloom = searchParamSelectedStampKizunaBloom
  }
  const [selectedStampKizunaBloom, setSelectedStampKizunaBloom] = useState<StampLevel2Bloom>(
    initialSelectedStampKizunaBloom
  )

  const initialStampKizunaBloom = searchParams.getAll("stampKizunaBloom")
  const [stampKizunaBloom, setStampKizunaBloom] = useState<number[]>(
    initialStampKizunaBloom.map((item) => parseInt(item ?? "0", 10))
  )

  // ログイン
  const searchParamSelectedStampLoginBloom = searchParams.get("selectedStampLoginBloom")
  let initialSelectedStampLoginBloom: StampLevel2Bloom = null
  if (
    searchParamSelectedStampLoginBloom === "whitecasual" ||
    searchParamSelectedStampLoginBloom === "whiteregular" ||
    searchParamSelectedStampLoginBloom === "bluecasual" ||
    searchParamSelectedStampLoginBloom === "blueregular"
  ) {
    initialSelectedStampLoginBloom = searchParamSelectedStampLoginBloom
  }
  const [selectedStampLoginBloom, setSelectedStampLoginBloom] = useState<StampLevel2Bloom>(
    initialSelectedStampLoginBloom
  )

  const initialStampLoginBloom = searchParams.getAll("stampLoginBloom")
  const [stampLoginBloom, setStampLoginBloom] = useState<number[]>(
    initialStampLoginBloom.map((item) => parseInt(item ?? "0", 10))
  )

  // ガチ
  const searchParamSelectedStampGachiBloom = searchParams.get("selectedStampGachiBloom")
  let initialSelectedStampGachiBloom: StampLevel1Bloom = null
  if (
    searchParamSelectedStampGachiBloom === "whiteregular" ||
    searchParamSelectedStampGachiBloom === "whiteunlimited" ||
    searchParamSelectedStampGachiBloom === "blueregular" ||
    searchParamSelectedStampGachiBloom === "blueunlimited"
  ) {
    initialSelectedStampGachiBloom = searchParamSelectedStampGachiBloom
  }
  const [selectedStampGachiBloom, setSelectedStampGachiBloom] = useState<StampLevel1Bloom>(
    initialSelectedStampGachiBloom
  )

  const initialStampGachiBloom = searchParams.getAll("stampGachiBloom")
  const [stampGachiBloom, setStampGachiBloom] = useState<number[]>(
    initialStampGachiBloom.map((item) => parseInt(item ?? "0", 10))
  )

  // ショップ
  const initialIsStampShopBloom = !!searchParams.get("isStampShopBloom")
  const [isStampShopBloom, setIsStampShopBloom] = useState<boolean>(initialIsStampShopBloom)

  // CONNECT
  // イロイロ
  const searchParamSelectedStampIroiroConnect = searchParams.get("selectedStampIroiroConnect")
  let initialSelectedStampIroiroConnect: StampLevel1Connect = null
  if (
    searchParamSelectedStampIroiroConnect === "greenregular" ||
    searchParamSelectedStampIroiroConnect === "greenunlimited" ||
    searchParamSelectedStampIroiroConnect === "redregular" ||
    searchParamSelectedStampIroiroConnect === "redunlimited"
  ) {
    initialSelectedStampIroiroConnect = searchParamSelectedStampIroiroConnect
  }
  const [selectedStampIroiroConnect, setSelectedStampIroiroConnect] = useState<StampLevel1Connect>(
    initialSelectedStampIroiroConnect
  )

  const initialStampIroiroConnect = searchParams.getAll("stampIroiroConnect")
  const [stampIroiroConnect, setStampIroiroConnect] = useState<number[]>(
    initialStampIroiroConnect.map((item) => parseInt(item ?? "0", 10))
  )

  // ライブ
  const searchParamSelectedStampLiveConnect = searchParams.get("selectedStampLiveConnect")
  let initialSelectedStampLiveConnect: StampLevel2Connect = null
  if (
    searchParamSelectedStampLiveConnect === "greencasual" ||
    searchParamSelectedStampLiveConnect === "greenregular" ||
    searchParamSelectedStampLiveConnect === "redcasual" ||
    searchParamSelectedStampLiveConnect === "redregular"
  ) {
    initialSelectedStampLiveConnect = searchParamSelectedStampLiveConnect
  }
  const [selectedStampLiveConnect, setSelectedStampLiveConnect] = useState<StampLevel2Connect>(
    initialSelectedStampLiveConnect
  )

  const initialStampLiveConnect = searchParams.getAll("stampLiveConnect")
  const [stampLiveConnect, setStampLiveConnect] = useState<number[]>(
    initialStampLiveConnect.map((item) => parseInt(item ?? "0", 10))
  )

  // キズナ
  const searchParamSelectedStampKizunaConnect = searchParams.get("selectedStampKizunaConnect")
  let initialSelectedStampKizunaConnect: StampLevel2Connect = null
  if (
    searchParamSelectedStampKizunaConnect === "greencasual" ||
    searchParamSelectedStampKizunaConnect === "greenregular" ||
    searchParamSelectedStampKizunaConnect === "redcasual" ||
    searchParamSelectedStampKizunaConnect === "redregular"
  ) {
    initialSelectedStampKizunaConnect = searchParamSelectedStampKizunaConnect
  }
  const [selectedStampKizunaConnect, setSelectedStampKizunaConnect] = useState<StampLevel2Connect>(
    initialSelectedStampKizunaConnect
  )

  const initialStampKizunaConnect = searchParams.getAll("stampKizunaConnect")
  const [stampKizunaConnect, setStampKizunaConnect] = useState<number[]>(
    initialStampKizunaConnect.map((item) => parseInt(item ?? "0", 10))
  )

  // ログイン
  const searchParamSelectedStampLoginConnect = searchParams.get("selectedStampLoginConnect")
  let initialSelectedStampLoginConnect: StampLevel2Connect = null
  if (
    searchParamSelectedStampLoginConnect === "greencasual" ||
    searchParamSelectedStampLoginConnect === "greenregular" ||
    searchParamSelectedStampLoginConnect === "redcasual" ||
    searchParamSelectedStampLoginConnect === "redregular"
  ) {
    initialSelectedStampLoginConnect = searchParamSelectedStampLoginConnect
  }
  const [selectedStampLoginConnect, setSelectedStampLoginConnect] = useState<StampLevel2Connect>(
    initialSelectedStampLoginConnect
  )

  const initialStampLoginConnect = searchParams.getAll("stampLoginConnect")
  const [stampLoginConnect, setStampLoginConnect] = useState<number[]>(
    initialStampLoginConnect.map((item) => parseInt(item ?? "0", 10))
  )

  // ガチ
  const searchParamSelectedStampGachiConnect = searchParams.get("selectedStampGachiConnect")
  let initialSelectedStampGachiConnect: StampLevel1Connect = null
  if (
    searchParamSelectedStampGachiConnect === "greenregular" ||
    searchParamSelectedStampGachiConnect === "greenunlimited" ||
    searchParamSelectedStampGachiConnect === "redregular" ||
    searchParamSelectedStampGachiConnect === "redunlimited"
  ) {
    initialSelectedStampGachiConnect = searchParamSelectedStampGachiConnect
  }
  const [selectedStampGachiConnect, setSelectedStampGachiConnect] = useState<StampLevel1Connect>(
    initialSelectedStampGachiConnect
  )

  const initialStampGachiConnect = searchParams.getAll("stampGachiConnect")
  const [stampGachiConnect, setStampGachiConnect] = useState<number[]>(
    initialStampGachiConnect.map((item) => parseInt(item ?? "0", 10))
  )

  // CHEER
  // イロイロ
  const searchParamSelectedStampIroiroCheer = searchParams.get("selectedStampIroiroCheer")
  let initialSelectedStampIroiroCheer: StampLevel1Cheer = null
  if (
    searchParamSelectedStampIroiroCheer === "orangeregular" ||
    searchParamSelectedStampIroiroCheer === "orangeunlimited" ||
    searchParamSelectedStampIroiroCheer === "purpleregular" ||
    searchParamSelectedStampIroiroCheer === "purpleunlimited"
  ) {
    initialSelectedStampIroiroCheer = searchParamSelectedStampIroiroCheer
  }
  const [selectedStampIroiroCheer, setSelectedStampIroiroCheer] = useState<StampLevel1Cheer>(
    initialSelectedStampIroiroCheer
  )

  const initialStampIroiroCheer = searchParams.getAll("stampIroiroCheer")
  const [stampIroiroCheer, setStampIroiroCheer] = useState<number[]>(
    initialStampIroiroCheer.map((item) => parseInt(item ?? "0", 10))
  )

  // ライブ
  const searchParamSelectedStampLiveCheer = searchParams.get("selectedStampLiveCheer")
  let initialSelectedStampLiveCheer: StampLevel2Cheer = null
  if (
    searchParamSelectedStampLiveCheer === "orangecasual" ||
    searchParamSelectedStampLiveCheer === "orangeregular" ||
    searchParamSelectedStampLiveCheer === "purplecasual" ||
    searchParamSelectedStampLiveCheer === "purpleregular"
  ) {
    initialSelectedStampLiveCheer = searchParamSelectedStampLiveCheer
  }
  const [selectedStampLiveCheer, setSelectedStampLiveCheer] = useState<StampLevel2Cheer>(
    initialSelectedStampLiveCheer
  )

  const initialStampLiveCheer = searchParams.getAll("stampLiveCheer")
  const [stampLiveCheer, setStampLiveCheer] = useState<number[]>(
    initialStampLiveCheer.map((item) => parseInt(item ?? "0", 10))
  )

  // キズナ
  const searchParamSelectedStampKizunaCheer = searchParams.get("selectedStampKizunaCheer")
  let initialSelectedStampKizunaCheer: StampLevel2Cheer = null
  if (
    searchParamSelectedStampKizunaCheer === "orangecasual" ||
    searchParamSelectedStampKizunaCheer === "orangeregular" ||
    searchParamSelectedStampKizunaCheer === "purplecasual" ||
    searchParamSelectedStampKizunaCheer === "purpleregular"
  ) {
    initialSelectedStampKizunaCheer = searchParamSelectedStampKizunaCheer
  }
  const [selectedStampKizunaCheer, setSelectedStampKizunaCheer] = useState<StampLevel2Cheer>(
    initialSelectedStampKizunaCheer
  )

  const initialStampKizunaCheer = searchParams.getAll("stampKizunaCheer")
  const [stampKizunaCheer, setStampKizunaCheer] = useState<number[]>(
    initialStampKizunaCheer.map((item) => parseInt(item ?? "0", 10))
  )

  // ログイン
  const searchParamSelectedStampLoginCheer = searchParams.get("selectedStampLoginCheer")
  let initialSelectedStampLoginCheer: StampLevel2Cheer = null
  if (
    searchParamSelectedStampLoginCheer === "orangecasual" ||
    searchParamSelectedStampLoginCheer === "orangeregular" ||
    searchParamSelectedStampLoginCheer === "purplecasual" ||
    searchParamSelectedStampLoginCheer === "purpleregular"
  ) {
    initialSelectedStampLoginCheer = searchParamSelectedStampLoginCheer
  }
  const [selectedStampLoginCheer, setSelectedStampLoginCheer] = useState<StampLevel2Cheer>(
    initialSelectedStampLoginCheer
  )

  const initialStampLoginCheer = searchParams.getAll("stampLoginCheer")
  const [stampLoginCheer, setStampLoginCheer] = useState<number[]>(
    initialStampLoginCheer.map((item) => parseInt(item ?? "0", 10))
  )

  // ガチ
  const searchParamSelectedStampGachiCheer = searchParams.get("selectedStampGachiCheer")
  let initialSelectedStampGachiCheer: StampLevel1Cheer = null
  if (
    searchParamSelectedStampGachiCheer === "orangeregular" ||
    searchParamSelectedStampGachiCheer === "orangeunlimited" ||
    searchParamSelectedStampGachiCheer === "purpleregular" ||
    searchParamSelectedStampGachiCheer === "purpleunlimited"
  ) {
    initialSelectedStampGachiCheer = searchParamSelectedStampGachiCheer
  }
  const [selectedStampGachiCheer, setSelectedStampGachiCheer] = useState<StampLevel1Cheer>(
    initialSelectedStampGachiCheer
  )

  const initialStampGachiCheer = searchParams.getAll("stampGachiCheer")
  const [stampGachiCheer, setStampGachiCheer] = useState<number[]>(
    initialStampGachiCheer.map((item) => parseInt(item ?? "0", 10))
  )

  // 花びら集計
  useEffect(() => {
    let wild = 0
    let white = 0
    let blue = 0
    let green = 0
    let red = 0
    let orange = 0
    let purple = 0

    // 交換所
    // 周年衣装
    if (isRewardCostume) {
      white -= 100
      blue -= 100
      green -= 100
      red -= 100
      orange -= 100
      purple -= 100
    }

    // スキルセット
    if (isRewardSkill) {
      white -= 100
      blue -= 100
      green -= 100
      red -= 100
      orange -= 100
      purple -= 100
    }

    // 各小瓶
    if (isRewardVsBottle) {
      white -= 100
    }
    if (isRewardLnBottle) {
      blue -= 100
    }
    if (isRewardMmjBottle) {
      green -= 100
    }
    if (isRewardVbsBottle) {
      red -= 100
    }
    if (isRewardWsBottle) {
      orange -= 100
    }
    if (isReward25Bottle) {
      purple -= 100
    }

    // 各純結晶
    if (isRewardVsCrystal) {
      white -= UNIT_CRYSTAL_COST
    }
    if (isRewardLnCrystal) {
      blue -= UNIT_CRYSTAL_COST
    }
    if (isRewardMmjCrystal) {
      green -= UNIT_CRYSTAL_COST
    }
    if (isRewardVbsCrystal) {
      red -= UNIT_CRYSTAL_COST
    }
    if (isRewardWsCrystal) {
      orange -= UNIT_CRYSTAL_COST
    }
    if (isReward25Crystal) {
      purple -= UNIT_CRYSTAL_COST
    }

    // 報酬交換
    white -= numberOfRewardDroplet * REWARD_COSTS.droplet
    blue -= numberOfRewardSkill * REWARD_COSTS.skill
    green -= numberOfRewardPractice * REWARD_COSTS.practice
    red -= numberOfRewardCrystal * REWARD_COSTS.crystal
    orange -= numberOfRewardVirtualCoin * REWARD_COSTS.virtualCoin
    purple -= numberOfRewardDrink * REWARD_COSTS.drink

    // 獲得場所
    // 補填
    // みんな
    white += COMPENSATION_REWARD
    blue += COMPENSATION_REWARD

    // アニバイベントのガチャカード所持
    if (hasCmpensationAnnivCard) {
      wild += ANNIV_CARD_REWARD
    }
    // 各服ガチャ
    if (isGachaVs) {
      white += GACHA_COSTUME_REWARD
    }
    if (isGachaLn) {
      blue += GACHA_COSTUME_REWARD
    }
    if (isGachaMmj) {
      green += GACHA_COSTUME_REWARD
    }
    if (isGachaVbs) {
      red += GACHA_COSTUME_REWARD
    }
    if (isGachaWs) {
      orange += GACHA_COSTUME_REWARD
    }
    if (isGacha25) {
      purple += GACHA_COSTUME_REWARD
    }

    // ログイン
    if (loginDays.length > 0) {
      loginSchedule.map((schedule) => {
        if (loginDays.includes(schedule.day)) {
          white += schedule.white
          blue += schedule.blue
          green += schedule.green
        }
      })
    }

    // ライブミッション
    if (liveMission) {
      liveMissionSchedule.map((schedule) => {
        if (schedule.point <= liveMission) {
          white += schedule.white
          blue += schedule.blue
          green += schedule.green
          red += schedule.red
          orange += schedule.orange
          purple += schedule.purple
        }
      })
      premiumLiveMissionSchedule.map((schedule) => {
        if (schedule.point <= liveMission && isPremiumLiveMission) {
          white += schedule.white
          blue += schedule.blue
          green += schedule.green
          red += schedule.red
          orange += schedule.orange
          purple += schedule.purple
        }
      })
    }

    // ブルフェス
    if (fesBonus) {
      wild += Math.floor(fesBonus / FES_BONUS_INTERVAL)
    }

    // イベント交換所
    white += numberOfEventBadgeWhite * EVENT_BADGE_MULTIPLIER
    blue += numberOfEventBadgeBlue * EVENT_BADGE_MULTIPLIER
    green += numberOfEventBadgeGreen * EVENT_BADGE_MULTIPLIER
    red += numberOfEventBadgeRed * EVENT_BADGE_MULTIPLIER
    orange += numberOfEventBadgeOrange * EVENT_BADGE_MULTIPLIER
    purple += numberOfEventBadgePurple * EVENT_BADGE_MULTIPLIER

    // イベントランキング
    const anniversaryEvent = eventRankRange.filter(({ rank }) => rank === anniversaryEventRank)
    if (anniversaryEvent.length !== 0) {
      green += anniversaryEvent[0].petals
      red += anniversaryEvent[0].petals
    }

    const oclockEvent = eventRankRange.filter(({ rank }) => rank === oclockEventRank)
    if (oclockEvent.length !== 0) {
      orange += oclockEvent[0].petals
      purple += oclockEvent[0].petals
    }

    const vbsEvent = eventRankRange.filter(({ rank }) => rank === vbsEventRank)
    if (vbsEvent.length !== 0) {
      white += vbsEvent[0].petals
      blue += vbsEvent[0].petals
    }

    // ハピネス
    if (isHappiness) {
      wild += HAPPINESS_REWARD
    }

    // 後夜祭
    wild += numberOfRewardAfterPartyStickerWild * AFTER_PARTY_STICKER.wild
    white += numberOfRewardAfterPartyStickerWhite * AFTER_PARTY_STICKER.color
    blue += numberOfRewardAfterPartyStickerBlue * AFTER_PARTY_STICKER.color
    green += numberOfRewardAfterPartyStickerGreen * AFTER_PARTY_STICKER.color
    red += numberOfRewardAfterPartyStickerRed * AFTER_PARTY_STICKER.color
    orange += numberOfRewardAfterPartyStickerOrange * AFTER_PARTY_STICKER.color
    purple += numberOfRewardAfterPartyStickerPurple * AFTER_PARTY_STICKER.color

    // スタンプ
    // BLOOM
    // イロイロ
    if (selectedStampIroiroBloom && stampIroiroBloom.length !== 0) {
      // レギュラー
      if (
        selectedStampIroiroBloom === "whiteregular" ||
        selectedStampIroiroBloom === "blueregular"
      ) {
        const checkedMissions = stampIroiroRegular.missions.filter((__val, index) =>
          stampIroiroBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampIroiroRegular.missions.length
            ? stampIroiroRegular.complete
            : 0)

        if (selectedStampIroiroBloom === "whiteregular") {
          white += checkedPetals
        }
        if (selectedStampIroiroBloom === "blueregular") {
          blue += checkedPetals
        }
      }

      // アンリミテッド
      if (
        selectedStampIroiroBloom === "whiteunlimited" ||
        selectedStampIroiroBloom === "blueunlimited"
      ) {
        const checkedMissions = stampIroiroUnlimited.missions.filter((__val, index) =>
          stampIroiroBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampIroiroUnlimited.missions.length
            ? stampIroiroUnlimited.complete
            : 0)

        if (selectedStampIroiroBloom === "whiteunlimited") {
          white += checkedPetals
        }
        if (selectedStampIroiroBloom === "blueunlimited") {
          blue += checkedPetals
        }
      }
    }

    // ガチ
    if (selectedStampGachiBloom && stampGachiBloom.length !== 0) {
      // レギュラー
      if (selectedStampGachiBloom === "whiteregular" || selectedStampGachiBloom === "blueregular") {
        const checkedMissions = stampGachiRegular.missions.filter((__val, index) =>
          stampGachiBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampGachiRegular.missions.length
            ? stampGachiRegular.complete
            : 0)

        if (selectedStampGachiBloom === "whiteregular") {
          white += checkedPetals
        }
        if (selectedStampGachiBloom === "blueregular") {
          blue += checkedPetals
        }
      }

      // アンリミテッド
      if (
        selectedStampGachiBloom === "whiteunlimited" ||
        selectedStampGachiBloom === "blueunlimited"
      ) {
        const checkedMissions = stampGachiUnlimited.missions.filter((__val, index) =>
          stampGachiBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampGachiUnlimited.missions.length
            ? stampGachiUnlimited.complete
            : 0)

        if (selectedStampGachiBloom === "whiteunlimited") {
          white += checkedPetals
        }
        if (selectedStampGachiBloom === "blueunlimited") {
          blue += checkedPetals
        }
      }
    }

    // ライブ
    if (selectedStampLiveBloom && stampLiveBloom.length !== 0) {
      // カジュアル
      if (selectedStampLiveBloom === "whitecasual" || selectedStampLiveBloom === "bluecasual") {
        const checkedMissions = stampLiveCasual.missions.filter((__val, index) =>
          stampLiveBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLiveCasual.missions.length
            ? stampLiveCasual.complete
            : 0)

        if (selectedStampLiveBloom === "whitecasual") {
          white += checkedPetals
        }
        if (selectedStampLiveBloom === "bluecasual") {
          blue += checkedPetals
        }
      }

      // レギュラー
      if (selectedStampLiveBloom === "whiteregular" || selectedStampLiveBloom === "blueregular") {
        const checkedMissions = stampLiveRegular.missions.filter((__val, index) =>
          stampLiveBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLiveRegular.missions.length
            ? stampLiveRegular.complete
            : 0)

        if (selectedStampLiveBloom === "whiteregular") {
          white += checkedPetals
        }
        if (selectedStampLiveBloom === "blueregular") {
          blue += checkedPetals
        }
      }
    }

    // キズナ
    if (selectedStampKizunaBloom && stampKizunaBloom.length !== 0) {
      // カジュアル
      if (selectedStampKizunaBloom === "whitecasual" || selectedStampKizunaBloom === "bluecasual") {
        const checkedMissions = stampKizunaCasual.missions.filter((__val, index) =>
          stampKizunaBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampKizunaCasual.missions.length
            ? stampKizunaCasual.complete
            : 0)

        if (selectedStampKizunaBloom === "whitecasual") {
          white += checkedPetals
        }
        if (selectedStampKizunaBloom === "bluecasual") {
          blue += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampKizunaBloom === "whiteregular" ||
        selectedStampKizunaBloom === "blueregular"
      ) {
        const checkedMissions = stampKizunaRegular.missions.filter((__val, index) =>
          stampKizunaBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampKizunaRegular.missions.length
            ? stampKizunaRegular.complete
            : 0)

        if (selectedStampKizunaBloom === "whiteregular") {
          white += checkedPetals
        }
        if (selectedStampKizunaBloom === "blueregular") {
          blue += checkedPetals
        }
      }
    }

    // ログイン
    if (selectedStampLoginBloom && stampLoginBloom.length !== 0) {
      // カジュアル
      if (selectedStampLoginBloom === "whitecasual" || selectedStampLoginBloom === "bluecasual") {
        const checkedMissions = stampLoginCasual.missions.filter((__val, index) =>
          stampLoginBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLoginCasual.missions.length
            ? stampLoginCasual.complete
            : 0)

        if (selectedStampLoginBloom === "whitecasual") {
          white += checkedPetals
        }
        if (selectedStampLoginBloom === "bluecasual") {
          blue += checkedPetals
        }
      }

      // レギュラー
      if (selectedStampLoginBloom === "whiteregular" || selectedStampLoginBloom === "blueregular") {
        const checkedMissions = stampLoginRegular.missions.filter((__val, index) =>
          stampLoginBloom.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLoginRegular.missions.length
            ? stampLoginRegular.complete
            : 0)

        if (selectedStampLoginBloom === "whiteregular") {
          white += checkedPetals
        }
        if (selectedStampLoginBloom === "blueregular") {
          blue += checkedPetals
        }
      }
    }

    // CONNECT
    // イロイロ
    if (selectedStampIroiroConnect && stampIroiroConnect.length !== 0) {
      // レギュラー
      if (
        selectedStampIroiroConnect === "greenregular" ||
        selectedStampIroiroConnect === "redregular"
      ) {
        const checkedMissions = stampIroiroRegular.missions.filter((__val, index) =>
          stampIroiroConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampIroiroRegular.missions.length
            ? stampIroiroRegular.complete
            : 0)

        if (selectedStampIroiroConnect === "greenregular") {
          green += checkedPetals
        }
        if (selectedStampIroiroConnect === "redregular") {
          red += checkedPetals
        }
      }

      // アンリミテッド
      if (
        selectedStampIroiroConnect === "greenunlimited" ||
        selectedStampIroiroConnect === "redunlimited"
      ) {
        const checkedMissions = stampIroiroUnlimited.missions.filter((__val, index) =>
          stampIroiroConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampIroiroUnlimited.missions.length
            ? stampIroiroUnlimited.complete
            : 0)

        if (selectedStampIroiroConnect === "greenunlimited") {
          green += checkedPetals
        }
        if (selectedStampIroiroConnect === "redunlimited") {
          red += checkedPetals
        }
      }
    }

    // ガチ
    if (selectedStampGachiConnect && stampGachiConnect.length !== 0) {
      // レギュラー
      if (
        selectedStampGachiConnect === "greenregular" ||
        selectedStampGachiConnect === "redregular"
      ) {
        const checkedMissions = stampGachiRegular.missions.filter((__val, index) =>
          stampGachiConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampGachiRegular.missions.length
            ? stampGachiRegular.complete
            : 0)

        if (selectedStampGachiConnect === "greenregular") {
          green += checkedPetals
        }
        if (selectedStampGachiConnect === "redregular") {
          red += checkedPetals
        }
      }

      // アンリミテッド
      if (
        selectedStampGachiConnect === "greenunlimited" ||
        selectedStampGachiConnect === "redunlimited"
      ) {
        const checkedMissions = stampGachiUnlimited.missions.filter((__val, index) =>
          stampGachiConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampGachiUnlimited.missions.length
            ? stampGachiUnlimited.complete
            : 0)

        if (selectedStampGachiConnect === "greenunlimited") {
          green += checkedPetals
        }
        if (selectedStampGachiConnect === "redunlimited") {
          red += checkedPetals
        }
      }
    }

    // ライブ
    if (selectedStampLiveConnect && stampLiveConnect.length !== 0) {
      // カジュアル
      if (selectedStampLiveConnect === "greencasual" || selectedStampLiveConnect === "redcasual") {
        const checkedMissions = stampLiveCasual.missions.filter((__val, index) =>
          stampLiveConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLiveCasual.missions.length
            ? stampLiveCasual.complete
            : 0)

        if (selectedStampLiveConnect === "greencasual") {
          green += checkedPetals
        }
        if (selectedStampLiveConnect === "redcasual") {
          red += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampLiveConnect === "greenregular" ||
        selectedStampLiveConnect === "redregular"
      ) {
        const checkedMissions = stampLiveRegular.missions.filter((__val, index) =>
          stampLiveConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLiveRegular.missions.length
            ? stampLiveRegular.complete
            : 0)

        if (selectedStampLiveConnect === "greenregular") {
          green += checkedPetals
        }
        if (selectedStampLiveConnect === "redregular") {
          red += checkedPetals
        }
      }
    }

    // キズナ
    if (selectedStampKizunaConnect && stampKizunaConnect.length !== 0) {
      // カジュアル
      if (
        selectedStampKizunaConnect === "greencasual" ||
        selectedStampKizunaConnect === "redcasual"
      ) {
        const checkedMissions = stampKizunaCasual.missions.filter((__val, index) =>
          stampKizunaConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampKizunaCasual.missions.length
            ? stampKizunaCasual.complete
            : 0)

        if (selectedStampKizunaConnect === "greencasual") {
          green += checkedPetals
        }
        if (selectedStampKizunaConnect === "redcasual") {
          red += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampKizunaConnect === "greenregular" ||
        selectedStampKizunaConnect === "redregular"
      ) {
        const checkedMissions = stampKizunaRegular.missions.filter((__val, index) =>
          stampKizunaConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampKizunaRegular.missions.length
            ? stampKizunaRegular.complete
            : 0)

        if (selectedStampKizunaConnect === "greenregular") {
          green += checkedPetals
        }
        if (selectedStampKizunaConnect === "redregular") {
          red += checkedPetals
        }
      }
    }

    // ログイン
    if (selectedStampLoginConnect && stampLoginConnect.length !== 0) {
      // カジュアル
      if (
        selectedStampLoginConnect === "greencasual" ||
        selectedStampLoginConnect === "redcasual"
      ) {
        const checkedMissions = stampLoginCasual.missions.filter((__val, index) =>
          stampLoginConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLoginCasual.missions.length
            ? stampLoginCasual.complete
            : 0)

        if (selectedStampLoginConnect === "greencasual") {
          green += checkedPetals
        }
        if (selectedStampLoginConnect === "redcasual") {
          red += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampLoginConnect === "greenregular" ||
        selectedStampLoginConnect === "redregular"
      ) {
        const checkedMissions = stampLoginRegular.missions.filter((__val, index) =>
          stampLoginConnect.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLoginRegular.missions.length
            ? stampLoginRegular.complete
            : 0)

        if (selectedStampLoginConnect === "greenregular") {
          green += checkedPetals
        }
        if (selectedStampLoginConnect === "redregular") {
          red += checkedPetals
        }
      }
    }

    // CHEER
    // イロイロ
    if (selectedStampIroiroCheer && stampIroiroCheer.length !== 0) {
      // レギュラー
      if (
        selectedStampIroiroCheer === "orangeregular" ||
        selectedStampIroiroCheer === "purpleregular"
      ) {
        const checkedMissions = stampIroiroRegular.missions.filter((__val, index) =>
          stampIroiroCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampIroiroRegular.missions.length
            ? stampIroiroRegular.complete
            : 0)

        if (selectedStampIroiroCheer === "orangeregular") {
          orange += checkedPetals
        }
        if (selectedStampIroiroCheer === "purpleregular") {
          purple += checkedPetals
        }
      }

      // アンリミテッド
      if (
        selectedStampIroiroCheer === "orangeunlimited" ||
        selectedStampIroiroCheer === "purpleunlimited"
      ) {
        const checkedMissions = stampIroiroUnlimited.missions.filter((__val, index) =>
          stampIroiroCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampIroiroUnlimited.missions.length
            ? stampIroiroUnlimited.complete
            : 0)

        if (selectedStampIroiroCheer === "orangeunlimited") {
          orange += checkedPetals
        }
        if (selectedStampIroiroCheer === "purpleunlimited") {
          purple += checkedPetals
        }
      }
    }

    // ガチ
    if (selectedStampGachiCheer && stampGachiCheer.length !== 0) {
      // レギュラー
      if (
        selectedStampGachiCheer === "orangeregular" ||
        selectedStampGachiCheer === "purpleregular"
      ) {
        const checkedMissions = stampGachiRegular.missions.filter((__val, index) =>
          stampGachiCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampGachiRegular.missions.length
            ? stampGachiRegular.complete
            : 0)

        if (selectedStampGachiCheer === "orangeregular") {
          orange += checkedPetals
        }
        if (selectedStampGachiCheer === "purpleregular") {
          purple += checkedPetals
        }
      }

      // アンリミテッド
      if (
        selectedStampGachiCheer === "orangeunlimited" ||
        selectedStampGachiCheer === "purpleunlimited"
      ) {
        const checkedMissions = stampGachiUnlimited.missions.filter((__val, index) =>
          stampGachiCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampGachiUnlimited.missions.length
            ? stampGachiUnlimited.complete
            : 0)

        if (selectedStampGachiCheer === "orangeunlimited") {
          orange += checkedPetals
        }
        if (selectedStampGachiCheer === "purpleunlimited") {
          purple += checkedPetals
        }
      }
    }

    // ライブ
    if (selectedStampLiveCheer && stampLiveCheer.length !== 0) {
      // カジュアル
      if (selectedStampLiveCheer === "orangecasual" || selectedStampLiveCheer === "purplecasual") {
        const checkedMissions = stampLiveCasual.missions.filter((__val, index) =>
          stampLiveCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLiveCasual.missions.length
            ? stampLiveCasual.complete
            : 0)

        if (selectedStampLiveCheer === "orangecasual") {
          orange += checkedPetals
        }
        if (selectedStampLiveCheer === "purplecasual") {
          purple += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampLiveCheer === "orangeregular" ||
        selectedStampLiveCheer === "purpleregular"
      ) {
        const checkedMissions = stampLiveRegular.missions.filter((__val, index) =>
          stampLiveCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLiveRegular.missions.length
            ? stampLiveRegular.complete
            : 0)

        if (selectedStampLiveCheer === "orangeregular") {
          orange += checkedPetals
        }
        if (selectedStampLiveCheer === "purpleregular") {
          purple += checkedPetals
        }
      }
    }

    // キズナ
    if (selectedStampKizunaCheer && stampKizunaCheer.length !== 0) {
      // カジュアル
      if (
        selectedStampKizunaCheer === "orangecasual" ||
        selectedStampKizunaCheer === "purplecasual"
      ) {
        const checkedMissions = stampKizunaCasual.missions.filter((__val, index) =>
          stampKizunaCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampKizunaCasual.missions.length
            ? stampKizunaCasual.complete
            : 0)

        if (selectedStampKizunaCheer === "orangecasual") {
          orange += checkedPetals
        }
        if (selectedStampKizunaCheer === "purplecasual") {
          purple += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampKizunaCheer === "orangeregular" ||
        selectedStampKizunaCheer === "purpleregular"
      ) {
        const checkedMissions = stampKizunaRegular.missions.filter((__val, index) =>
          stampKizunaCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampKizunaRegular.missions.length
            ? stampKizunaRegular.complete
            : 0)

        if (selectedStampKizunaCheer === "orangeregular") {
          orange += checkedPetals
        }
        if (selectedStampKizunaCheer === "purpleregular") {
          purple += checkedPetals
        }
      }
    }

    // ログイン
    if (selectedStampLoginCheer && stampLoginCheer.length !== 0) {
      // カジュアル
      if (
        selectedStampLoginCheer === "orangecasual" ||
        selectedStampLoginCheer === "purplecasual"
      ) {
        const checkedMissions = stampLoginCasual.missions.filter((__val, index) =>
          stampLoginCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLoginCasual.missions.length
            ? stampLoginCasual.complete
            : 0)

        if (selectedStampLoginCheer === "orangecasual") {
          orange += checkedPetals
        }
        if (selectedStampLoginCheer === "purplecasual") {
          purple += checkedPetals
        }
      }

      // レギュラー
      if (
        selectedStampLoginCheer === "orangeregular" ||
        selectedStampLoginCheer === "purpleregular"
      ) {
        const checkedMissions = stampLoginRegular.missions.filter((__val, index) =>
          stampLoginCheer.includes(index)
        )

        const checkedPetals =
          checkedMissions.reduce(function (acc, obj) {
            return acc + obj.petals
          }, 0) +
          (checkedMissions.length === stampLoginRegular.missions.length
            ? stampLoginRegular.complete
            : 0)

        if (selectedStampLoginCheer === "orangeregular") {
          orange += checkedPetals
        }
        if (selectedStampLoginCheer === "purpleregular") {
          purple += checkedPetals
        }
      }
    }

    setWildFlowers(wild)
    setWhitePetals(white)
    setBluePetals(blue)
    setGreenPetals(green)
    setRedPetals(red)
    setOrangePetals(orange)
    setPurplePetals(purple)
  }, [
    isRewardCostume,
    isRewardSkill,
    isRewardVsBottle,
    isRewardLnBottle,
    isRewardMmjBottle,
    isRewardVbsBottle,
    isRewardWsBottle,
    isReward25Bottle,
    isRewardVsCrystal,
    isRewardLnCrystal,
    isRewardMmjCrystal,
    isRewardVbsCrystal,
    isRewardWsCrystal,
    isReward25Crystal,
    numberOfRewardDroplet,
    numberOfRewardSkill,
    numberOfRewardPractice,
    numberOfRewardCrystal,
    numberOfRewardVirtualCoin,
    numberOfRewardDrink,
    hasCmpensationAnnivCard,
    isGachaVs,
    isGachaLn,
    isGachaMmj,
    isGachaVbs,
    isGachaWs,
    isGacha25,
    loginDays,
    liveMission,
    isPremiumLiveMission,
    fesBonus,
    numberOfEventBadgeWhite,
    numberOfEventBadgeBlue,
    numberOfEventBadgeGreen,
    numberOfEventBadgeRed,
    numberOfEventBadgeOrange,
    numberOfEventBadgePurple,
    anniversaryEventRank,
    oclockEventRank,
    vbsEventRank,
    isHappiness,
    numberOfRewardAfterPartyStickerWild,
    numberOfRewardAfterPartyStickerWhite,
    numberOfRewardAfterPartyStickerBlue,
    numberOfRewardAfterPartyStickerGreen,
    numberOfRewardAfterPartyStickerRed,
    numberOfRewardAfterPartyStickerOrange,
    numberOfRewardAfterPartyStickerPurple,
    selectedStampIroiroBloom,
    selectedStampLiveBloom,
    selectedStampKizunaBloom,
    selectedStampLoginBloom,
    selectedStampGachiBloom,
    isStampShopBloom,
    stampIroiroBloom,
    stampLiveBloom,
    stampKizunaBloom,
    stampLoginBloom,
    stampGachiBloom,
    selectedStampIroiroConnect,
    selectedStampLiveConnect,
    selectedStampKizunaConnect,
    selectedStampLoginConnect,
    selectedStampGachiConnect,
    stampIroiroConnect,
    stampLiveConnect,
    stampKizunaConnect,
    stampLoginConnect,
    stampGachiConnect,
    selectedStampIroiroCheer,
    selectedStampLiveCheer,
    selectedStampKizunaCheer,
    selectedStampLoginCheer,
    selectedStampGachiCheer,
    stampIroiroCheer,
    stampLiveCheer,
    stampKizunaCheer,
    stampLoginCheer,
    stampGachiCheer,
  ])

  // URL置き換え
  const router = useRouter()
  useEffect(() => {
    const urlSearchParams = new URLSearchParams()
    // 交換所
    // 周年衣装
    if (isRewardCostume) {
      urlSearchParams.set("isRewardCostume", "1")
    }

    // スキルセット
    if (isRewardSkill) {
      urlSearchParams.set("isRewardSkill", "1")
    }

    // 各小瓶
    if (isRewardVsBottle) {
      urlSearchParams.set("isRewardVsBottle", "1")
    }
    if (isRewardLnBottle) {
      urlSearchParams.set("isRewardLnBottle", "1")
    }
    if (isRewardMmjBottle) {
      urlSearchParams.set("isRewardMmjBottle", "1")
    }
    if (isRewardVbsBottle) {
      urlSearchParams.set("isRewardVbsBottle", "1")
    }
    if (isRewardWsBottle) {
      urlSearchParams.set("isRewardWsBottle", "1")
    }
    if (isReward25Bottle) {
      urlSearchParams.set("isReward25Bottle", "1")
    }

    // 各純結晶
    if (isRewardVsCrystal) {
      urlSearchParams.set("isRewardVsCrystal", "1")
    }
    if (isRewardLnCrystal) {
      urlSearchParams.set("isRewardLnCrystal", "1")
    }
    if (isRewardMmjCrystal) {
      urlSearchParams.set("isRewardMmjCrystal", "1")
    }
    if (isRewardVbsCrystal) {
      urlSearchParams.set("isRewardVbsCrystal", "1")
    }
    if (isRewardWsCrystal) {
      urlSearchParams.set("isRewardWsCrystal", "1")
    }
    if (isReward25Crystal) {
      urlSearchParams.set("isReward25Crystal", "1")
    }

    // 雫
    if (numberOfRewardDroplet) {
      urlSearchParams.set("numberOfRewardDroplet", numberOfRewardDroplet.toString())
    }

    // スキスコ
    if (numberOfRewardSkill) {
      urlSearchParams.set("numberOfRewardSkill", numberOfRewardSkill.toString())
    }

    // 練スコ
    if (numberOfRewardPractice) {
      urlSearchParams.set("numberOfRewardPractice", numberOfRewardPractice.toString())
    }

    // 石
    if (numberOfRewardCrystal) {
      urlSearchParams.set("numberOfRewardCrystal", numberOfRewardCrystal.toString())
    }

    // バチャコ
    if (numberOfRewardVirtualCoin) {
      urlSearchParams.set("numberOfRewardVirtualCoin", numberOfRewardVirtualCoin.toString())
    }

    // ライボ
    if (numberOfRewardDrink) {
      urlSearchParams.set("numberOfRewardDrink", numberOfRewardDrink.toString())
    }

    // 獲得場所
    // アニバイベントのガチャカード所持
    if (hasCmpensationAnnivCard) {
      urlSearchParams.set("hasCmpensationAnnivCard", "1")
    }

    // 服ガチャ
    if (isGachaVs) {
      urlSearchParams.set("isGachaVs", "1")
    }
    if (isGachaLn) {
      urlSearchParams.set("isGachaLn", "1")
    }
    if (isGachaMmj) {
      urlSearchParams.set("isGachaMmj", "1")
    }
    if (isGachaVbs) {
      urlSearchParams.set("isGachaVbs", "1")
    }
    if (isGachaWs) {
      urlSearchParams.set("isGachaWs", "1")
    }
    if (isGacha25) {
      urlSearchParams.set("isGacha25", "1")
    }

    // ログイン
    loginDays.map((loginDay) => {
      urlSearchParams.append("loginDays", loginDay)
    })

    // ライブミッション
    if (liveMission) {
      urlSearchParams.set("liveMission", liveMission.toString())
    }

    // プレミアムライブミッション
    if (isPremiumLiveMission) {
      urlSearchParams.set("isPremiumLiveMission", "1")
    }

    // ブルフェス
    if (fesBonus) {
      urlSearchParams.set("fesBonus", fesBonus.toString())
    }

    // イベント交換所
    if (numberOfEventBadgeWhite) {
      urlSearchParams.set("numberOfEventBadgeWhite", numberOfEventBadgeWhite.toString())
    }
    if (numberOfEventBadgeBlue) {
      urlSearchParams.set("numberOfEventBadgeBlue", numberOfEventBadgeBlue.toString())
    }

    if (numberOfEventBadgeGreen) {
      urlSearchParams.set("numberOfEventBadgeGreen", numberOfEventBadgeGreen.toString())
    }
    if (numberOfEventBadgeRed) {
      urlSearchParams.set("numberOfEventBadgeRed", numberOfEventBadgeRed.toString())
    }

    if (numberOfEventBadgeOrange) {
      urlSearchParams.set("numberOfEventBadgeOrange", numberOfEventBadgeOrange.toString())
    }
    if (numberOfEventBadgePurple) {
      urlSearchParams.set("numberOfEventBadgePurple", numberOfEventBadgePurple.toString())
    }

    // イベントランキング
    if (anniversaryEventRank) {
      urlSearchParams.set("anniversaryEventRank", anniversaryEventRank.toString())
    }

    if (oclockEventRank) {
      urlSearchParams.set("oclockEventRank", oclockEventRank.toString())
    }

    if (vbsEventRank) {
      urlSearchParams.set("vbsEventRank", vbsEventRank.toString())
    }

    // ハピネス
    if (isHappiness) {
      urlSearchParams.set("isHappiness", "1")
    }

    // 後夜祭
    if (numberOfRewardAfterPartyStickerWild) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerWild",
        numberOfRewardAfterPartyStickerWild.toString()
      )
    }
    if (numberOfRewardAfterPartyStickerWhite) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerWhite",
        numberOfRewardAfterPartyStickerWhite.toString()
      )
    }
    if (numberOfRewardAfterPartyStickerBlue) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerBlue",
        numberOfRewardAfterPartyStickerBlue.toString()
      )
    }
    if (numberOfRewardAfterPartyStickerGreen) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerGreen",
        numberOfRewardAfterPartyStickerGreen.toString()
      )
    }
    if (numberOfRewardAfterPartyStickerRed) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerRed",
        numberOfRewardAfterPartyStickerRed.toString()
      )
    }
    if (numberOfRewardAfterPartyStickerOrange) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerOrange",
        numberOfRewardAfterPartyStickerOrange.toString()
      )
    }
    if (numberOfRewardAfterPartyStickerPurple) {
      urlSearchParams.set(
        "numberOfRewardAfterPartyStickerPurple",
        numberOfRewardAfterPartyStickerPurple.toString()
      )
    }

    // スタンプ
    // BLOOM
    if (selectedStampIroiroBloom) {
      urlSearchParams.set("selectedStampIroiroBloom", selectedStampIroiroBloom)
      stampIroiroBloom.map((index) => {
        urlSearchParams.append("stampIroiroBloom", index.toString())
      })
    }
    if (selectedStampLiveBloom) {
      urlSearchParams.set("selectedStampLiveBloom", selectedStampLiveBloom)
      stampLiveBloom.map((index) => {
        urlSearchParams.append("stampLiveBloom", index.toString())
      })
    }
    if (selectedStampKizunaBloom) {
      urlSearchParams.set("selectedStampKizunaBloom", selectedStampKizunaBloom)
      stampKizunaBloom.map((index) => {
        urlSearchParams.append("stampKizunaBloom", index.toString())
      })
    }
    if (selectedStampLoginBloom) {
      urlSearchParams.set("selectedStampLoginBloom", selectedStampLoginBloom)
      stampLoginBloom.map((index) => {
        urlSearchParams.append("stampLoginBloom", index.toString())
      })
    }
    if (selectedStampGachiBloom) {
      urlSearchParams.set("selectedStampGachiBloom", selectedStampGachiBloom)
      stampGachiBloom.map((index) => {
        urlSearchParams.append("stampGachiBloom", index.toString())
      })
    }
    if (isStampShopBloom) {
      urlSearchParams.set("isStampShopBloom", "1")
    }

    // CONNECT
    if (selectedStampIroiroConnect) {
      urlSearchParams.set("selectedStampIroiroConnect", selectedStampIroiroConnect)
      stampIroiroConnect.map((index) => {
        urlSearchParams.append("stampIroiroConnect", index.toString())
      })
    }
    if (selectedStampLiveConnect) {
      urlSearchParams.set("selectedStampLiveConnect", selectedStampLiveConnect)
      stampLiveConnect.map((index) => {
        urlSearchParams.append("stampLiveConnect", index.toString())
      })
    }
    if (selectedStampKizunaConnect) {
      urlSearchParams.set("selectedStampKizunaConnect", selectedStampKizunaConnect)
      stampKizunaConnect.map((index) => {
        urlSearchParams.append("stampKizunaConnect", index.toString())
      })
    }
    if (selectedStampLoginConnect) {
      urlSearchParams.set("selectedStampLoginConnect", selectedStampLoginConnect)
      stampLoginConnect.map((index) => {
        urlSearchParams.append("stampLoginConnect", index.toString())
      })
    }
    if (selectedStampGachiConnect) {
      urlSearchParams.set("selectedStampGachiConnect", selectedStampGachiConnect)
      stampGachiConnect.map((index) => {
        urlSearchParams.append("stampGachiConnect", index.toString())
      })
    }

    // CHEER
    if (selectedStampIroiroCheer) {
      urlSearchParams.set("selectedStampIroiroCheer", selectedStampIroiroCheer)
      stampIroiroCheer.map((index) => {
        urlSearchParams.append("stampIroiroCheer", index.toString())
      })
    }
    if (selectedStampLiveCheer) {
      urlSearchParams.set("selectedStampLiveCheer", selectedStampLiveCheer)
      stampLiveCheer.map((index) => {
        urlSearchParams.append("stampLiveCheer", index.toString())
      })
    }
    if (selectedStampKizunaCheer) {
      urlSearchParams.set("selectedStampKizunaCheer", selectedStampKizunaCheer)
      stampKizunaCheer.map((index) => {
        urlSearchParams.append("stampKizunaCheer", index.toString())
      })
    }
    if (selectedStampLoginCheer) {
      urlSearchParams.set("selectedStampLoginCheer", selectedStampLoginCheer)
      stampLoginCheer.map((index) => {
        urlSearchParams.append("stampLoginCheer", index.toString())
      })
    }
    if (selectedStampGachiCheer) {
      urlSearchParams.set("selectedStampGachiCheer", selectedStampGachiCheer)
      stampGachiCheer.map((index) => {
        urlSearchParams.append("stampGachiCheer", index.toString())
      })
    }

    router.push(`?${urlSearchParams.toString()}`, { scroll: false })
  }, [
    router,
    isRewardCostume,
    isRewardSkill,
    isRewardVsBottle,
    isRewardLnBottle,
    isRewardMmjBottle,
    isRewardVbsBottle,
    isRewardWsBottle,
    isReward25Bottle,
    isRewardVsCrystal,
    isRewardLnCrystal,
    isRewardMmjCrystal,
    isRewardVbsCrystal,
    isRewardWsCrystal,
    isReward25Crystal,
    numberOfRewardDroplet,
    numberOfRewardSkill,
    numberOfRewardPractice,
    numberOfRewardCrystal,
    numberOfRewardVirtualCoin,
    numberOfRewardDrink,
    hasCmpensationAnnivCard,
    isGachaVs,
    isGachaLn,
    isGachaMmj,
    isGachaVbs,
    isGachaWs,
    isGacha25,
    loginDays,
    liveMission,
    isPremiumLiveMission,
    fesBonus,
    numberOfEventBadgeWhite,
    numberOfEventBadgeBlue,
    numberOfEventBadgeGreen,
    numberOfEventBadgeRed,
    numberOfEventBadgeOrange,
    numberOfEventBadgePurple,
    anniversaryEventRank,
    oclockEventRank,
    vbsEventRank,
    isHappiness,
    numberOfRewardAfterPartyStickerWild,
    numberOfRewardAfterPartyStickerWhite,
    numberOfRewardAfterPartyStickerBlue,
    numberOfRewardAfterPartyStickerGreen,
    numberOfRewardAfterPartyStickerRed,
    numberOfRewardAfterPartyStickerOrange,
    numberOfRewardAfterPartyStickerPurple,
    selectedStampIroiroBloom,
    selectedStampLiveBloom,
    selectedStampKizunaBloom,
    selectedStampLoginBloom,
    selectedStampGachiBloom,
    isStampShopBloom,
    stampIroiroBloom,
    stampLiveBloom,
    stampKizunaBloom,
    stampLoginBloom,
    stampGachiBloom,
    selectedStampIroiroConnect,
    selectedStampLiveConnect,
    selectedStampKizunaConnect,
    selectedStampLoginConnect,
    selectedStampGachiConnect,
    stampIroiroConnect,
    stampLiveConnect,
    stampKizunaConnect,
    stampLoginConnect,
    stampGachiConnect,
    selectedStampIroiroCheer,
    selectedStampLiveCheer,
    selectedStampKizunaCheer,
    selectedStampLoginCheer,
    selectedStampGachiCheer,
    stampIroiroCheer,
    stampLiveCheer,
    stampKizunaCheer,
    stampLoginCheer,
    stampGachiCheer,
  ])

  return (
    <FortuneFlowerContext.Provider
      value={{
        dispatch: {
          acquisition: {
            setAnniversaryEventRank,
            setFesBonus,
            setHasCmpensationAnnivCard,
            setIsGacha25,
            setIsGachaLn,
            setIsGachaMmj,
            setIsGachaVbs,
            setIsGachaVs,
            setIsGachaWs,
            setIsHappiness,
            setIsPremiumLiveMission,
            setLiveMission,
            setLoginDays,
            setNumberOfEventBadgeBlue,
            setNumberOfEventBadgeGreen,
            setNumberOfEventBadgeOrange,
            setNumberOfEventBadgePurple,
            setNumberOfEventBadgeRed,
            setNumberOfEventBadgeWhite,
            setNumberOfRewardAfterPartyStickerBlue,
            setNumberOfRewardAfterPartyStickerGreen,
            setNumberOfRewardAfterPartyStickerOrange,
            setNumberOfRewardAfterPartyStickerPurple,
            setNumberOfRewardAfterPartyStickerRed,
            setNumberOfRewardAfterPartyStickerWhite,
            setNumberOfRewardAfterPartyStickerWild,
            setOclockEventRank,
            setVbsEventRank,
            stamp: {
              bloom: {
                setIsStampShop: setIsStampShopBloom,
                setSelectedStampGachi: setSelectedStampGachiBloom,
                setSelectedStampIroiro: setSelectedStampIroiroBloom,
                setSelectedStampKizuna: setSelectedStampKizunaBloom,
                setSelectedStampLive: setSelectedStampLiveBloom,
                setSelectedStampLogin: setSelectedStampLoginBloom,
                setStampGachi: setStampGachiBloom,
                setStampIroiro: setStampIroiroBloom,
                setStampKizuna: setStampKizunaBloom,
                setStampLive: setStampLiveBloom,
                setStampLogin: setStampLoginBloom,
              },
              cheer: {
                setSelectedStampGachi: setSelectedStampGachiCheer,
                setSelectedStampIroiro: setSelectedStampIroiroCheer,
                setSelectedStampKizuna: setSelectedStampKizunaCheer,
                setSelectedStampLive: setSelectedStampLiveCheer,
                setSelectedStampLogin: setSelectedStampLoginCheer,
                setStampGachi: setStampGachiCheer,
                setStampIroiro: setStampIroiroCheer,
                setStampKizuna: setStampKizunaCheer,
                setStampLive: setStampLiveCheer,
                setStampLogin: setStampLoginCheer,
              },
              connect: {
                setSelectedStampGachi: setSelectedStampGachiConnect,
                setSelectedStampIroiro: setSelectedStampIroiroConnect,
                setSelectedStampKizuna: setSelectedStampKizunaConnect,
                setSelectedStampLive: setSelectedStampLiveConnect,
                setSelectedStampLogin: setSelectedStampLoginConnect,
                setStampGachi: setStampGachiConnect,
                setStampIroiro: setStampIroiroConnect,
                setStampKizuna: setStampKizunaConnect,
                setStampLive: setStampLiveConnect,
                setStampLogin: setStampLoginConnect,
              },
            },
          },
          reward: {
            flowers: {
              setIsReward25Bottle,
              setIsReward25Crystal,
              setIsRewardCostume,
              setIsRewardLnBottle,
              setIsRewardLnCrystal,
              setIsRewardMmjBottle,
              setIsRewardMmjCrystal,
              setIsRewardSkill,
              setIsRewardVbsBottle,
              setIsRewardVbsCrystal,
              setIsRewardVsBottle,
              setIsRewardVsCrystal,
              setIsRewardWsBottle,
              setIsRewardWsCrystal,
            },
            petals: {
              setNumberOfRewardCrystal,
              setNumberOfRewardDrink,
              setNumberOfRewardDroplet,
              setNumberOfRewardPractice,
              setNumberOfRewardSkill,
              setNumberOfRewardVirtualCoin,
            },
          },
        },
        state: {
          acquisition: {
            anniversaryEventRank,
            fesBonus,
            hasCmpensationAnnivCard,
            isGacha25,
            isGachaLn,
            isGachaMmj,
            isGachaVbs,
            isGachaVs,
            isGachaWs,
            isHappiness,
            isPremiumLiveMission,
            liveMission,
            loginDays,
            numberOfEventBadgeBlue,
            numberOfEventBadgeGreen,
            numberOfEventBadgeOrange,
            numberOfEventBadgePurple,
            numberOfEventBadgeRed,
            numberOfEventBadgeWhite,
            numberOfRewardAfterPartyStickerBlue,
            numberOfRewardAfterPartyStickerGreen,
            numberOfRewardAfterPartyStickerOrange,
            numberOfRewardAfterPartyStickerPurple,
            numberOfRewardAfterPartyStickerRed,
            numberOfRewardAfterPartyStickerWhite,
            numberOfRewardAfterPartyStickerWild,
            oclockEventRank,
            stamp: {
              bloom: {
                isStampShop: isStampShopBloom,
                selectedStampGachi: selectedStampGachiBloom,
                selectedStampIroiro: selectedStampIroiroBloom,
                selectedStampKizuna: selectedStampKizunaBloom,
                selectedStampLive: selectedStampLiveBloom,
                selectedStampLogin: selectedStampLoginBloom,
                stampGachi: stampGachiBloom,
                stampIroiro: stampIroiroBloom,
                stampKizuna: stampKizunaBloom,
                stampLive: stampLiveBloom,
                stampLogin: stampLoginBloom,
              },
              cheer: {
                selectedStampGachi: selectedStampGachiCheer,
                selectedStampIroiro: selectedStampIroiroCheer,
                selectedStampKizuna: selectedStampKizunaCheer,
                selectedStampLive: selectedStampLiveCheer,
                selectedStampLogin: selectedStampLoginCheer,
                stampGachi: stampGachiCheer,
                stampIroiro: stampIroiroCheer,
                stampKizuna: stampKizunaCheer,
                stampLive: stampLiveCheer,
                stampLogin: stampLoginCheer,
              },
              connect: {
                selectedStampGachi: selectedStampGachiConnect,
                selectedStampIroiro: selectedStampIroiroConnect,
                selectedStampKizuna: selectedStampKizunaConnect,
                selectedStampLive: selectedStampLiveConnect,
                selectedStampLogin: selectedStampLoginConnect,
                stampGachi: stampGachiConnect,
                stampIroiro: stampIroiroConnect,
                stampKizuna: stampKizunaConnect,
                stampLive: stampLiveConnect,
                stampLogin: stampLoginConnect,
              },
            },
            vbsEventRank,
          },
          result: {
            bluePetals,
            greenPetals,
            orangePetals,
            purplePetals,
            redPetals,
            whitePetals,
            wildFlowers,
          },
          reward: {
            flowers: {
              isReward25Bottle,
              isReward25Crystal,
              isRewardCostume,
              isRewardLnBottle,
              isRewardLnCrystal,
              isRewardMmjBottle,
              isRewardMmjCrystal,
              isRewardSkill,
              isRewardVbsBottle,
              isRewardVbsCrystal,
              isRewardVsBottle,
              isRewardVsCrystal,
              isRewardWsBottle,
              isRewardWsCrystal,
            },
            petals: {
              numberOfRewardCrystal,
              numberOfRewardDrink,
              numberOfRewardDroplet,
              numberOfRewardPractice,
              numberOfRewardSkill,
              numberOfRewardVirtualCoin,
            },
          },
        },
      }}
    >
      {children}
    </FortuneFlowerContext.Provider>
  )
}

export const useFortuneFlowerContext = () => {
  const context = useContext(FortuneFlowerContext)
  if (context === undefined)
    throw new Error("Function 'useFortuneFlowerContext' must be used in Provider.")
  return context
}

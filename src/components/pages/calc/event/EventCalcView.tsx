"use client"

import { ButtonProps } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import React, { useState } from "react"
import { Deck } from "./Deck"

const NUM_DECKS = 5

const MASTER_RANK_RATE: Record<string, number[]> = {
  bd: [5, 7, 9, 11, 13, 15],
  pu: [10, 12.5, 15, 17.5, 20, 25],
  star1: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
  star2: [0, 0.2, 0.4, 0.6, 0.8, 1],
  star3: [0, 1, 2, 3, 4, 5],
  star4: [10, 12.5, 15, 17.5, 20, 25],
}

const RANK_NAMES: Record<string, string> = {
  bd: "BD",
  star1: "★1",
  star2: "★2",
  star3: "★3",
  star4: "★4",
}

const BOUNS_TYPE = 25
const BOUNS_CHARACTER = 25
const BOUNS_CHARACTER_VS = 25
const PU_CHARACTER = 20

export function EventCalcView() {
  const [decks, setDecks] = useState(
    Array.from({ length: NUM_DECKS }, () => ({
      bonusCharacterIndex: 0,
      bonusTypeIndex: 0,
      masterRankIndex: 0,
      rareIndex: 0,
    }))
  )

  const updateDeckFields = (index: number, changes: Partial<(typeof decks)[0]>) => {
    setDecks((prev) => prev.map((deck, i) => (i === index ? { ...deck, ...changes } : deck)))
  }

  const variants: ButtonProps["variant"][] = [
    "default",
    "primary",
    "secondary",
    "danger",
    "warning",
  ]

  const calcDeckBonus = (deck: (typeof decks)[number]) => {
    const rareKeys = ["pu", "star4", "bd", "star3", "star2", "star1"]
    const bonusTypeKeys = ["on", "off"]
    const bonusCharacterKeys = ["on", "vs", "off"]

    const rare = rareKeys[deck.rareIndex] || ""
    const masterRank = deck.masterRankIndex || 0
    const bonusType = bonusTypeKeys[deck.bonusTypeIndex] || "off"
    const bonusCharacter = bonusCharacterKeys[deck.bonusCharacterIndex] || "off"

    let bonus = 0

    if (bonusType === "on") {
      bonus += BOUNS_TYPE
    }
    if (bonusCharacter === "on") {
      bonus += BOUNS_CHARACTER
    }
    if (bonusCharacter === "vs") {
      bonus += BOUNS_CHARACTER_VS
    }
    if (rare === "pu") {
      bonus += PU_CHARACTER
    }
    if (MASTER_RANK_RATE[rare]) {
      bonus += MASTER_RANK_RATE[rare][masterRank] || 0
    }

    return bonus
  }

  const totalBonus = decks.reduce((acc, deck) => acc + calcDeckBonus(deck), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">calculate</span>
        <div>イベントボーナス計算機</div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {decks.map((deck, index) => (
          <Deck
            key={index}
            selectedRareIndex={deck.rareIndex}
            onChangeRareIndex={(val) => {
              if (val === 0) {
                // PUならtype/characterを強制OFFに
                updateDeckFields(index, {
                  bonusCharacterIndex: 0,
                  bonusTypeIndex: 0,
                  rareIndex: val,
                })
              } else {
                updateDeckFields(index, {
                  rareIndex: val,
                })
              }
            }}
            selectedMasterRankIndex={deck.masterRankIndex}
            onChangeMasterRankIndex={(val) => updateDeckFields(index, { masterRankIndex: val })}
            selectedBonusTypeIndex={deck.bonusTypeIndex}
            onChangeBonusTypeIndex={(val) => {
              if (val !== 0 && deck.rareIndex === 0) {
                // typeが一致でrareがPUならrareを★4に
                updateDeckFields(index, {
                  bonusTypeIndex: val,
                  rareIndex: 1,
                })
              } else {
                updateDeckFields(index, {
                  bonusTypeIndex: val,
                })
              }
            }}
            selectedBonusCharacterIndex={deck.bonusCharacterIndex}
            onChangeBonusCharacterIndex={(val) => {
              if (val !== 0 && deck.rareIndex === 0) {
                // characterが一致でrareならrareを★4に
                updateDeckFields(index, {
                  bonusCharacterIndex: val,
                  rareIndex: 1,
                })
              } else {
                updateDeckFields(index, { bonusCharacterIndex: val })
              }
            }}
            title={`編成${index + 1}`}
            buttonVariant={variants[index]}
            description={`${calcDeckBonus(deck)} %`}
          />
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">合計</CardTitle>
            <CardDescription className="text-lg font-bold text-blue-600">
              {totalBonus} %
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>25/09/01時点での計算式は以下の通りです</div>
            <dl className="space-y-2">
              <dt>ボーナスタイプ一致</dt>
              <dd className="pl-2">+ {BOUNS_TYPE} %</dd>
              <dt>ボーナスキャラクター一致</dt>
              <dd className="pl-2">+ {BOUNS_CHARACTER} %</dd>
              <dt>無印バチャシン使用時</dt>
              <dd className="pl-2">+ {BOUNS_CHARACTER_VS} %</dd>
              <dt>PUキャラ使用時</dt>
              <dd className="pl-2">+ {PU_CHARACTER} %</dd>
              <dt>マスランボーナス</dt>
              <dd className="pl-2">
                <dl className="grid grid-cols-[50px_1fr] gap-y-2">
                  {["star4", "bd", "star3", "star2", "star1"].map((rank) => (
                    <React.Fragment key={rank}>
                      <dt>{RANK_NAMES[rank]}</dt>
                      <dd>+ {MASTER_RANK_RATE[rank].join(" / ")} %</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

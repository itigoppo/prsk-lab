"use client"

import { ButtonProps } from "@/components/ui/Button"
import { useCallback, useState } from "react"
import { Bonus } from "./Bonus"
import { Deck } from "./Deck"
import {
  BOUNS_CHARACTER,
  BOUNS_CHARACTER_VS,
  BOUNS_TYPE,
  MASTER_RANK_RATE,
  NUM_DECKS,
  PU_CHARACTER,
} from "./constants"

export function DeckList() {
  const [decks, setDecks] = useState(
    Array.from({ length: NUM_DECKS }, () => ({
      bonusCharacterIndex: 0,
      bonusTypeIndex: 0,
      masterRankIndex: 0,
      rareIndex: 0,
    }))
  )

  const updateDeckFields = useCallback((index: number, changes: Partial<(typeof decks)[0]>) => {
    setDecks((prev) => prev.map((deck, i) => (i === index ? { ...deck, ...changes } : deck)))
  }, [])

  const variants: ButtonProps["variant"][] = ["deck1", "deck2", "deck3", "deck4", "deck5"]

  const calcDeckBonus = useCallback((deck: (typeof decks)[number]) => {
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
  }, [])

  const totalBonus = decks.reduce((acc, deck) => acc + calcDeckBonus(deck), 0)

  return (
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

      <Bonus totalBonus={totalBonus} />
    </div>
  )
}

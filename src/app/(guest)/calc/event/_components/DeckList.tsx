"use client"

import { useCallback, useMemo, useState } from "react"
import { Bonus } from "./Bonus"
import { Deck } from "./Deck"
import {
  BONUS_CHARACTER_KEYS,
  BONUS_TYPE_KEYS,
  BOUNS_CHARACTER,
  BOUNS_CHARACTER_VS,
  BOUNS_TYPE,
  DECK_VARIANTS,
  MASTER_RANK_RATE,
  NUM_DECKS,
  PU_CHARACTER,
  RARE_KEYS,
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

  const handleRareIndexChange = useCallback(
    (index: number) => (val: number) => {
      if (val === 0) {
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
    },
    [updateDeckFields]
  )

  const handleMasterRankChange = useCallback(
    (index: number) => (val: number) => {
      updateDeckFields(index, { masterRankIndex: val })
    },
    [updateDeckFields]
  )

  const handleBonusTypeChange = useCallback(
    (index: number) => (val: number) => {
      setDecks((prev) => {
        if (val !== 0 && prev[index].rareIndex === 0) {
          return prev.map((deck, i) =>
            i === index ? { ...deck, bonusTypeIndex: val, rareIndex: 1 } : deck
          )
        } else {
          return prev.map((deck, i) => (i === index ? { ...deck, bonusTypeIndex: val } : deck))
        }
      })
    },
    []
  )

  const handleBonusCharacterChange = useCallback(
    (index: number) => (val: number) => {
      setDecks((prev) => {
        if (val !== 0 && prev[index].rareIndex === 0) {
          return prev.map((deck, i) =>
            i === index ? { ...deck, bonusCharacterIndex: val, rareIndex: 1 } : deck
          )
        } else {
          return prev.map((deck, i) => (i === index ? { ...deck, bonusCharacterIndex: val } : deck))
        }
      })
    },
    []
  )

  const deckHandlers = useMemo(
    () =>
      Array.from({ length: NUM_DECKS }, (_, index) => ({
        onChangeBonusCharacterIndex: handleBonusCharacterChange(index),
        onChangeBonusTypeIndex: handleBonusTypeChange(index),
        onChangeMasterRankIndex: handleMasterRankChange(index),
        onChangeRareIndex: handleRareIndexChange(index),
      })),
    [
      handleBonusCharacterChange,
      handleBonusTypeChange,
      handleMasterRankChange,
      handleRareIndexChange,
    ]
  )

  const calcDeckBonus = useCallback((deck: (typeof decks)[number]) => {
    const rare = RARE_KEYS[deck.rareIndex] || ""
    const masterRank = deck.masterRankIndex || 0
    const bonusType = BONUS_TYPE_KEYS[deck.bonusTypeIndex] || "off"
    const bonusCharacter = BONUS_CHARACTER_KEYS[deck.bonusCharacterIndex] || "off"

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
          onChangeRareIndex={deckHandlers[index].onChangeRareIndex}
          selectedMasterRankIndex={deck.masterRankIndex}
          onChangeMasterRankIndex={deckHandlers[index].onChangeMasterRankIndex}
          selectedBonusTypeIndex={deck.bonusTypeIndex}
          onChangeBonusTypeIndex={deckHandlers[index].onChangeBonusTypeIndex}
          selectedBonusCharacterIndex={deck.bonusCharacterIndex}
          onChangeBonusCharacterIndex={deckHandlers[index].onChangeBonusCharacterIndex}
          title={`編成${index + 1}`}
          buttonVariant={DECK_VARIANTS[index]}
          description={`${calcDeckBonus(deck)} %`}
        />
      ))}

      <Bonus totalBonus={totalBonus} />
    </div>
  )
}

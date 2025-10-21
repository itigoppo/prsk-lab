export const NUM_DECKS = 5

export const MASTER_RANK_RATE: Record<string, number[]> = {
  bd: [5, 7, 9, 11, 13, 15],
  pu: [10, 12.5, 15, 17.5, 20, 25],
  star1: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
  star2: [0, 0.2, 0.4, 0.6, 0.8, 1],
  star3: [0, 1, 2, 3, 4, 5],
  star4: [10, 12.5, 15, 17.5, 20, 25],
}

export const RANK_NAMES: Record<string, string> = {
  bd: "BD",
  star1: "★1",
  star2: "★2",
  star3: "★3",
  star4: "★4",
}

export const BOUNS_TYPE = 25
export const BOUNS_CHARACTER = 25
export const BOUNS_CHARACTER_VS = 25
export const PU_CHARACTER = 20

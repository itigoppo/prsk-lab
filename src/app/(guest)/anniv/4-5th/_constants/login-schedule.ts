export type LoginSchedule = {
  day: string
  pieces: number
}

export const loginSchedule: LoginSchedule[] = [
  {
    day: "1日目(03/30)",
    pieces: 10,
  },
  {
    day: "2日目(03/31)",
    pieces: 5,
  },
  {
    day: "3日目(04/01)",
    pieces: 5,
  },
  {
    day: "4日目(04/02)",
    pieces: 10,
  },
  {
    day: "5日目(04/03)",
    pieces: 5,
  },
  {
    day: "6日目(04/04)",
    pieces: 5,
  },
  {
    day: "7日目(04/05)",
    pieces: 10,
  },
]

export const eventRankRange = [
  {
    pieces: 100,
    rank: 10000,
  },
  {
    pieces: 75,
    rank: 50000,
  },
  {
    pieces: 50,
    rank: 100000,
  },
  {
    pieces: 25,
    rank: 300000,
  },
  {
    pieces: 0,
    rank: 0,
  },
]

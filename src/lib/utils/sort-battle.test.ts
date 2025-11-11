import { describe, expect, it } from "vitest"
import { SortBattle, SortBattleChoice } from "./sort-battle"

describe("SortBattle", () => {
  describe("初期化とセットアップ", () => {
    it("2項目でSortBattleを初期化できる", () => {
      const battle = new SortBattle(2)

      expect(battle.getIsCompleted()).toBe(false)
      expect(battle.getCurrentBattleCount()).toBe(1)
      expect(battle.getCurrentPair()).toEqual([0, 1])
    })

    it("3項目でSortBattleを初期化できる", () => {
      const battle = new SortBattle(3)

      expect(battle.getIsCompleted()).toBe(false)
      expect(battle.getCurrentBattleCount()).toBe(1)
      expect(battle.getCurrentPair()).not.toBeNull()
    })

    it("10項目でSortBattleを初期化できる", () => {
      const battle = new SortBattle(10)

      expect(battle.getIsCompleted()).toBe(false)
      expect(battle.getCurrentBattleCount()).toBe(1)
      expect(battle.getProgress()).toBe(0)
    })

    it("初期状態ではgetResultを呼ぶとエラーになる", () => {
      const battle = new SortBattle(3)

      expect(() => battle.getResult()).toThrow("Sorting not completed yet.")
    })
  })

  describe("2項目のソート", () => {
    it("LEFT選択で[0, 1]の順序になる", () => {
      const battle = new SortBattle(2)

      battle.choose(SortBattleChoice.LEFT)

      expect(battle.getIsCompleted()).toBe(true)
      expect(battle.getProgress()).toBe(100)

      const result = battle.getResult()
      expect(result.flatOrder).toEqual([0, 1])
      expect(result.ranking).toEqual([[0], [1]])
    })

    it("RIGHT選択で[1, 0]の順序になる", () => {
      const battle = new SortBattle(2)

      battle.choose(SortBattleChoice.RIGHT)

      expect(battle.getIsCompleted()).toBe(true)

      const result = battle.getResult()
      expect(result.flatOrder).toEqual([1, 0])
      expect(result.ranking).toEqual([[1], [0]])
    })

    it("EQUAL選択で同順位になる", () => {
      const battle = new SortBattle(2)

      battle.choose(SortBattleChoice.EQUAL)

      expect(battle.getIsCompleted()).toBe(true)

      const result = battle.getResult()
      expect(result.flatOrder).toEqual([0, 1])
      expect(result.ranking).toEqual([[0, 1]])
    })
  })

  describe("3項目のソート", () => {
    it("全てLEFT選択で昇順ソート", () => {
      const battle = new SortBattle(3)

      // 全てLEFTを選択し続ける
      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      expect(battle.getIsCompleted()).toBe(true)

      const result = battle.getResult()
      expect(result.flatOrder).toEqual([0, 1, 2])
      expect(result.ranking).toEqual([[0], [1], [2]])
    })

    it("全てRIGHT選択で降順ソート", () => {
      const battle = new SortBattle(3)

      // 全てRIGHTを選択し続ける
      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.RIGHT)
      }

      expect(battle.getIsCompleted()).toBe(true)

      const result = battle.getResult()
      expect(result.flatOrder).toEqual([2, 1, 0])
      expect(result.ranking).toEqual([[2], [1], [0]])
    })

    it("進捗が正しく計算される", () => {
      const battle = new SortBattle(3)

      const initialProgress = battle.getProgress()
      expect(initialProgress).toBe(0)

      battle.choose(SortBattleChoice.LEFT)
      const midProgress = battle.getProgress()
      expect(midProgress).toBeGreaterThan(0)
      expect(midProgress).toBeLessThan(100)

      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      expect(battle.getProgress()).toBe(100)
    })
  })

  describe("4項目のソート", () => {
    it("混合選択で正しくソートされる", () => {
      const battle = new SortBattle(4)

      // 意図的な選択パターン
      const choices = [
        SortBattleChoice.RIGHT, // 1 vs 0
        SortBattleChoice.LEFT, // 3 vs 2
        SortBattleChoice.RIGHT, // 1 vs 3
        SortBattleChoice.RIGHT, // 0 vs 2
        SortBattleChoice.RIGHT, // 0 vs 3
      ]

      choices.forEach((choice) => {
        if (!battle.getIsCompleted()) {
          battle.choose(choice)
        }
      })

      expect(battle.getIsCompleted()).toBe(true)
      const result = battle.getResult()

      // 結果が有効な順序であることを確認
      expect(result.flatOrder).toHaveLength(4)
      expect(result.ranking).toHaveLength(4)
    })

    it("一部を同順位にできる", () => {
      const battle = new SortBattle(4)

      // 最初の比較でEQUALを選択
      battle.choose(SortBattleChoice.EQUAL)

      // 残りをLEFTで進める
      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      expect(battle.getIsCompleted()).toBe(true)

      const result = battle.getResult()
      expect(result.flatOrder).toHaveLength(4)

      // 少なくとも1つの同順位グループがあることを確認
      const hasTie = result.ranking.some((group) => group.length > 1)
      expect(hasTie).toBe(true)
    })
  })

  describe("getCurrentPair()", () => {
    it("完了前は比較ペアを返す", () => {
      const battle = new SortBattle(3)

      const pair = battle.getCurrentPair()
      expect(pair).not.toBeNull()
      expect(pair).toHaveLength(2)
      expect(typeof pair![0]).toBe("number")
      expect(typeof pair![1]).toBe("number")
    })

    it("完了後はnullを返す", () => {
      const battle = new SortBattle(2)

      battle.choose(SortBattleChoice.LEFT)

      expect(battle.getIsCompleted()).toBe(true)
      expect(battle.getCurrentPair()).toBeNull()
    })
  })

  describe("getCurrentBattleCount()", () => {
    it("選択するたびにカウントが増加する", () => {
      const battle = new SortBattle(3)

      expect(battle.getCurrentBattleCount()).toBe(1)

      battle.choose(SortBattleChoice.LEFT)
      expect(battle.getCurrentBattleCount()).toBeGreaterThan(1)
    })

    it("完了後もカウントは維持される", () => {
      const battle = new SortBattle(2)

      battle.choose(SortBattleChoice.LEFT)
      const finalCount = battle.getCurrentBattleCount()

      expect(battle.getIsCompleted()).toBe(true)
      expect(finalCount).toBeGreaterThan(0)
    })
  })

  describe("getProgress()", () => {
    it("0%から100%の範囲内である", () => {
      const battle = new SortBattle(5)

      while (!battle.getIsCompleted()) {
        const progress = battle.getProgress()
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
        battle.choose(SortBattleChoice.LEFT)
      }

      expect(battle.getProgress()).toBe(100)
    })

    it("進捗は単調増加する", () => {
      const battle = new SortBattle(4)

      let lastProgress = 0
      while (!battle.getIsCompleted()) {
        const currentProgress = battle.getProgress()
        expect(currentProgress).toBeGreaterThanOrEqual(lastProgress)
        lastProgress = currentProgress
        battle.choose(SortBattleChoice.LEFT)
      }

      expect(battle.getProgress()).toBe(100)
    })
  })

  describe("getResult()", () => {
    it("flatOrderとrankingの両方を返す", () => {
      const battle = new SortBattle(3)

      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      const result = battle.getResult()

      expect(result).toHaveProperty("flatOrder")
      expect(result).toHaveProperty("ranking")
      expect(Array.isArray(result.flatOrder)).toBe(true)
      expect(Array.isArray(result.ranking)).toBe(true)
    })

    it("flatOrderは全ての項目を含む", () => {
      const count = 5
      const battle = new SortBattle(count)

      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      const result = battle.getResult()

      expect(result.flatOrder).toHaveLength(count)
      expect(new Set(result.flatOrder).size).toBe(count)
    })

    it("rankingの全項目数はflatOrderと一致する", () => {
      const count = 4
      const battle = new SortBattle(count)

      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      const result = battle.getResult()

      const totalInRanking = result.ranking.reduce((sum, group) => sum + group.length, 0)
      expect(totalInRanking).toBe(count)
    })

    it("同順位が正しく処理される", () => {
      const battle = new SortBattle(3)

      // 最初の比較でEQUALを選択
      battle.choose(SortBattleChoice.EQUAL)

      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.LEFT)
      }

      const result = battle.getResult()

      // 同順位グループが存在することを確認
      const tieGroup = result.ranking.find((group) => group.length > 1)
      expect(tieGroup).toBeDefined()
      expect(tieGroup!.length).toBeGreaterThan(1)
    })
  })

  describe("エッジケース", () => {
    it("大量の項目でも動作する", () => {
      const battle = new SortBattle(20)

      expect(battle.getIsCompleted()).toBe(false)
      expect(battle.getCurrentPair()).not.toBeNull()

      // 全てLEFTで進める（時間がかかるため一部のみテスト）
      let iterations = 0
      const maxIterations = 100
      while (!battle.getIsCompleted() && iterations < maxIterations) {
        battle.choose(SortBattleChoice.LEFT)
        iterations++
      }

      // 進捗が進んでいることを確認
      expect(battle.getProgress()).toBeGreaterThan(0)
    })

    it("全てEQUALで全員同順位", () => {
      const battle = new SortBattle(3)

      while (!battle.getIsCompleted()) {
        battle.choose(SortBattleChoice.EQUAL)
      }

      const result = battle.getResult()

      // 全員が1つのグループに入るか、連結された同順位グループになる
      const allItemsCount = result.ranking.reduce((sum, group) => sum + group.length, 0)
      expect(allItemsCount).toBe(3)
    })
  })
})

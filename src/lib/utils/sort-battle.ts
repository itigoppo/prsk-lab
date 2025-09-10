export type SortBattleResult = {
  flatOrder: number[] // [0, 1, 2, 3, ...]
  ranking: number[][] // [[0], [1, 2], [3], ...] 同順位あり
}

export enum SortBattleChoice {
  EQUAL = "equal",
  LEFT = "left",
  RIGHT = "right",
}

export class SortBattle {
  private readonly totalItems: number

  private sortedGroups: number[][] = []
  private parentGroupIndexes: number[] = []
  private totalComparisons: number = 0
  private mergeBuffer: number[] = []
  private bufferIndex: number = 0
  private equalIndexMap: number[] = []

  private leftIndex: number = 0
  private rightIndex: number = 0
  private leftCursor: number = 0
  private rightCursor: number = 0

  private completedComparisons: number = 0
  private isCompleted: boolean = false
  private comparisonCount: number = 1

  constructor(count: number) {
    this.totalItems = count
    this.initializeSortStructure()
  }

  private initializeSortStructure() {
    let groupId = 0
    this.sortedGroups[groupId] = []

    for (let i = 0; i < this.totalItems; i++) {
      this.sortedGroups[groupId][i] = i
    }

    this.parentGroupIndexes[groupId] = -1
    this.totalComparisons = 0
    groupId++

    for (let i = 0; i < this.sortedGroups.length; i++) {
      const group = this.sortedGroups[i]
      if (group.length >= 2) {
        const mid = Math.ceil(group.length / 2)
        this.sortedGroups[groupId] = []
        this.sortedGroups[groupId] = group.slice(0, mid)
        this.totalComparisons += this.sortedGroups[groupId].length
        this.parentGroupIndexes[groupId] = i
        groupId++
        this.sortedGroups[groupId] = []
        this.sortedGroups[groupId] = group.slice(mid, group.length)
        this.totalComparisons += this.sortedGroups[groupId].length
        this.parentGroupIndexes[groupId] = i
        groupId++
      }
    }

    this.mergeBuffer = new Array(this.totalItems).fill(0)
    this.equalIndexMap = new Array(this.totalItems).fill(-1)
    this.bufferIndex = 0

    const len = this.sortedGroups.length
    this.leftIndex = len - 2
    this.rightIndex = len - 1
  }

  // === Public APIs ===
  public choose(choice: SortBattleChoice) {
    if (choice === SortBattleChoice.EQUAL) {
      // 左のグループの先頭を追加
      this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.leftIndex][this.leftCursor]
      this.leftCursor++
      this.bufferIndex++
      this.completedComparisons++
      while (this.equalIndexMap[this.mergeBuffer[this.bufferIndex - 1]] !== -1) {
        this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.leftIndex][this.leftCursor]
        this.leftCursor++
        this.bufferIndex++
        this.completedComparisons++
      }
      // 右のグループの先頭を追加
      this.equalIndexMap[this.mergeBuffer[this.bufferIndex - 1]] =
        this.sortedGroups[this.rightIndex][this.rightCursor]
      this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.rightIndex][this.rightCursor]
      this.rightCursor++
      this.bufferIndex++
      this.completedComparisons++
      while (this.equalIndexMap[this.mergeBuffer[this.bufferIndex - 1]] !== -1) {
        this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.rightIndex][this.rightCursor]
        this.rightCursor++
        this.bufferIndex++
        this.completedComparisons++
      }
    } else if (choice === SortBattleChoice.LEFT) {
      // 左のグループの先頭を追加
      this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.leftIndex][this.leftCursor]
      this.leftCursor++
      this.bufferIndex++
      this.completedComparisons++
      while (this.equalIndexMap[this.mergeBuffer[this.bufferIndex - 1]] !== -1) {
        this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.leftIndex][this.leftCursor]
        this.leftCursor++
        this.bufferIndex++
        this.completedComparisons++
      }
    } else if (choice === SortBattleChoice.RIGHT) {
      // 右のグループの先頭を追加
      this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.rightIndex][this.rightCursor]
      this.rightCursor++
      this.bufferIndex++
      this.completedComparisons++
      while (this.equalIndexMap[this.mergeBuffer[this.bufferIndex - 1]] !== -1) {
        this.mergeBuffer[this.bufferIndex] = this.sortedGroups[this.rightIndex][this.rightCursor]
        this.rightCursor++
        this.bufferIndex++
        this.completedComparisons++
      }
    }

    const leftGroup = this.sortedGroups[this.leftIndex]
    const rightGroup = this.sortedGroups[this.rightIndex]

    if (this.leftCursor < leftGroup.length && this.rightCursor === rightGroup.length) {
      while (this.leftCursor < leftGroup.length) {
        this.mergeBuffer[this.bufferIndex] = leftGroup[this.leftCursor]
        this.leftCursor++
        this.bufferIndex++
        this.completedComparisons++
      }
    } else if (this.leftCursor === leftGroup.length && this.rightCursor < rightGroup.length) {
      while (this.rightCursor < rightGroup.length) {
        this.mergeBuffer[this.bufferIndex] = rightGroup[this.rightCursor]
        this.rightCursor++
        this.bufferIndex++
        this.completedComparisons++
      }
    }

    if (this.leftCursor === leftGroup.length && this.rightCursor === rightGroup.length) {
      for (let i = 0; i < leftGroup.length + rightGroup.length; i++) {
        this.sortedGroups[this.parentGroupIndexes[this.leftIndex]][i] = this.mergeBuffer[i]
      }
      this.sortedGroups.pop()
      this.sortedGroups.pop()
      this.leftIndex = this.leftIndex - 2
      this.rightIndex = this.rightIndex - 2
      this.leftCursor = 0
      this.rightCursor = 0
      if (this.leftCursor === 0 && this.rightCursor === 0) {
        this.mergeBuffer = new Array(this.totalItems).fill(0)
        this.bufferIndex = 0
      }
    }

    if (this.leftIndex < 0) {
      this.isCompleted = true
    } else {
      this.comparisonCount++
    }
  }

  public getProgress(): number {
    return Math.floor((this.completedComparisons * 100) / this.totalComparisons)
  }

  public getCurrentBattleCount(): number {
    return this.comparisonCount
  }

  public getIsCompleted(): boolean {
    return this.isCompleted
  }

  public getCurrentPair(): [number, number] | null {
    if (this.isCompleted) return null

    return [
      this.sortedGroups[this.leftIndex][this.leftCursor],
      this.sortedGroups[this.rightIndex][this.rightCursor],
    ]
  }

  public getResult(): SortBattleResult {
    if (!this.isCompleted) {
      throw new Error("Sorting not completed yet.")
    }

    const flat = this.sortedGroups[0]
    const visited = new Set<number>()
    const ranked: number[][] = []

    for (const id of flat) {
      if (visited.has(id)) continue

      const group = [id]
      visited.add(id)

      let current = id
      while (this.equalIndexMap[current] !== -1 && !visited.has(this.equalIndexMap[current])) {
        const equalId = this.equalIndexMap[current]
        group.push(equalId)
        visited.add(equalId)
        current = equalId
      }

      ranked.push(group)
    }

    return {
      flatOrder: flat,
      ranking: ranked,
    }
  }
}

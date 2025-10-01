"use client"

import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import BattleCharacter from "@/components/pages/play/sort/BattleCharacter"
import { CharacterList } from "@/components/pages/play/sort/CharacterList"
import { Ranking } from "@/components/pages/play/sort/Ranking"
import { Button } from "@/components/ui/Button"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { useGetApiCharacters } from "@/lib/api/generated/characters/characters"
import { SortBattle, SortBattleChoice } from "@/lib/utils/sort-battle"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-hot-toast"

export default function PlaySortPage() {
  const { data, error, isLoading } = useGetApiCharacters()
  const characters = useMemo(() => data?.data?.characters ?? [], [data?.data?.characters])
  const initialError = error ?? null

  const battleRef = useRef<SortBattle | null>(null)

  const [currentPair, setCurrentPair] = useState<[number, number] | null>(null)
  const [battleCount, setBattleCount] = useState(1)
  const [finalResult, setFinalResult] = useState<number[][] | null>(null)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const initializeBattle = useCallback(() => {
    if (!characters || characters.length === 0) return

    const battle = new SortBattle(characters.length)
    battleRef.current = battle

    setFinalResult(null)
    setProgress(0)
    setBattleCount(1)

    const pair = battle.getCurrentPair()
    setCurrentPair(pair)
  }, [characters])

  useEffect(() => {
    initializeBattle()
  }, [initializeBattle])

  const handleChoice = (choice: SortBattleChoice) => {
    const battle = battleRef.current
    if (!battle || finalResult || isProcessing) return

    setIsProcessing(true)

    try {
      battle.choose(choice)

      setProgress(battle.getProgress())
      setBattleCount(battle.getCurrentBattleCount())

      if (battle.getIsCompleted()) {
        setFinalResult(battle.getResult().ranking)
        setCurrentPair(null)
      } else {
        setCurrentPair(battle.getCurrentPair())
      }
    } catch {
      toast.error("エラーが発生しました。ページをリロードするか、リセットしてください。")
    }

    setTimeout(() => setIsProcessing(false), 50)
  }

  const handleReset = () => {
    initializeBattle()
  }

  const isError = !!initialError
  const isEmpty = !isLoading && !isError && (!characters || characters.length === 0)
  const isReady = !isLoading && !isError && !isEmpty

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">social_leaderboard</span>
        <div>キャラクターソート</div>
      </div>
      {isLoading && <LoadingState />}
      {isError && <ErrorState error={initialError} onRetry={handleReset} />}
      {isEmpty && <ErrorState error="比較対象のキャラクターがありません" onRetry={handleReset} />}

      {!isLoading && !isError && !isEmpty && (
        <>
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="rounded bg-amber-100 px-4 py-2 text-center text-sm">
              今 {battleCount} 回目の選択 進捗 {progress} %
            </div>

            {isReady && !finalResult && (
              <div className="text-center text-sm">
                好きな方（または引き分け）を選択してください
              </div>
            )}

            <ProgressBar value={progress} />

            <div className="flex justify-center">
              {isEmpty && (
                <>
                  <BattleCharacter left />
                  <BattleCharacter />
                  <BattleCharacter right />
                </>
              )}

              {isReady && currentPair && (
                <>
                  <BattleCharacter
                    left
                    character={characters[currentPair[0]]}
                    onClick={() => handleChoice(SortBattleChoice.LEFT)}
                  />

                  <BattleCharacter onClick={() => handleChoice(SortBattleChoice.EQUAL)} />

                  <BattleCharacter
                    right
                    character={characters[currentPair[1]]}
                    onClick={() => handleChoice(SortBattleChoice.RIGHT)}
                  />
                </>
              )}
            </div>

            {isReady && (
              <div className="flex justify-end space-x-4">
                <Button
                  variant={finalResult ? "primary" : "danger"}
                  size="sm"
                  outline={!finalResult}
                  onClick={handleReset}
                >
                  {finalResult ? "もう一度やる" : "リセット"}
                </Button>
              </div>
            )}
          </div>

          {isReady && !finalResult && <CharacterList characters={characters} />}

          {isReady && finalResult && (
            <Ranking characters={characters} groupedResult={finalResult} />
          )}
        </>
      )}
    </div>
  )
}

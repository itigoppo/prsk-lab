import { fetchCharacters } from "@/lib/api/characters/get-characters"
import { CharacterListItem } from "@/types/character"
import { useCallback, useEffect, useState } from "react"

export const useApiCharacters = () => {
  const [characters, setCharacters] = useState<CharacterListItem[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)

  const loadCharacters = useCallback(async () => {
    setInitialLoading(true)
    setInitialError(null)

    try {
      const res = await fetchCharacters()

      if (res.success) {
        setCharacters(res.data.characters)
      } else {
        setInitialError(res.message)
      }
    } catch {
      setInitialError("キャラクターの取得に失敗しました")
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  return {
    characters,
    initialError,
    initialLoading,
    refetch: loadCharacters,
  }
}

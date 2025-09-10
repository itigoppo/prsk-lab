import { CharacterListResponse } from "@/types/character"

export async function fetchCharacters(): Promise<CharacterListResponse> {
  try {
    const res = await fetch(`/api/characters`, {})

    if (!res.ok) {
      throw new Error(`APIエラー: ${res.status}`)
    }

    const json = (await res.json()) as CharacterListResponse
    return json
  } catch {
    return {
      data: {
        characters: [],
      },
      message: "キャラクター情報取得に失敗しました",
      success: false,
    }
  }
}

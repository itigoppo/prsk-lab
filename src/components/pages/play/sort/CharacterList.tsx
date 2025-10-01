import { CharacterListItem } from "@/lib/schemas/character"
import { CharacterItem } from "./CharacterItem"

interface CharacterListProps {
  characters: CharacterListItem[]
}

export function CharacterList({ characters }: CharacterListProps) {
  return (
    <div className="space-y-4 text-sm">
      <div>チェック対象メンバー {characters.length} 名</div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        {characters.map((character) => (
          <CharacterItem key={character.code} character={character} />
        ))}
      </div>
    </div>
  )
}

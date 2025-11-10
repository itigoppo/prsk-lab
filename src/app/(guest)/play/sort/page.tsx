import { CharacterSortGame } from "./_components/character-sort-game"

export default function PlaySortPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b-2 border-dashed border-gray-300 pb-2 text-2xl font-bold">
        <span className="material-symbols-outlined">social_leaderboard</span>
        <div>キャラクターソート</div>
      </div>
      <CharacterSortGame />
    </div>
  )
}

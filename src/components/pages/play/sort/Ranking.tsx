import { cn } from "@/lib/utils/common"
import { CharacterListItem } from "@/types/character"
import { CharacterItem } from "./CharacterItem"

interface RankingProps {
  characters: CharacterListItem[]
  groupedResult: number[][]
}

export function Ranking({ characters, groupedResult }: RankingProps) {
  return (
    <div>
      <div className="flex h-10 w-full items-center space-x-1 rounded-t-md border border-slate-600 bg-slate-100 px-2 text-xs font-bold md:px-8">
        <div className="w-20">順位</div>
        <div className="flex-1">メンバー</div>
      </div>
      {groupedResult.map((group, index) => (
        <div
          key={index}
          className={cn(
            "flex min-h-10 w-full items-center space-x-1 border-x border-b border-slate-600 bg-white px-2 text-sm md:px-8",
            index === groupedResult.length - 1 && "rounded-b-md"
          )}
        >
          <div className="w-20">{index + 1}</div>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2 md:grid-cols-4 lg:grid-cols-6">
            {group.map((id) => {
              return <CharacterItem key={id} character={characters[id]} size="sm" />
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

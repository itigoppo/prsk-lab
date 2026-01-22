"use client"

import { IconTofu } from "@/components/icons/tofu"
import { CharacterListItem } from "@/lib/schemas/character"
import { cn } from "@/lib/utils/common"
import Image from "next/image"
import { memo } from "react"

interface BattleCharacterProps {
  character?: CharacterListItem
  left?: boolean
  onClick?: () => void
  right?: boolean
}

function BattleCharacterComponent({ character, left, onClick, right }: BattleCharacterProps) {
  return (
    <div
      className={cn(
        "relative h-28 w-1/2 text-end md:h-32 lg:h-36",
        left && "bg-prsk-left-300",
        right && "bg-prsk-right-300",
        !left && !right && "bg-teal-300",
        onClick && "hover:animate-pulse hover:cursor-pointer"
      )}
      onClick={onClick ? onClick : undefined}
    >
      <div
        className={cn(
          "absolute flex size-28 items-center justify-center md:size-32 lg:size-36",
          left && "bg-prsk-left-400 right-4",
          right && "bg-prsk-right-400 left-4",
          !left && !right && "left-1/2 -translate-x-1/2 bg-teal-400"
        )}
      >
        <div className="flext size-28 items-center justify-center object-cover md:size-32 lg:size-36">
          {character?.avatarUrl ? (
            <Image
              src={character.avatarUrl}
              alt={character.name}
              className="aspect-square size-28 object-cover md:size-32 lg:size-36"
              width={160}
              height={160}
              priority
            />
          ) : (
            <div className="flex size-28 items-center justify-center rounded-full bg-slate-600 md:size-32 lg:size-36">
              <IconTofu className="w-20 text-slate-300 md:w-22 lg:w-24" />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 w-full bg-slate-900/60 p-1 text-start text-xs text-white">
          {character ? (
            <>
              {character.name}
              {character.isVirtualSinger && character.unit?.short && `(${character.unit.short})`}
            </>
          ) : onClick ? (
            "引き分け"
          ) : (
            "あつあつパンケーキ"
          )}
        </div>
      </div>
    </div>
  )
}

export const BattleCharacter = memo(BattleCharacterComponent)

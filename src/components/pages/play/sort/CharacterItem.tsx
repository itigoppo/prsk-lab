import { IconAwardStar, IconTofu } from "@/components/icons"
import { CharacterListItem } from "@/lib/schemas/character"
import { cn } from "@/lib/utils/common"
import { cva, type VariantProps } from "class-variance-authority"
import Image from "next/image"

const characterItemVariants = cva("", {
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "size-28 md:size-32 lg:size-36",
      md: "size-24 md:size-28 lg:size-32",
      sm: "size-20 md:size-24 lg:size-28",
    },
  },
})

interface CharacterItemProps extends VariantProps<typeof characterItemVariants> {
  character: CharacterListItem
}

export function CharacterItem({ character, size }: CharacterItemProps) {
  return (
    <div className="rounded-md bg-white text-center shadow">
      <div className="flex items-center justify-center rounded-t-md bg-slate-50">
        {character.avatarUrl ? (
          <Image
            src={character.avatarUrl}
            alt={character.name}
            className={cn("aspect-square object-cover", characterItemVariants({ size }))}
            width={160}
            height={160}
            priority
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-slate-600",
              characterItemVariants({ size })
            )}
          >
            <IconTofu
              className={cn(
                "text-slate-300",
                size === "lg" && "w-20 md:w-22 lg:w-24",
                (size === "md" || !size) && "w-16 md:w-18 lg:w-20",
                size === "sm" && "w-14 md:w-16 lg:w-18"
              )}
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-center space-x-1 p-2">
        <IconAwardStar className="size-4" style={{ color: character.bgColor ?? "#ffffff" }} />
        <span className="text-xs break-all">
          {size === "sm" ? character.short : character.name}
          {character.isVirtualSinger && character.unit?.short && `(${character.unit.short})`}
        </span>
      </div>
    </div>
  )
}

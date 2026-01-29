interface RequiredBadgeProps {
  required: {
    wild: number
  }
}

export function RequiredBadge({ required }: RequiredBadgeProps) {
  return (
    <div className="flex gap-x-1">
      {required.wild !== 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-linear-to-r from-pink-300 to-purple-400 text-[10px] leading-4 font-bold text-white">
          {required.wild}
        </span>
      )}
    </div>
  )
}

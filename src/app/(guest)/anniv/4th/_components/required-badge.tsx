interface RequiredBadgeProps {
  required: {
    blue: number
    green: number
    orange: number
    purple: number
    red: number
    white: number
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
      {required.white !== 0 && (
        <span className="grid size-5 place-items-center rounded-full border border-slate-950 bg-white text-[10px] leading-4 font-bold">
          {required.white}
        </span>
      )}
      {required.blue !== 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-blue-500 text-[10px] leading-4 font-bold text-white">
          {required.blue}
        </span>
      )}
      {required.green !== 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-green-500 text-[10px] leading-4 font-bold text-white">
          {required.green}
        </span>
      )}
      {required.red !== 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-red-500 text-[10px] leading-4 font-bold text-white">
          {required.red}
        </span>
      )}
      {required.orange !== 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-orange-500 text-[10px] leading-4 font-bold text-white">
          {required.orange}
        </span>
      )}
      {required.purple !== 0 && (
        <span className="grid size-5 place-items-center rounded-full bg-purple-500 text-[10px] leading-4 font-bold text-white">
          {required.purple}
        </span>
      )}
    </div>
  )
}

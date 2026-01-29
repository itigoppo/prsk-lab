"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Pieces } from "./pieces"

export function WorldBloomReward() {
  const [isOpenPieces, setIsOpenPieces] = useState<boolean>(false)

  return (
    <div className="space-y-4 text-sm">
      <div className="border-b-2 border-slate-700 bg-slate-100 p-4 text-base font-bold text-slate-700">
        報酬を選択する
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsOpenPieces((state) => !state)
          }}
        >
          <span className="material-symbols-outlined">add</span>
          ワールドピース交換所
        </Button>
      </div>

      <Pieces isOpen={isOpenPieces} setIsOpen={setIsOpenPieces} />
    </div>
  )
}

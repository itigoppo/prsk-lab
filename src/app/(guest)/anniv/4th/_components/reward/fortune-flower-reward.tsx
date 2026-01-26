"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Flowers } from "./flowers"
import { Petals } from "./petals"

export function FortuneFlowerReward() {
  const [isOpenFlowers, setIsOpenFlowers] = useState<boolean>(false)
  const [isOpenPetals, setIsOpenPetals] = useState<boolean>(false)

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
            setIsOpenFlowers((state) => !state)
          }}
        >
          <span className="material-symbols-outlined">add</span>
          フォーチュンフラワー交換所
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsOpenPetals((state) => !state)
          }}
        >
          <span className="material-symbols-outlined">add</span>
          花びら交換所
        </Button>
      </div>

      <Flowers isOpen={isOpenFlowers} setIsOpen={setIsOpenFlowers} />
      <Petals isOpen={isOpenPetals} setIsOpen={setIsOpenPetals} />
    </div>
  )
}

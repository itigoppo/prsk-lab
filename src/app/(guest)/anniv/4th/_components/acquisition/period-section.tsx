"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils/common"
import { ComponentType, useState } from "react"
import { fortuneFlowerConfigByTimes } from "../../_constants/config"
import { AfterPartySticker } from "./after-party-sticker"
import { EventBadge } from "./event-badge"
import { EventRanking } from "./event-ranking"
import { FesBonus } from "./fes-bonus"
import { HappinessBonus } from "./happiness-bonus"
import { StampMission } from "./stamp-mission"

interface PeriodSectionProps {
  times: 1 | 2 | 3
}

type SectionProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const bonusComponentByTimes: Record<1 | 2 | 3, ComponentType<SectionProps>> = {
  1: FesBonus,
  2: HappinessBonus,
  3: AfterPartySticker,
}

export function PeriodSection({ times }: PeriodSectionProps) {
  const config = fortuneFlowerConfigByTimes[times]
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const BonusComponent = bonusComponentByTimes[times]

  const sections = [
    { id: "bonus", label: config.bonusButtonLabel },
    { id: "eventBadge", label: "イベント交換所" },
    { id: "eventRanking", label: "イベントランキング" },
    { id: "stampMission", label: "スタンプミッション" },
  ]

  return (
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger
        className={cn(
          "border-b-2 border-slate-500 bg-linear-to-r px-6 py-4 font-bold",
          config.gradientClass
        )}
      >
        {config.name} ({config.dateStart}
        {config.dateStrikethrough && (
          <span className="line-through">{config.dateStrikethrough}</span>
        )}
        {config.dateEnd})
      </CollapsibleTrigger>
      <CollapsibleContent className="py-4">
        <div className="flex flex-wrap gap-4">
          {sections.map(({ id, label }) => (
            <Button key={id} variant="primary" size="sm" onClick={() => toggleSection(id)}>
              <span className="material-symbols-outlined">add</span>
              {label}
            </Button>
          ))}
        </div>

        <BonusComponent
          isOpen={openSections.bonus ?? false}
          setIsOpen={(isOpen) => setOpenSections((prev) => ({ ...prev, bonus: isOpen }))}
        />
        <EventBadge
          isOpen={openSections.eventBadge ?? false}
          setIsOpen={(isOpen) => setOpenSections((prev) => ({ ...prev, eventBadge: isOpen }))}
          times={times}
        />
        <EventRanking
          isOpen={openSections.eventRanking ?? false}
          setIsOpen={(isOpen) => setOpenSections((prev) => ({ ...prev, eventRanking: isOpen }))}
          times={times}
        />
        <StampMission
          isOpen={openSections.stampMission ?? false}
          setIsOpen={(isOpen) => setOpenSections((prev) => ({ ...prev, stampMission: isOpen }))}
          times={times}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

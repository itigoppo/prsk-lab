"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ComponentType, useState } from "react"
import { Compensation } from "./compensation"
import { LiveMission } from "./live-mission"
import { Login } from "./login"
import { PremiumGift } from "./premium-gift"

type SectionProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

type Section = {
  component: ComponentType<SectionProps>
  id: string
  label: string
}

const sections: Section[] = [
  { component: Compensation, id: "compensation", label: "補填" },
  { component: PremiumGift, id: "premiumGift", label: "プレミアムプレゼントガチャ" },
  { component: Login, id: "login", label: "ログインキャンペーン" },
  { component: LiveMission, id: "liveMission", label: "ライブミッション" },
]

export function EntirePeriod() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="border-b-2 border-slate-500 bg-emerald-50 px-6 py-4 font-bold">
        全期間 (9/30〜10/31)
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

        {sections.map(({ component: Component, id }) => (
          <Component
            key={id}
            isOpen={openSections[id] ?? false}
            setIsOpen={(isOpen) => setOpenSections((prev) => ({ ...prev, [id]: isOpen }))}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

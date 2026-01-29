"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Fragment, ReactNode, useState } from "react"
import { CAMPAIGN_PERIOD } from "../../../_constants/config"
import { EventBadge } from "./event-badge"
import { EventRanking } from "./event-ranking"
import { FesBonus } from "./fes-bonus"
import { GiftGacha } from "./gift-gacha"
import { Login } from "./login"
import { StampMission } from "./stamp-mission"

type SectionProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

type Section = {
  id: string
  label: string
  render: (props: SectionProps) => ReactNode
}

const sections: Section[] = [
  { id: "login", label: "ログインキャンペーン", render: (props) => <Login {...props} /> },
  {
    id: "stampMission",
    label: "スタンプミッション",
    render: (props) => <StampMission {...props} />,
  },
  { id: "eventBadge", label: "イベント交換所", render: (props) => <EventBadge {...props} /> },
  {
    id: "eventRanking",
    label: "イベントランキング",
    render: (props) => <EventRanking {...props} />,
  },
  { id: "fesBonus", label: "ブルフェスガチャボーナス", render: (props) => <FesBonus {...props} /> },
  {
    id: "premiumGift",
    label: "プレミアムプレゼントガチャ",
    render: (props) => <GiftGacha type="premium" {...props} />,
  },
  {
    id: "heartfeltGift",
    label: "ハートフルギフトガチャ",
    render: (props) => <GiftGacha type="heartfelt" {...props} />,
  },
]

export function EntirePeriod() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Collapsible defaultOpen={true}>
      <CollapsibleTrigger className="border-b-2 border-slate-500 bg-emerald-50 px-6 py-4 font-bold">
        全期間 ({CAMPAIGN_PERIOD})
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

        {sections.map(({ id, render }) => (
          <Fragment key={id}>
            {render({
              isOpen: openSections[id] ?? false,
              setIsOpen: (isOpen) => setOpenSections((prev) => ({ ...prev, [id]: isOpen })),
            })}
          </Fragment>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

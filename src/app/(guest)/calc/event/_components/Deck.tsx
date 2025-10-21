import { Button, ButtonProps } from "@/components/ui/Button"
import { ButtonGroup } from "@/components/ui/ButtonGroup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"

interface DeckProps {
  buttonVariant: ButtonProps["variant"]
  description: string
  onChangeBonusCharacterIndex: (index: number) => void
  onChangeBonusTypeIndex: (index: number) => void
  onChangeMasterRankIndex: (index: number) => void
  onChangeRareIndex: (index: number) => void
  selectedBonusCharacterIndex: number
  selectedBonusTypeIndex: number
  selectedMasterRankIndex: number
  selectedRareIndex: number
  title: string
}

export function Deck({
  buttonVariant,
  description,
  onChangeBonusCharacterIndex,
  onChangeBonusTypeIndex,
  onChangeMasterRankIndex,
  onChangeRareIndex,
  selectedBonusCharacterIndex,
  selectedBonusTypeIndex,
  selectedMasterRankIndex,
  selectedRareIndex,
  title,
}: DeckProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-lg font-bold text-blue-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-medium">レアリティ</div>
          <ButtonGroup
            size="sm"
            outline
            activeIndex={selectedRareIndex}
            onChange={onChangeRareIndex}
            variant={buttonVariant}
          >
            {["PU★4", "既存★4", "BD", "★3", "★2", "★1"].map((item, index) => (
              <Button key={`rare-${index}`}>{item}</Button>
            ))}
          </ButtonGroup>

          <div className="text-sm font-medium">マスラン</div>
          <ButtonGroup
            size="sm"
            outline
            activeIndex={selectedMasterRankIndex}
            onChange={onChangeMasterRankIndex}
            variant={buttonVariant}
          >
            {["0", "1", "2", "3", "4", "5"].map((item, index) => (
              <Button key={`master-rank-${index}`}>{item}</Button>
            ))}
          </ButtonGroup>

          <div className="text-sm font-medium">ボーナスタイプ</div>
          <ButtonGroup
            size="sm"
            outline
            activeIndex={selectedBonusTypeIndex}
            onChange={onChangeBonusTypeIndex}
            variant={buttonVariant}
          >
            {["一致", "不一致"].map((item, index) => (
              <Button key={`bonus-type-${index}`}>{item}</Button>
            ))}
          </ButtonGroup>

          <div className="text-sm font-medium">ボーナスキャラクター</div>
          <ButtonGroup
            size="sm"
            outline
            activeIndex={selectedBonusCharacterIndex}
            onChange={onChangeBonusCharacterIndex}
            variant={buttonVariant}
          >
            {["一致", "無印バチャシン", "不一致"].map((item, index) => (
              <Button key={`bonus-character-${index}`}>{item}</Button>
            ))}
          </ButtonGroup>
        </div>
      </CardContent>
    </Card>
  )
}

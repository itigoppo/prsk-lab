import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import React from "react"
import {
  BOUNS_CHARACTER,
  BOUNS_CHARACTER_VS,
  BOUNS_TYPE,
  MASTER_RANK_RATE,
  PU_CHARACTER,
  RANK_NAMES,
} from "./constants"

export function Bonus({ totalBonus }: { totalBonus: number }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">合計</CardTitle>
          <CardDescription className="text-lg font-bold text-blue-600">
            {totalBonus} %
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>25/09/01時点での計算式は以下の通りです</div>
          <dl className="space-y-2">
            <dt>ボーナスタイプ一致</dt>
            <dd className="pl-2">+ {BOUNS_TYPE} %</dd>
            <dt>ボーナスキャラクター一致</dt>
            <dd className="pl-2">+ {BOUNS_CHARACTER} %</dd>
            <dt>無印バチャシン使用時</dt>
            <dd className="pl-2">+ {BOUNS_CHARACTER_VS} %</dd>
            <dt>PUキャラ使用時</dt>
            <dd className="pl-2">+ {PU_CHARACTER} %</dd>
            <dt>マスランボーナス</dt>
            <dd className="pl-2">
              <dl className="grid grid-cols-[50px_1fr] gap-y-2">
                {["star4", "bd", "star3", "star2", "star1"].map((rank) => (
                  <React.Fragment key={rank}>
                    <dt>{RANK_NAMES[rank]}</dt>
                    <dd>+ {MASTER_RANK_RATE[rank].join(" / ")} %</dd>
                  </React.Fragment>
                ))}
              </dl>
            </dd>
          </dl>
        </CardContent>
      </Card>
    </>
  )
}

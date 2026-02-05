"use client"

import { ErrorState } from "@/components/common/error-state"
import { LoadingState } from "@/components/common/loading-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGetApiUnits } from "@/lib/api/generated/units/units"
import { useMemo } from "react"
import { FurnitureInventory } from "./furniture-inventory"
import { ReactionChecklist } from "./reaction-checklist"

export function MySekai() {
  const { data, error, isLoading } = useGetApiUnits()
  const units = useMemo(() => data?.data?.units ?? [], [data?.data?.units])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState title="ユニット情報の取得に失敗しました" onRetry={() => {}} retrying={false} />
    )
  }

  return (
    <>
      <Tabs defaultValue="furnitures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="furnitures">家具一覧</TabsTrigger>
          {units
            .filter((unit) => unit.code !== "vs")
            .map((unit) => (
              <TabsTrigger key={unit.code} value={unit.code}>
                {unit.short}
              </TabsTrigger>
            ))}
        </TabsList>
        <TabsContent value="furnitures">
          <FurnitureInventory />
        </TabsContent>
        {units
          .filter((unit) => unit.code !== "vs")
          .map((unit) => (
            <TabsContent key={unit.code} value={unit.code}>
              <ReactionChecklist unit={unit} />
            </TabsContent>
          ))}
      </Tabs>
    </>
  )
}

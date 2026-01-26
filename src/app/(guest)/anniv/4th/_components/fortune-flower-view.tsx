import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import { FortuneFlowerContextProvider } from "../_contexts/fortune-flower-context"
import { FortuneFlowerAcquisition } from "./acquisition/fortune-flower-acquisition"
import { FortuneFlowerResult } from "./fortune-flower-result"
import { FortuneFlowerReward } from "./reward/fortune-flower-reward"

export function FortuneFlowerView() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FortuneFlowerContextProvider>
        <Card>
          <CardContent className="space-y-4">
            <FortuneFlowerReward />
            <FortuneFlowerAcquisition />
            <FortuneFlowerResult />
          </CardContent>
        </Card>
      </FortuneFlowerContextProvider>
    </Suspense>
  )
}

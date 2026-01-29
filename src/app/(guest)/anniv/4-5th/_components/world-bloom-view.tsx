import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import { WorldBloomContextProvider } from "../_contexts/world-bloom-context"
import { WorldBloomAcquisition } from "./acquisition/world-bloom-acquisition"
import { WorldBloomReward } from "./reward/world-bloom-reward"
import { WorldBloomResult } from "./world-bloom-result"

export function WorldBloomView() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorldBloomContextProvider>
        <Card>
          <CardContent className="space-y-4">
            <WorldBloomReward />
            <WorldBloomAcquisition />
            <WorldBloomResult />
          </CardContent>
        </Card>
      </WorldBloomContextProvider>
    </Suspense>
  )
}

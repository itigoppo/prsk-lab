"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useWorldBloomContext } from "../../../_contexts/world-bloom-context"
import { RequiredBadge } from "../../required-badge"

interface EventBadgeProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function EventBadge({ isOpen, setIsOpen }: EventBadgeProps) {
  const { dispatch, state } = useWorldBloomContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div>
      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>イベント交換所 / L/n箱志歩バナー (03/30〜04/06)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>手に入れたいアイテムの交換回数にチェック</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="border-l-8 border-red-300 pl-2 font-bold">ワールドピース</div>
                <RequiredBadge
                  required={{
                    wild: 10,
                  }}
                />
              </div>
              <RadioGroup
                value={state.acquisition.numberOfEventBadge.toString()}
                onValueChange={(value) => dispatch.acquisition.setNumberOfEventBadge(Number(value))}
                className="grid grid-cols-3 gap-2"
                variant="primary"
              >
                {Array(15 + 1)
                  .fill(0)
                  .map((__val, index) => (
                    <RadioGroupItem key={index} value={index.toString()}>
                      {index}回交換
                    </RadioGroupItem>
                  ))}
              </RadioGroup>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {state.acquisition.numberOfEventBadge > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-x-1 border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
            <div>
              イベント交換所 / L/n箱志歩バナー(
              <span className="text-pink-600">03/30〜04/06</span>)
            </div>
          </div>
          {[
            {
              label: "ワールドピース",
              numberOfEventBadge: state.acquisition.numberOfEventBadge,
            },
          ]
            .filter(({ numberOfEventBadge }) => numberOfEventBadge !== 0)
            .map(({ label, numberOfEventBadge }, index) => (
              <div className="flex items-center gap-1" key={index}>
                <span className="material-symbols-outlined text-lime-500">stars</span>
                {label} ({numberOfEventBadge}回交換)
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

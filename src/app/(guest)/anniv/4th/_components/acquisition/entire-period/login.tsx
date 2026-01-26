"use client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { loginSchedule } from "../../../_constants/login-schedule"
import { useFortuneFlowerContext } from "../../../_contexts/fortune-flower-context"
import { RequiredBadge } from "../../required-badge"

interface LoginProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Login({ isOpen, setIsOpen }: LoginProps) {
  const { dispatch, state } = useFortuneFlowerContext()

  const handleClose = () => {
    setIsOpen(false)
  }

  const [isAllLogin, setIsAllLogin] = useState<boolean>(false)

  useEffect(() => {
    const checkedDays = loginSchedule.filter((item) =>
      state.acquisition.loginDays.includes(item.day)
    )
    setIsAllLogin(checkedDays.length === loginSchedule.length)
  }, [state.acquisition.loginDays])

  return (
    <div className="mt-4 space-y-2">
      <div className="border-l-8 border-cyan-700 pl-2 font-bold text-cyan-700">
        ログインキャンペーン(<span className="text-pink-600">〜10/31</span>)
      </div>

      <Dialog isOpen={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader onOpenChange={handleClose}>
            <DialogTitle>ログインキャンペーン(〜10/31)</DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-2">
            <Alert variant="info">
              <AlertDescription>ログインした日をチェック</AlertDescription>
            </Alert>

            <div
              onClick={() => {
                setIsAllLogin((state) => !state)
                if (isAllLogin) {
                  dispatch.acquisition.setLoginDays([])
                } else {
                  dispatch.acquisition.setLoginDays(loginSchedule.map((item) => item.day))
                }
              }}
              className="flex items-center gap-3 hover:cursor-pointer"
            >
              <Checkbox checked={isAllLogin} variant="primary" />
              <div className="font-bold text-pink-600">すべての日程でログイン</div>
              <RequiredBadge
                required={{
                  blue: loginSchedule.reduce(function (acc, obj) {
                    return acc + obj.blue
                  }, 0),
                  green: loginSchedule.reduce(function (acc, obj) {
                    return acc + obj.green
                  }, 0),
                  orange: loginSchedule.reduce(function (acc, obj) {
                    return acc + obj.orange
                  }, 0),
                  purple: loginSchedule.reduce(function (acc, obj) {
                    return acc + obj.purple
                  }, 0),
                  red: loginSchedule.reduce(function (acc, obj) {
                    return acc + obj.red
                  }, 0),
                  white: loginSchedule.reduce(function (acc, obj) {
                    return acc + obj.white
                  }, 0),
                  wild: 0,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-500 pt-3">
              {loginSchedule.map((schedule, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (state.acquisition.loginDays.includes(schedule.day)) {
                      dispatch.acquisition.setLoginDays(
                        state.acquisition.loginDays.filter((loginDay) => loginDay !== schedule.day)
                      )
                      setIsAllLogin(false)
                    } else {
                      const uniqueLoginDays = [
                        ...new Set(state.acquisition.loginDays.concat([schedule.day])),
                      ]
                      dispatch.acquisition.setLoginDays(uniqueLoginDays)

                      const checkedDays = loginSchedule.filter((item) =>
                        uniqueLoginDays.includes(item.day)
                      )
                      setIsAllLogin(checkedDays.length === loginSchedule.length)
                    }
                  }}
                  className="flex items-center gap-3 hover:cursor-pointer"
                >
                  <Checkbox
                    checked={state.acquisition.loginDays.includes(schedule.day)}
                    variant="primary"
                  />
                  <div>{schedule.day}</div>
                  <RequiredBadge
                    required={{
                      blue: schedule.blue,
                      green: schedule.green,
                      orange: schedule.orange,
                      purple: schedule.purple,
                      red: schedule.red,
                      white: schedule.white,
                      wild: 0,
                    }}
                  />
                </div>
              ))}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button outline onClick={handleClose}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="text-sm">
        {loginSchedule.filter((schedule) => state.acquisition.loginDays.includes(schedule.day))
          .length === 0 && (
          <Alert variant="destructive">
            <AlertDescription>ログイン1日もしてないことになってるYo!!!</AlertDescription>
          </Alert>
        )}

        {loginSchedule.filter((schedule) => state.acquisition.loginDays.includes(schedule.day))
          .length === loginSchedule.length ? (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-lime-500">stars</span>
            すべての日程でログイン
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {loginSchedule
              .filter((schedule) => state.acquisition.loginDays.includes(schedule.day))
              .map((schedule, index) => (
                <div className="flex items-center gap-1" key={index}>
                  <span className="material-symbols-outlined text-lime-500">stars</span>
                  {schedule.day}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

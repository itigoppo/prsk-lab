"use client"

import { anton } from "@/components/fonts/anton"
import { montserrat } from "@/components/fonts/montserrat"
import { IconClose, IconMenu } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar/index"
import { Button } from "@/components/ui/Button"
import { useCurrentUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils/common"
import { getUserInitials } from "@/lib/utils/user"
import { UserRole } from "@prisma/client"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LogoutModal } from "../LogoutModal"
import { mainNavigationItems } from "./navigationItems"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(true)
  }, [])

  const closeLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(false)
  }, [])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow

    if (isOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  const { currentUser } = useCurrentUser()

  const filteredNavigationItems = useMemo(
    () =>
      mainNavigationItems.filter((item) => {
        // 管理者専用ページの場合は管理者のみ表示
        if (item.isAdmin && currentUser?.role !== UserRole.Admin) {
          return false
        }
        // 認証が必要なページの場合は未ログインの場合は表示しない
        if (item.isProtected && !currentUser) {
          return false
        }
        return true
      }),
    [currentUser]
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 flex size-10 items-center justify-center rounded-full bg-slate-300 text-slate-600 shadow-md backdrop-blur-md transition hover:scale-105 hover:bg-slate-600 hover:text-lime-400 lg:top-8 lg:right-8 lg:size-16"
        onClick={toggleMenu}
      >
        {isOpen ? (
          <IconClose className="size-6 lg:size-12" />
        ) : (
          <IconMenu className="size-6 lg:size-12" />
        )}
        <span className="sr-only">メニューを開く</span>
      </Button>
      {isOpen && (
        <div className="fixed top-0 left-0 z-40 flex h-screen w-full justify-between bg-slate-800/50 backdrop-blur-sm">
          <div className="space-y-2 text-teal-400/30 [writing-mode:vertical-rl] md:[writing-mode:horizontal-tb]">
            <div className={cn(anton.className, "text-4xl tracking-wide md:text-6xl lg:text-8xl")}>
              Project SEKAI
            </div>
            <div
              className={cn(
                anton.className,
                "text-6xl tracking-wide md:text-[5.5rem] lg:text-[10rem]"
              )}
            >
              COLORFUL STAGE!
            </div>
            <div className={cn(anton.className, "text-4xl tracking-wide md:text-6xl lg:text-8xl")}>
              feat. HATSUNE MIKU
            </div>
          </div>
          <div className="h-full w-1/2 overflow-y-auto bg-slate-200 py-10 pr-5 pl-8 md:w-60 lg:w-80 lg:py-14 lg:pr-8 lg:pl-14">
            <nav>
              <ul className={cn(montserrat.className, "space-y-2 tracking-widest")}>
                {filteredNavigationItems.map((item, index) => {
                  return (
                    <li key={`main-nav-${index}`}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className="space-y-1 text-slate-600 hover:text-lime-400"
                      >
                        <div className="text-lg font-bold uppercase md:text-sm lg:text-2xl">
                          {item.title}
                        </div>
                        <div className="text-xs md:text-[10px] lg:text-sm">{item.description}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          <div className="fixed top-[calc(100dvh-3.5rem)] right-4 flex w-full justify-end lg:top-[calc(100dvh-4.5rem)] lg:right-8">
            <Avatar>
              {currentUser?.avatarUrl ? (
                <Button size="icon" onClick={openLogoutModal}>
                  <AvatarImage
                    src={currentUser.avatarUrl}
                    alt={currentUser.name ?? ""}
                    width={40}
                    height={40}
                  />
                </Button>
              ) : (
                <AvatarFallback className="border-1 border-slate-600 bg-lime-100">
                  {getUserInitials({ name: currentUser?.name ?? "" })}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>
      )}

      {isLogoutModalOpen && currentUser && (
        <LogoutModal isOpen={isLogoutModalOpen} onClose={closeLogoutModal} />
      )}
    </>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

interface UseUnsavedChangesReturn {
  /** ダイアログの props */
  dialogProps: {
    isOpen: boolean
    onConfirm: () => void
    onOpenChange: (open: boolean) => void
  }
  /** プログラム的なナビゲーション用（キャンセルボタン等）。dirty なら確認ダイアログを表示 */
  handleNavigation: (href: string) => void
}

export function useUnsavedChanges(isDirty: boolean): UseUnsavedChangesReturn {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const pendingHref = useRef<string | null>(null)
  const skipGuardRef = useRef(false)

  // ブラウザリロード・タブ閉じ
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // ブラウザバック・フォワード: history にガードエントリを挿入して検知
  useEffect(() => {
    if (!isDirty) return

    const currentUrl = location.pathname + location.search

    // ガードエントリを挿入（ブラウザバックで最初にこれが pop される）
    history.pushState({ __unsavedGuard: true }, "", currentUrl)

    const handlePopState = () => {
      if (skipGuardRef.current) {
        skipGuardRef.current = false
        return
      }
      // ガードが pop された → 再挿入してダイアログ表示
      history.pushState({ __unsavedGuard: true }, "", currentUrl)
      pendingHref.current = null
      setShowDialog(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      // ガードエントリを除去（replaceState は同期的で popstate を発火しない）
      if (history.state?.__unsavedGuard) {
        history.replaceState(null, "", currentUrl)
      }
    }
  }, [isDirty])

  // <a> タグのクリックを一括インターセプト（Next.js <Link> を含む）
  useEffect(() => {
    if (!isDirty) return

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return
      // 外部リンク・ハッシュリンクはスキップ
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return
      // 同一ページはスキップ
      if (href === location.pathname) return

      e.preventDefault()
      e.stopPropagation()
      pendingHref.current = href
      setShowDialog(true)
    }

    // capture フェーズで Next.js の Link ハンドラーより先にキャッチ
    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [isDirty])

  // プログラム的なナビゲーション用（キャンセル/戻るボタン）
  const handleNavigation = useCallback(
    (href: string) => {
      if (isDirty) {
        pendingHref.current = href
        setShowDialog(true)
      } else {
        router.push(href)
      }
    },
    [isDirty, router]
  )

  const confirmLeave = useCallback(() => {
    setShowDialog(false)
    if (pendingHref.current) {
      // リンククリック or プログラム的ナビゲーション
      // ガードエントリを通常のエントリに置換してから遷移
      if (history.state?.__unsavedGuard) {
        history.replaceState(null, "", location.pathname + location.search)
      }
      router.push(pendingHref.current)
      pendingHref.current = null
    } else {
      // ブラウザバック: ガード + 現在ページの 2 エントリ分戻る
      skipGuardRef.current = true
      history.go(-2)
    }
  }, [router])

  const cancelLeave = useCallback(() => {
    setShowDialog(false)
    pendingHref.current = null
  }, [])

  return {
    dialogProps: {
      isOpen: showDialog,
      onConfirm: confirmLeave,
      onOpenChange: (open: boolean) => {
        if (!open) cancelLeave()
      },
    },
    handleNavigation,
  }
}

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function UnsavedChangesDialog({
  isOpen,
  onConfirm,
  onOpenChange,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onOpenChange={onOpenChange}>
          <DialogTitle>未保存の変更があります</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            保存されていない変更があります。このページを離れると変更内容は失われます。
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            このページに留まる
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            変更を破棄して移動
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { Logo } from "./_components/Logo"
import { Navigation } from "./_components/Navigation"
import { UserProvider } from "@/contexts/UserContext"
import { cn } from "@/lib/utils/common"
import { ReactQueryProvider } from "@/providers/ReactQueryProvider"
import { AuthSessionProvider } from "@/providers/SessionProvider"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Inter, M_PLUS_2 } from "next/font/google"
import Link from "next/link"
import type { ReactNode } from "react"
import { Toaster } from "react-hot-toast"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] })
const mPlus2 = M_PLUS_2({ subsets: ["latin"], weight: ["400", "700"] })
const geist = Geist({ subsets: ["latin"], weight: ["400", "700"] })
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "700"] })

export const metadata: Metadata = {
  description: "プロセカ関係でなんかやったものをおいておくモノオキ",
  title: "PrskLab",
}

export const viewport: Viewport = {
  initialScale: 1,
  viewportFit: "cover",
  width: "device-width",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={cn(mPlus2.className, geist.className, geistMono.className, inter.className)}>
        <ReactQueryProvider>
          <AuthSessionProvider>
            <Toaster />
            <UserProvider>
              <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200">
                <header>
                  <Link href="/" className="inline-block">
                    <Logo />
                  </Link>

                  <Navigation />
                </header>
                <main className="container mx-auto px-4 py-6">{children}</main>
              </div>
            </UserProvider>
          </AuthSessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}

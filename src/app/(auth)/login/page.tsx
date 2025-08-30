import { LoginView } from "@/components/pages/login/LoginView"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginView />
    </Suspense>
  )
}

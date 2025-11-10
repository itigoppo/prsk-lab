import { Suspense } from "react"
import { LoginView } from "./_components/login-view"

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginView />
    </Suspense>
  )
}

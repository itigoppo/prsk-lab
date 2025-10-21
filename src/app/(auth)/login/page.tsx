import { Suspense } from "react"
import { LoginView } from "./_components/LoginView"

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginView />
    </Suspense>
  )
}

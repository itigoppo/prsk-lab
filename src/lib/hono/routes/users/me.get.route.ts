import { getCurrentUser } from "@/lib/handlers/users/get-current-user.handler"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import { Hono } from "hono"

const app = new Hono()

app.use("*", verifyNextAuthSession)
app.get("/", getCurrentUser)

export default app

import { getSetting } from "@/lib/handlers/users/get-setting.handler"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import { Hono } from "hono"

const app = new Hono()

app.use("*", verifyNextAuthSession)
app.get("/", getSetting)

export default app

import { createSetting } from "@/lib/handlers/users/create-setting.handler"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import { Hono } from "hono"

const app = new Hono()

app.use("*", verifyNextAuthSession)
app.post("/", createSetting)

export default app

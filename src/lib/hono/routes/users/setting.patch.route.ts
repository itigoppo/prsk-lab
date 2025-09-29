import { updateSetting } from "@/lib/handlers/users/update-setting.handler"
import { verifyNextAuthSession } from "@/lib/middleware/verify-nextauth-session"
import { Hono } from "hono"

const app = new Hono()

app.use("*", verifyNextAuthSession)
app.patch("/", updateSetting)

export default app

import { createUser } from "@/lib/handlers/users/create-user.handler"
import { verifyDiscordToken } from "@/lib/middleware/verify-discord-token"
import { Hono } from "hono"

const app = new Hono()

app.use("*", verifyDiscordToken())
app.post("/", createUser)

export default app

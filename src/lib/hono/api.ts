import { Hono } from "hono"
import getCharactersRoutes from "./routes/characters/get.route"
import meGetRoutes from "./routes/users/me.get.route"
import postUserRoutes from "./routes/users/post.route"
import getSettingRoutes from "./routes/users/setting.get.route"
import patchSettingRoutes from "./routes/users/setting.patch.route"
import postSettingRoutes from "./routes/users/setting.post.route"

const app = new Hono()

// /api/users
app.route("/api/users/me", meGetRoutes)

app.route("/api/users/settings", getSettingRoutes)
app.route("/api/users/settings", postSettingRoutes)
app.route("/api/users/settings", patchSettingRoutes)

app.route("/api/users", postUserRoutes)

// /api/characters
app.route("/api/characters", getCharactersRoutes)

export default app

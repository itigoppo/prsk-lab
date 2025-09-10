import { getCharacters } from "@/lib/handlers/characters/get-characters.handler"
import { Hono } from "hono"

const app = new Hono()

app.get("/", getCharacters)

export default app

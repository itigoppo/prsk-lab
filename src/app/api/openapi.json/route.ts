import { openAPIApp } from "@/lib/hono/openapi"
import { handle } from "hono/vercel"

export const GET = handle(openAPIApp)
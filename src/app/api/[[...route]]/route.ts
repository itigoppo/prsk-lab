import { openAPIApp } from "@/lib/hono/openapi"
import { handle } from "hono/vercel"

const handler = handle(openAPIApp)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler

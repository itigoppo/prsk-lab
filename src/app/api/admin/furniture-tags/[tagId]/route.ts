import { openAPIApp } from "@/lib/hono/openapi"

export const GET = (req: Request) => {
  return openAPIApp.fetch(req)
}

export const PATCH = (req: Request) => {
  return openAPIApp.fetch(req)
}

export const DELETE = (req: Request) => {
  return openAPIApp.fetch(req)
}

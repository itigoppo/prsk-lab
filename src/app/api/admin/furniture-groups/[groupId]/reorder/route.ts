import { openAPIApp } from "@/lib/hono/openapi"

export const PATCH = (req: Request) => {
  return openAPIApp.fetch(req)
}

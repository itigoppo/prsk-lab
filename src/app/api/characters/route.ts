import { openAPIApp } from "@/lib/hono/openapi"

export const GET = (req: Request) => {
  return openAPIApp.fetch(req)
}

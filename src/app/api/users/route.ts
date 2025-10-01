import { openAPIApp } from "@/lib/hono/openapi"

export const POST = (req: Request) => {
  return openAPIApp.fetch(req)
}

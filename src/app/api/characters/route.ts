import app from "@/lib/hono/api"

export const GET = (req: Request) => {
  return app.fetch(req)
}

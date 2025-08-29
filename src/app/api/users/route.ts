import app from "@/lib/hono/api"

export const POST = (req: Request) => {
  return app.fetch(req)
}

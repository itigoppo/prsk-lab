import app from "@/lib/hono/api"

export const POST = (req: Request) => {
  return app.fetch(req)
}

export const GET = (req: Request) => {
  return app.fetch(req)
}

export const PATCH = (req: Request) => {
  return app.fetch(req)
}

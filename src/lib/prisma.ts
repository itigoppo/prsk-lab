import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"
import pg from "pg"

const isLocal = process.env.NODE_ENV !== "production"

const createPrismaClient = () => {
  if (isLocal) {
    const connectionString = process.env["DIRECT_URL"] || process.env["DATABASE_URL"]
    const pool = new pg.Pool({ connectionString })

    pool.on("connect", (client) => {
      const originalQuery = client.query.bind(client) as typeof client.query
      client.query = ((...args: unknown[]) => {
        const start = Date.now()
        const result = originalQuery(...(args as Parameters<typeof originalQuery>))
        Promise.resolve(result).then(() => {
          const duration = Date.now() - start
          /* eslint-disable-next-line no-console */
          console.log("[Prisma Query]", args[0])
          /* eslint-disable-next-line no-console */
          console.log(`[Duration] ${duration}ms`)
        })
        return result
      }) as typeof client.query
    })

    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  }
  return new PrismaClient({
    accelerateUrl: process.env["DATABASE_URL"],
    log: ["error"],
  })
}

const basePrisma = createPrismaClient()
const prisma = basePrisma.$extends(withAccelerate())

type GlobalPrisma = {
  prisma?: typeof prisma
}

const globalForPrisma = global as unknown as GlobalPrisma

if (isLocal) globalForPrisma.prisma = prisma

export { prisma }

import { Prisma, PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const isLocal = process.env.NODE_ENV !== "production"

const basePrisma = new PrismaClient({
  log: isLocal ? ["query", "info", "warn", "error"] : ["error"],
})

if (isLocal) {
  basePrisma.$on("query", (e: Prisma.QueryEvent) => {
    /* eslint-disable-next-line no-console */
    console.log("[Prisma Query]", e.query)
    /* eslint-disable-next-line no-console */
    console.log("[Prisma Params]", e.params)
    /* eslint-disable-next-line no-console */
    console.log(`[Duration] ${e.duration}ms`)
  })
}

const prisma = basePrisma.$extends(withAccelerate())

type GlobalPrisma = {
  prisma?: typeof prisma
}

const globalForPrisma = global as unknown as GlobalPrisma

if (isLocal) globalForPrisma.prisma = prisma

export { prisma }

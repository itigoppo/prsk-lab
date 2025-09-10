import { PrismaClient } from "@prisma/client"
import { runInit } from "./lib"

export const prismaForSeed = new PrismaClient()

runInit(prismaForSeed)
  .catch(async (e) => {
    console.error(e)
    await prismaForSeed.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prismaForSeed.$disconnect()
  })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import pg from "pg"

import { runInit } from "./lib"

dotenv.config()

const connectionString = process.env["DIRECT_URL"] || process.env["DATABASE_URL"]
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
export const prismaForSeed = new PrismaClient({ adapter })

runInit(prismaForSeed)
  .catch(async (e) => {
    console.error(e)
    await prismaForSeed.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prismaForSeed.$disconnect()
    await pool.end()
  })

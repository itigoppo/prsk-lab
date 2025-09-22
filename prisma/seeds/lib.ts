import { PrismaClient } from "@prisma/client"
import chalk from "chalk"
import readline from "readline"
import { seedCharacters } from "./characters"
import { seedUnits } from "./units"

export const runInit = async (prisma: PrismaClient) => {
  console.log("🔐 Prisma Seed Execution")
  console.log(`📦 Connected Database: ${formatDatabaseInfo()}`)

  const confirmed = await askConfirmation("⚠️ Do you really want to run seed on this database?")
  if (!confirmed) {
    console.log("❌ Seed aborted by user.")
    process.exit(0)
  }

  console.log("🌱 Seeding data...")
  await seed(prisma)
  console.log("✅ Seed completed!")
}

const askConfirmation = async (message: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close()

      const normalized = answer.trim().toLowerCase()

      if (normalized === "y" || normalized === "yes") {
        resolve(true)
      } else {
        // default: no
        resolve(false)
      }
    })
  })
}

const formatDatabaseInfo = (): string => {
  try {
    const url = new URL(process.env.DATABASE_URL!)

    const dbType = url.protocol.replace(":", "")
    const host = url.hostname
    const port = url.port || "5432"
    const database = url.pathname.replace("/", "")
    const schema = url.searchParams.get("schema") || "public"

    return `Datasource ${chalk.cyanBright('"db"')}: ${chalk.greenBright(dbType.toUpperCase())} database ${chalk.bold(`"${database}"`)}, schema ${chalk.yellowBright(`"${schema}"`)} at ${chalk.redBright(`"${host}:${port}"`)}`
  } catch (error) {
    return chalk.redBright(`❌ Failed to parse DATABASE_URL: ${error}`)
  }
}

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, ms)
  })
}

const seed = async (prisma: PrismaClient) => {
  await sleep(100)

  await seedUnits(prisma)
  await seedCharacters(prisma)
}

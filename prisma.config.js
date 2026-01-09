import dotenv from "dotenv"
import path from "node:path"
import { defineConfig } from "prisma/config"

dotenv.config()

export default defineConfig({
  seed: {
    path: path.join("prisma", "seeds", "index.ts"),
  },
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("db", "migrations"),
  },
  views: {
    path: path.join("db", "views"),
  },
  typedSql: {
    path: path.join("db", "queries"),
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    directUrl: process.env["DIRECT_URL"],
  },
})

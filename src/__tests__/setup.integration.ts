import { prisma } from "@/lib/prisma"
import { beforeEach } from "vitest"

beforeEach(async () => {
  // 統合テスト用に、テスト開始時にDBの状態をクリーンに保つ
  // publicスキーマ内のすべてのテーブル名を動的に取得（手動メンテ不要）
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ")

  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  }
})

import type { User } from "@prisma/client"

/**
 * Discord API レスポンスのモック型
 */
export type MockDiscordUser = {
  avatar: string | null
  discriminator: string
  email: string | null
  global_name: string | null
  id: string
  username: string
}

/**
 * Discord API レスポンスのモックを作成
 */
export const createMockDiscordUser = (
  overrides: Partial<MockDiscordUser> = {}
): MockDiscordUser => ({
  avatar: "avatar_hash",
  discriminator: "0",
  email: "test@example.com",
  global_name: "Test User",
  id: "discord-123",
  username: "testuser",
  ...overrides,
})

/**
 * Prisma User レコードのモックを作成
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  avatarUrl: null,
  createdAt: new Date("2024-01-01"),
  discordId: "discord-123",
  email: "test@example.com",
  id: "user-uuid-123",
  lastLoginAt: new Date("2024-01-01"),
  name: "Test User",
  role: "Viewer",
  updatedAt: new Date("2024-01-01"),
  ...overrides,
})

/**
 * Character のモック型
 */
export type MockCharacter = {
  avatarUrl: string
  bgColor: string
  code: string
  color: string
  id: string
  name: string
  short: string
  unit: {
    bgColor: string
    code: string
    color: string
    id: string
    name: string
  } | null
  unitId: string | null
}

/**
 * Character レコードのモックを作成
 */
export const createMockCharacter = (overrides: Partial<MockCharacter> = {}): MockCharacter => ({
  avatarUrl: "https://example.com/char.png",
  bgColor: "#FF0000",
  code: "char1",
  color: "#FF0000",
  id: "char-uuid-1",
  name: "キャラクター1",
  short: "C1",
  unit: null,
  unitId: null,
  ...overrides,
})

/**
 * Unit のモックを作成
 */
export const createMockUnit = (overrides: Partial<NonNullable<MockCharacter["unit"]>> = {}) => ({
  bgColor: "#0000FF",
  code: "unit1",
  color: "#0000FF",
  id: "unit-uuid-1",
  name: "ユニット1",
  ...overrides,
})

/**
 * バーチャルシンガーのユニットを作成
 */
export const createVirtualSingerUnit = () =>
  createMockUnit({
    bgColor: "#FFFF00",
    code: "vs",
    color: "#FFFF00",
    id: "unit-uuid-vs",
    name: "バーチャル・シンガー",
  })

/**
 * Discord User と Prisma User の avatarUrl を生成
 */
export const generateAvatarUrl = (discordId: string, avatarHash: string) =>
  `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`

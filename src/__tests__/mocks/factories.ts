import { prisma } from "@/lib/prisma"
import type {
  Character,
  Furniture,
  FurnitureGroup,
  FurnitureReaction,
  FurnitureReactionCharacter,
  FurnitureTag,
  Setting,
  Unit,
  User,
  UserFurniture,
  UserReactionCheck,
} from "@prisma/client"

/**
 * Discord API レスポンスのモックを作成
 */
export const createMockDiscordUser = (
  overrides: Partial<{
    avatar: string | null
    discriminator: string
    email: string | null
    global_name: string | null
    id: string
    username: string
  }> = {}
) => ({
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
 * Character レコードのモックを作成
 */
export const createMockCharacter = (overrides: Partial<Character> = {}) => ({
  avatarUrl: "https://example.com/char.png",
  bgColor: "#FF0000",
  code: "char1",
  color: "#FF0000",
  id: "char-uuid-1",
  name: "キャラクター1",
  short: "C1",
  unitId: null,
  ...overrides,
})

/**
 * Unit のモックを作成
 */
export const createMockUnit = (overrides: Partial<Unit> = {}) => ({
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

/**
 * 以下の insert系関数は E2E (Integration) テスト用に実際にDBへレコードを作成します
 */

export const insertMockUser = async (overrides: Partial<User> = {}): Promise<User> => {
  const data = createMockUser(overrides)
  return await prisma.user.create({ data })
}

export const insertMockUnit = async (overrides: Partial<Unit> = {}): Promise<Unit> => {
  const data = createMockUnit(overrides)
  return await prisma.unit.create({
    data: {
      bgColor: data.bgColor,
      code: data.code,
      color: data.color,
      createdAt: new Date(),
      id: data.id,
      name: data.name,
      priority: 0,
      short: data.code.substring(0, 10),
      updatedAt: new Date(),
    },
  })
}

export const insertMockCharacter = async (
  overrides: Partial<Character> = {}
): Promise<Character> => {
  // avatarUrl が string | null と推論されるのを Prisma に合わせて調整
  const mockOverrides = {
    ...overrides,
    avatarUrl: overrides.avatarUrl !== null ? overrides.avatarUrl : undefined,
  }
  const data = createMockCharacter(mockOverrides)
  return await prisma.character.create({
    data: {
      avatarUrl: data.avatarUrl,
      bgColor: data.bgColor,
      code: data.code,
      color: data.color,
      createdAt: new Date(),
      id: data.id,
      name: data.name,
      priority: 0,
      short: data.short,
      unitId: data.unitId,
      updatedAt: new Date(),
    },
  })
}

export const insertMockSetting = async (
  userId: string,
  overrides: Partial<Setting> = {}
): Promise<Setting> => {
  return await prisma.setting.create({
    data: {
      leaderSheetUrl: "https://example.com/sheet.csv",
      userId,
      ...overrides,
    },
  })
}
export const insertMockFurnitureTag = async (
  overrides: Partial<FurnitureTag> = {}
): Promise<FurnitureTag> => {
  return await prisma.furnitureTag.create({
    data: {
      createdAt: new Date(),
      id: "tag-1",
      name: "テストタグ",
      updatedAt: new Date(),
      ...overrides,
    },
  })
}

export const insertMockFurnitureGroup = async (
  overrides: Partial<FurnitureGroup> = {}
): Promise<FurnitureGroup> => {
  return await prisma.furnitureGroup.create({
    data: {
      createdAt: new Date(),
      id: "group-1",
      name: "テストグループ",
      updatedAt: new Date(),
      ...overrides,
    },
  })
}

export const insertMockFurniture = async (
  tagId: string,
  overrides: Partial<Furniture> = {}
): Promise<Furniture> => {
  return await prisma.furniture.create({
    data: {
      createdAt: new Date(),
      id: "furniture-1",
      name: "テスト家具",
      tagId,
      updatedAt: new Date(),
      ...overrides,
    },
  })
}

export const insertMockUserFurniture = async (
  userId: string,
  furnitureId: string,
  overrides: Partial<UserFurniture> = {}
): Promise<UserFurniture> => {
  return await prisma.userFurniture.create({
    data: {
      furnitureId,
      id: "user-furniture-1",
      userId,
      ...overrides,
    },
  })
}

export const insertMockFurnitureReaction = async (
  furnitureId: string,
  overrides: Partial<FurnitureReaction> = {}
): Promise<FurnitureReaction> => {
  return await prisma.furnitureReaction.create({
    data: {
      createdAt: new Date(),
      furnitureId,
      id: "reaction-1",
      updatedAt: new Date(),
      ...overrides,
    },
  })
}

export const insertMockFurnitureReactionCharacter = async (
  reactionId: string,
  characterId: string,
  overrides: Partial<FurnitureReactionCharacter> = {}
): Promise<FurnitureReactionCharacter> => {
  return await prisma.furnitureReactionCharacter.create({
    data: {
      characterId,
      createdAt: new Date(),
      id: "reaction-character-1",
      reactionId,
      ...overrides,
    },
  })
}

export const insertMockUserReactionCheck = async (
  userId: string,
  reactionId: string,
  overrides: Partial<UserReactionCheck> = {}
): Promise<UserReactionCheck> => {
  return await prisma.userReactionCheck.create({
    data: {
      checkedAt: new Date(),
      id: "user-reaction-check-1",
      reactionId,
      userId,
      ...overrides,
    },
  })
}

import { UserRole } from "@prisma/client"

export interface CurrentUserData {
  avatarUrl: string | null
  discordId: string
  email: string | null
  id: string
  name: string | null
  role: UserRole
}

export interface CurrentUserResponse {
  data?: CurrentUserData
  message: string
  success: boolean
}

export interface CurrentSettingData {
  isRegistered: boolean
  leaderSheetUrl: string | null
}

export interface CurrentSettingResponse {
  data?: CurrentSettingData
  message: string
  success: boolean
}

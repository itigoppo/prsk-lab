/**
 * ユーザー名の表示ロジックを統一するためのユーティリティ
 */

export interface UserNameData {
  name: string | null
}

/**
 * 日本語名かどうかを判定する
 * @param firstName 名前
 * @returns 日本語名の場合true
 */
export const isJapaneseName = (firstName: string | null): boolean => {
  return /^[^\x00-\x7F]/.test(firstName ?? "")
}

/**
 * ユーザーの表示名を取得する
 * @param user ユーザー情報
 * @returns 表示用の名前文字列
 */
export const getUserDisplayName = (user: UserNameData): string => {
  if (!user.name) {
    return "ユーザー"
  }

  return user.name
}

/**
 * ユーザーのイニシャルを取得する（アバター用）
 * @param user ユーザー情報
 * @returns イニシャル文字列
 */
export const getUserInitials = (user: UserNameData): string => {
  if (!user.name) {
    return "U"
  }

  const isJapanese = isJapaneseName(user.name)

  if (isJapanese) {
    // 日本語名の場合: 名前の最初の2文字
    return user.name.substring(0, 2)
  } else {
    // 英語名の場合: 名前の最初の2文字を大文字
    return user.name.substring(0, 2).toUpperCase()
  }
}

export const getUserAvatarUrl = (userId: string, avatarUrl: string): string => {
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarUrl}.png`
}

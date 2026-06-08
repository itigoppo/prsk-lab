export type DiscordUser = {
  avatar?: string | null
  email?: string | null
  id: string
  username?: string | null
}

export type AppEnv = {
  Variables: {
    discordId: string
  }
}

export type DiscordAuthEnv = {
  Variables: {
    discordId: string
    discordUser: DiscordUser
  }
}

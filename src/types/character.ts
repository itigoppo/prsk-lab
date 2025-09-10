export interface CharacterUnitListItem {
  bgColor: string
  code: string
  color: string
  name: string
  short: string
}

export interface CharacterListItem {
  avatarUrl: string | null
  bgColor: string
  code: string
  color: string
  isVirtualSinger: boolean
  name: string
  short: string
  unit: CharacterUnitListItem | null
}

export interface CharacterListResponse {
  data: { characters: CharacterListItem[] }
  message: string
  success: boolean
}

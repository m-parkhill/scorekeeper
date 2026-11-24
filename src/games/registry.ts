import type { GameTypeId } from '../core/types'
import { dutchBlitz } from './dutchBlitz'
import { fiveHundred } from './fiveHundred'
import { wildRummy } from './wildRummy'
import type { ComingSoonGame, GameDefinition } from './types'

export const GAMES: (GameDefinition | ComingSoonGame)[] = [
  dutchBlitz,
  wildRummy,
  fiveHundred,
]

export function getGame(id: GameTypeId | string): GameDefinition | undefined {
  const g = GAMES.find((g) => g.id === id)
  return g && !('comingSoon' in g) ? g : undefined
}

export function gameName(id: string): string {
  return GAMES.find((g) => g.id === id)?.name ?? id
}

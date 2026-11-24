import type { GameTypeId } from '../core/types'
import { dutchBlitz } from './dutchBlitz'
import { wildRummy } from './wildRummy'
import type { ComingSoonGame, GameDefinition } from './types'

export const GAMES: (GameDefinition | ComingSoonGame)[] = [
  dutchBlitz,
  wildRummy,
  { id: 'five-hundred', name: '500', tagline: 'Coming soon', comingSoon: true },
]

export function getGame(id: GameTypeId | string): GameDefinition | undefined {
  const g = GAMES.find((g) => g.id === id)
  return g && !('comingSoon' in g) ? g : undefined
}

export function gameName(id: string): string {
  return GAMES.find((g) => g.id === id)?.name ?? id
}

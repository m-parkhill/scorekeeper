import type { GameDefinition } from '../types'
import { WildRummyPlay } from './Play'
import { HAND_COUNT, outcome, standings, wildLabel, type WildRummyGame, type WildRummyRound, type WildRummySettings } from './rules'

export const wildRummy: GameDefinition<WildRummySettings, WildRummyRound> = {
  id: 'wild-rummy',
  name: 'Wild Rummy',
  tagline: '13 hands, Aces wild through Kings wild. Low score wins.',
  minPlayers: 2,
  maxPlayers: 8,
  defaultSettings: {},
  Play: WildRummyPlay,
  summarize(game: WildRummyGame) {
    const o = outcome(game)
    if (o.kind === 'done') return `${o.winners.map((p) => p.name).join(' & ')} won with ${o.score}`
    if (game.rounds.length === 0) return `Not started · ${wildLabel(o.wild)} wild`
    const [lead] = standings(game)
    return `Hand ${o.nextHand} of ${HAND_COUNT} · ${lead.player.name} leads with ${lead.total}`
  },
}

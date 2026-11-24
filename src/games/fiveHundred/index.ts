import type { GameDefinition } from '../types'
import { FiveHundredPlay } from './Play'
import { outcome, sides, supportedPlayerCount, totals, type FiveHundredGame, type FiveHundredRound, type FiveHundredSettings } from './rules'
import { FiveHundredSettingsForm } from './Settings'

export const fiveHundred: GameDefinition<FiveHundredSettings, FiveHundredRound> = {
  id: 'five-hundred',
  name: '500',
  tagline: 'Bid, take tricks, first to 500 by making a bid.',
  minPlayers: 2,
  maxPlayers: 6,
  playerCountError: supportedPlayerCount,
  defaultSettings: { slamBonus: true },
  SettingsForm: FiveHundredSettingsForm,
  Play: FiveHundredPlay,
  summarize(game: FiveHundredGame) {
    const o = outcome(game)
    if (o.kind === 'won') return `${o.side.name} won`
    if (o.kind === 'lost') return `${o.winner.name} won`
    if (game.rounds.length === 0) return 'Not started'
    const t = totals(game)
    const s = sides(game.players)
    return `Hand ${game.rounds.length} · ${s.map((x) => t[x.id]).join(' – ')}`
  },
}

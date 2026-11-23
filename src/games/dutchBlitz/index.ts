import type { GameDefinition } from '../types'
import { DutchBlitzPlay } from './Play'
import { outcome, standings, type DutchBlitzGame, type DutchBlitzRound, type DutchBlitzSettings } from './rules'
import { DutchBlitzSettingsForm } from './Settings'

export const dutchBlitz: GameDefinition<DutchBlitzSettings, DutchBlitzRound> = {
  id: 'dutch-blitz',
  name: 'Dutch Blitz',
  tagline: '+1 per center card, −2 per Blitz card. First to 75.',
  minPlayers: 2,
  maxPlayers: 8,
  defaultSettings: { targetScore: 75 },
  SettingsForm: DutchBlitzSettingsForm,
  Play: DutchBlitzPlay,
  summarize(game: DutchBlitzGame) {
    const o = outcome(game)
    if (o.kind === 'won') return `${o.winner.name} won`
    if (game.rounds.length === 0) return 'Not started'
    const [lead] = standings(game)
    return `Round ${game.rounds.length} · ${lead.player.name} leads with ${lead.total}`
  },
}

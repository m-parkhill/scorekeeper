import type { ComponentType } from 'react'
import type { GameRecord, GameTypeId } from '../core/types'

/** What a game's play screen can do. Built generically by GameScreen. */
export interface GameActions<R> {
  addRound(data: R): void
  updateRound(roundId: string, data: R): void
  deleteRound(roundId: string): void
  finish(): void
  reopen(): void
  rematch(): void
}

export interface PlayProps<S, R> {
  game: GameRecord<S, R>
  actions: GameActions<R>
}

export interface SettingsFormProps<S> {
  value: S
  onChange(next: S): void
}

/**
 * Each game is a self-contained module: its own settings, round data shape,
 * scoring rules and entry UX. The core app knows nothing about scoring.
 */
export interface GameDefinition<S = any, R = any> {
  id: GameTypeId
  name: string
  tagline: string
  minPlayers: number
  maxPlayers: number
  defaultSettings: S
  SettingsForm?: ComponentType<SettingsFormProps<S>>
  Play: ComponentType<PlayProps<S, R>>
  /** One-line status for the home screen's "in progress" list. */
  summarize(game: GameRecord<S, R>): string
}

export interface ComingSoonGame {
  id: GameTypeId
  name: string
  tagline: string
  comingSoon: true
}

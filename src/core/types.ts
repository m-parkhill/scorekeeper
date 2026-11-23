/**
 * Core data model.
 *
 * Designed with future multi-device sync in mind:
 *  - Every entity has a globally unique id (no array-index identity).
 *  - Rounds are independent records with their own timestamps, so two devices
 *    adding/editing different rounds can be merged without conflict, and
 *    edits to the same round can be resolved last-write-wins (or per-field later).
 *  - Each record carries `updatedBy`, so attribution works once there are
 *    multiple people entering scores.
 *  - Game-specific shapes live in `settings` and `round.data`, so the core
 *    model doesn't need to change as new games are added.
 */

export type GameTypeId = 'dutch-blitz' | 'wild-rummy' | 'five-hundred'

export interface Player {
  id: string
  name: string
  color: string
}

export interface Round<R = unknown> {
  id: string
  createdAt: number
  updatedAt: number
  updatedBy: string
  data: R
}

export type GameStatus = 'active' | 'finished'

export interface GameRecord<S = unknown, R = unknown> {
  id: string
  type: GameTypeId
  schemaVersion: 1
  createdAt: number
  updatedAt: number
  updatedBy: string
  status: GameStatus
  players: Player[]
  settings: S
  rounds: Round<R>[]
}

import type { GameRecord, Player } from '../../core/types'

/**
 * Dutch Blitz scoring:
 *  +1 for every card a player got into the center (Dutch piles)
 *  −2 for every card left in their Blitz pile
 * Play continues round by round until someone reaches the target (75 by default)
 * at the end of a round; highest total wins. A tie at the top means play another round.
 */

export const BLITZ_PILE_SIZE = 10

export interface DutchBlitzSettings {
  targetScore: number
}

export interface DutchBlitzPlayerRound {
  center: number
  blitzLeft: number
}

export interface DutchBlitzRound {
  byPlayer: Record<string, DutchBlitzPlayerRound>
}

export type DutchBlitzGame = GameRecord<DutchBlitzSettings, DutchBlitzRound>

export function roundPoints(e: DutchBlitzPlayerRound | undefined): number {
  if (!e) return 0
  return e.center - 2 * e.blitzLeft
}

/** Running totals after each round: result[i][playerId]. */
export function runningTotals(game: DutchBlitzGame): Record<string, number>[] {
  const acc: Record<string, number> = Object.fromEntries(game.players.map((p) => [p.id, 0]))
  return game.rounds.map((r) => {
    for (const p of game.players) acc[p.id] += roundPoints(r.data.byPlayer[p.id])
    return { ...acc }
  })
}

export function totals(game: DutchBlitzGame): Record<string, number> {
  const rt = runningTotals(game)
  return rt[rt.length - 1] ?? Object.fromEntries(game.players.map((p) => [p.id, 0]))
}

export type Outcome =
  | { kind: 'playing' }
  | { kind: 'won'; winner: Player }
  | { kind: 'tied'; leaders: Player[] }

export function outcome(game: DutchBlitzGame): Outcome {
  if (game.rounds.length === 0) return { kind: 'playing' }
  const t = totals(game)
  const max = Math.max(...game.players.map((p) => t[p.id]))
  if (max < game.settings.targetScore) return { kind: 'playing' }
  const leaders = game.players.filter((p) => t[p.id] === max)
  return leaders.length === 1 ? { kind: 'won', winner: leaders[0] } : { kind: 'tied', leaders }
}

/** Players ordered by total, highest first (stable on ties by seat order). */
export function standings(game: DutchBlitzGame): { player: Player; total: number; last: number | null }[] {
  const t = totals(game)
  const lastRound = game.rounds[game.rounds.length - 1]
  return game.players
    .map((player) => ({
      player,
      total: t[player.id],
      last: lastRound ? roundPoints(lastRound.data.byPlayer[player.id]) : null,
    }))
    .sort((a, b) => b.total - a.total)
}

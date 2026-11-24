import type { GameRecord, Player } from '../../core/types'

/**
 * Wild Rummy, as played at our table:
 *  - 13 hands. Hand 1 Aces are wild, hand 2 twos, … hand 13 Kings.
 *  - At the end of a hand, each player scores the cards left in their hand:
 *    number cards face value, J/Q/K 10, Aces 1, wild cards and Jokers 20.
 *    Whoever went out scores 0. Usually that's one player, but if someone goes
 *    out on their first turn, everyone who hasn't played yet gets one turn and
 *    can also go out, so several players may score 0.
 *  - Lowest cumulative score after 13 hands wins.
 */

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export type Rank = (typeof RANKS)[number]
export type CardKey = Rank | 'JOKER'
export const CARD_KEYS: CardKey[] = [...RANKS, 'JOKER']
export const HAND_COUNT = RANKS.length

/** Counts of each card left in a player's hand. */
export type CardTally = Partial<Record<CardKey, number>>

export interface WildRummySettings {}

export interface WildRummyPlayerHand {
  points: number
  wentOut?: boolean
  /** Present when the hand was counted card-by-card (kept so edits restore it). */
  cards?: CardTally
}

export interface WildRummyRound {
  wild: Rank
  byPlayer: Record<string, WildRummyPlayerHand>
}

export type WildRummyGame = GameRecord<WildRummySettings, WildRummyRound>

/** Wild rank for a hand, 0-based. */
export function wildForHand(handIndex: number): Rank {
  return RANKS[Math.min(handIndex, HAND_COUNT - 1)]
}

export function wildLabel(rank: Rank): string {
  return { A: 'Aces', J: 'Jacks', Q: 'Queens', K: 'Kings' }[rank as string] ?? `${rank}s`
}

export function cardLabel(card: CardKey): string {
  return card === 'JOKER' ? 'Joker' : card
}

export function cardValue(card: CardKey, wild: Rank): number {
  if (card === 'JOKER' || card === wild) return 20
  if (card === 'A') return 1
  if (card === 'J' || card === 'Q' || card === 'K') return 10
  return Number(card)
}

export function tallyPoints(tally: CardTally, wild: Rank): number {
  return CARD_KEYS.reduce((sum, k) => sum + (tally[k] ?? 0) * cardValue(k, wild), 0)
}

export function tallyCount(tally: CardTally): number {
  return CARD_KEYS.reduce((n, k) => n + (tally[k] ?? 0), 0)
}

export function runningTotals(game: WildRummyGame): Record<string, number>[] {
  const acc: Record<string, number> = Object.fromEntries(game.players.map((p) => [p.id, 0]))
  return game.rounds.map((r) => {
    for (const p of game.players) acc[p.id] += r.data.byPlayer[p.id]?.points ?? 0
    return { ...acc }
  })
}

export function totals(game: WildRummyGame): Record<string, number> {
  const rt = runningTotals(game)
  return rt[rt.length - 1] ?? Object.fromEntries(game.players.map((p) => [p.id, 0]))
}

/** Lowest score first (stable on ties by seat order). */
export function standings(game: WildRummyGame): { player: Player; total: number; last: number | null }[] {
  const t = totals(game)
  const lastRound = game.rounds[game.rounds.length - 1]
  return game.players
    .map((player) => ({ player, total: t[player.id], last: lastRound ? (lastRound.data.byPlayer[player.id]?.points ?? 0) : null }))
    .sort((a, b) => a.total - b.total)
}

export type Outcome = { kind: 'playing'; nextHand: number; wild: Rank } | { kind: 'done'; winners: Player[]; score: number }

export function outcome(game: WildRummyGame): Outcome {
  const played = game.rounds.length
  if (played < HAND_COUNT) return { kind: 'playing', nextHand: played + 1, wild: wildForHand(played) }
  const [first] = standings(game)
  const t = totals(game)
  return { kind: 'done', winners: game.players.filter((p) => t[p.id] === first.total), score: first.total }
}

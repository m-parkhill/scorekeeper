import type { GameRecord, Player } from '../../core/types'

/**
 * Five Hundred, using the standard (Australian / Avondale) scoring table.
 *
 * Bid values: 6 tricks start at 40 (♠) and go up 20 per suit (♠ ♣ ♦ ♥ NT),
 * and each extra trick adds 100. So 6♠ = 40, 7♥ = 200, 10NT = 520.
 * No Trick (often called Misère or Nullo elsewhere) = 250; Open No Trick = 500.
 *
 * - Bidder's side makes the contract: + bid value (overtricks add nothing).
 *   Slam bonus (optional): taking all 10 tricks on a bid worth under 250 scores 250.
 * - Bidder's side fails: − bid value.
 * - Each opposing side scores 10 per trick it took, made or not.
 * - No Trick / Open No Trick: bidder must take no tricks; opponents score nothing.
 * - Win: reach 500+ by making a bid. Points from defending don't win the game.
 * - Lose: fall to −500 or below ("out the back door").
 *
 * Sides: 4 or 6 players are two teams, with partners sitting alternately
 * (seats 1 & 3 vs 2 & 4). With 2 or 3 players, everyone plays for themselves.
 */

export type Suit = 'S' | 'C' | 'D' | 'H' | 'NT'
export const SUITS: Suit[] = ['S', 'C', 'D', 'H', 'NT']
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', C: '♣', D: '♦', H: '♥', NT: 'NT' }
export const TRICK_LEVELS = [6, 7, 8, 9, 10] as const
export const TOTAL_TRICKS = 10
export const WIN_SCORE = 500
export const LOSE_SCORE = -500
export const NO_TRICK_VALUE = 250
export const OPEN_NO_TRICK_VALUE = 500
export const SLAM_SCORE = 250

export type Bid = { kind: 'suit'; tricks: number; suit: Suit } | { kind: 'no-trick' } | { kind: 'open-no-trick' }

export interface FiveHundredSettings {
  slamBonus: boolean
}

export interface FiveHundredRound {
  /** The player who won the bid (their side is the contracting side). */
  bidderId: string
  bid: Bid
  /** Suit/NT bids: tricks taken by each side, keyed by side id; sums to 10. */
  tricks?: Record<string, number>
  /** No Trick bids: true if the bidder took no tricks. */
  noTrickMade?: boolean
}

export type FiveHundredGame = GameRecord<FiveHundredSettings, FiveHundredRound>

export interface Side {
  id: string
  name: string
  color: string
  playerIds: string[]
}

export function supportedPlayerCount(n: number): string | null {
  if (n === 5) return "5-player 500 (calling a partner) isn't supported yet. Play with 2, 3, 4 or 6."
  if (n > 6) return '500 supports up to 6 players.'
  return null
}

export function sides(players: Player[]): Side[] {
  if (players.length === 4 || players.length === 6) {
    return [0, 1].map((t) => {
      const members = players.filter((_, i) => i % 2 === t)
      return {
        id: `team-${t + 1}`,
        name: members.map((p) => p.name).join(' & '),
        color: members[0].color,
        playerIds: members.map((p) => p.id),
      }
    })
  }
  return players.map((p) => ({ id: p.id, name: p.name, color: p.color, playerIds: [p.id] }))
}

export function sideOf(all: Side[], playerId: string): Side {
  return all.find((s) => s.playerIds.includes(playerId))!
}

export function bidValue(bid: Bid): number {
  if (bid.kind === 'no-trick') return NO_TRICK_VALUE
  if (bid.kind === 'open-no-trick') return OPEN_NO_TRICK_VALUE
  return 40 + (bid.tricks - 6) * 100 + SUITS.indexOf(bid.suit) * 20
}

export function bidLabel(bid: Bid): string {
  if (bid.kind === 'no-trick') return 'No Trick'
  if (bid.kind === 'open-no-trick') return 'Open No Trick'
  return `${bid.tricks}${SUIT_SYMBOL[bid.suit]}`
}

export function isNoTrick(bid: Bid) {
  return bid.kind !== 'suit'
}

export function contractMade(round: FiveHundredRound, all: Side[]): boolean {
  if (round.bid.kind !== 'suit') return round.noTrickMade === true
  const bidder = sideOf(all, round.bidderId)
  return (round.tricks?.[bidder.id] ?? 0) >= round.bid.tricks
}

/** Points each side scores on one hand. */
export function handScores(round: FiveHundredRound, all: Side[], settings: FiveHundredSettings): Record<string, number> {
  const bidder = sideOf(all, round.bidderId)
  const value = bidValue(round.bid)
  const made = contractMade(round, all)
  const out: Record<string, number> = Object.fromEntries(all.map((s) => [s.id, 0]))

  if (round.bid.kind !== 'suit') {
    out[bidder.id] = made ? value : -value
    return out
  }

  const bidderTricks = round.tricks?.[bidder.id] ?? 0
  if (!made) out[bidder.id] = -value
  else if (settings.slamBonus && bidderTricks === TOTAL_TRICKS && value < SLAM_SCORE) out[bidder.id] = SLAM_SCORE
  else out[bidder.id] = value

  for (const s of all) if (s.id !== bidder.id) out[s.id] = 10 * (round.tricks?.[s.id] ?? 0)
  return out
}

export function runningTotals(game: FiveHundredGame): Record<string, number>[] {
  const all = sides(game.players)
  const acc: Record<string, number> = Object.fromEntries(all.map((s) => [s.id, 0]))
  return game.rounds.map((r) => {
    const h = handScores(r.data, all, game.settings)
    for (const s of all) acc[s.id] += h[s.id]
    return { ...acc }
  })
}

export function totals(game: FiveHundredGame): Record<string, number> {
  const rt = runningTotals(game)
  return rt[rt.length - 1] ?? Object.fromEntries(sides(game.players).map((s) => [s.id, 0]))
}

export type Outcome =
  | { kind: 'playing' }
  | { kind: 'won'; side: Side; hand: number }
  | { kind: 'lost'; side: Side; winner: Side; hand: number }

export function outcome(game: FiveHundredGame): Outcome {
  const all = sides(game.players)
  const running = runningTotals(game)
  for (let i = 0; i < game.rounds.length; i++) {
    const r = game.rounds[i].data
    const t = running[i]
    const bidder = sideOf(all, r.bidderId)
    if (contractMade(r, all) && t[bidder.id] >= WIN_SCORE) return { kind: 'won', side: bidder, hand: i + 1 }
    const loser = all.find((s) => t[s.id] <= LOSE_SCORE)
    if (loser) {
      const winner = all.filter((s) => s.id !== loser.id).sort((a, b) => t[b.id] - t[a.id])[0]
      return { kind: 'lost', side: loser, winner, hand: i + 1 }
    }
  }
  return { kind: 'playing' }
}

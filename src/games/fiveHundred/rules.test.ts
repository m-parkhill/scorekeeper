import { describe, expect, it } from 'vitest'
import { bidValue, handScores, outcome, sides, supportedPlayerCount, totals, type FiveHundredGame, type FiveHundredRound } from './rules'

const p = (id: string) => ({ id, name: id.toUpperCase(), color: '' })
const four = [p('a'), p('b'), p('c'), p('d')]
const three = [p('a'), p('b'), p('c')]
const on = { slamBonus: true }

function game(players: typeof four, rounds: FiveHundredRound[]): FiveHundredGame {
  return {
    id: 'g', type: 'five-hundred', schemaVersion: 1, createdAt: 0, updatedAt: 0, updatedBy: 't',
    status: 'active', players, settings: on,
    rounds: rounds.map((data, i) => ({ id: 'r' + i, createdAt: 0, updatedAt: 0, updatedBy: 't', data })),
  }
}
const suit = (bidderId: string, tricks: number, s: 'S' | 'C' | 'D' | 'H' | 'NT', t1: number): FiveHundredRound => ({
  bidderId, bid: { kind: 'suit', tricks, suit: s }, tricks: { 'team-1': t1, 'team-2': 10 - t1 },
})

describe('500 bid table', () => {
  it('matches the standard table', () => {
    expect(bidValue({ kind: 'suit', tricks: 6, suit: 'S' })).toBe(40)
    expect(bidValue({ kind: 'suit', tricks: 6, suit: 'NT' })).toBe(120)
    expect(bidValue({ kind: 'suit', tricks: 7, suit: 'H' })).toBe(200)
    expect(bidValue({ kind: 'suit', tricks: 8, suit: 'C' })).toBe(260)
    expect(bidValue({ kind: 'suit', tricks: 10, suit: 'D' })).toBe(480)
    expect(bidValue({ kind: 'suit', tricks: 10, suit: 'NT' })).toBe(520)
    expect(bidValue({ kind: 'no-trick' })).toBe(250)
    expect(bidValue({ kind: 'open-no-trick' })).toBe(500)
  })
})

describe('500 sides', () => {
  it('pairs alternate seats with 4 players, individuals with 3', () => {
    expect(sides(four).map((s) => s.playerIds)).toEqual([['a', 'c'], ['b', 'd']])
    expect(sides(three)).toHaveLength(3)
    expect(supportedPlayerCount(5)).toMatch(/isn't supported/)
    expect(supportedPlayerCount(4)).toBeNull()
  })
})

describe('500 hand scoring', () => {
  const s4 = sides(four)
  it('scores a made bid and 10 per trick for opponents', () => {
    expect(handScores(suit('a', 8, 'H', 8), s4, on)).toEqual({ 'team-1': 300, 'team-2': 20 })
  })
  it('subtracts a failed bid; opponents still score their tricks', () => {
    expect(handScores(suit('b', 7, 'S', 4), s4, on)).toEqual({ 'team-1': 40, 'team-2': -140 })
  })
  it('awards the slam bonus only when enabled and the bid is under 250', () => {
    expect(handScores(suit('a', 6, 'S', 10), s4, on)['team-1']).toBe(250)
    expect(handScores(suit('a', 6, 'S', 10), s4, { slamBonus: false })['team-1']).toBe(40)
    expect(handScores(suit('a', 8, 'D', 10), s4, on)['team-1']).toBe(280)
  })
  it('scores No Trick as ±250 with nothing for opponents', () => {
    expect(handScores({ bidderId: 'c', bid: { kind: 'no-trick' }, noTrickMade: true }, s4, on)).toEqual({ 'team-1': 250, 'team-2': 0 })
    expect(handScores({ bidderId: 'd', bid: { kind: 'open-no-trick' }, noTrickMade: false }, s4, on)).toEqual({ 'team-1': 0, 'team-2': -500 })
  })
  it('scores defenders individually in 3-player', () => {
    const r: FiveHundredRound = { bidderId: 'a', bid: { kind: 'suit', tricks: 7, suit: 'C' }, tricks: { a: 7, b: 2, c: 1 } }
    expect(handScores(r, sides(three), on)).toEqual({ a: 160, b: 20, c: 10 })
  })
})

describe('500 game end', () => {
  it('is won only by making a bid that reaches 500', () => {
    const g = game(four, [suit('a', 10, 'H', 10)])
    expect(outcome(g)).toMatchObject({ kind: 'won', side: { id: 'team-1' } })
  })
  it('does not end when the defending side passes 500 on trick points', () => {
    const rounds = [suit('a', 10, 'S', 10), suit('b', 6, 'S', 10)] // team-1: 440, then +100 defending = 540
    const g = game(four, rounds)
    expect(totals(g)['team-1']).toBe(540)
    expect(outcome(g).kind).toBe('playing')
  })
  it('ends when a side falls to -500', () => {
    const g = game(four, [{ bidderId: 'b', bid: { kind: 'open-no-trick' }, noTrickMade: false }])
    expect(outcome(g)).toMatchObject({ kind: 'lost', side: { id: 'team-2' }, winner: { id: 'team-1' } })
  })
})

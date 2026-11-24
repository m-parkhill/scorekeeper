import { describe, expect, it } from 'vitest'
import { cardValue, outcome, standings, tallyPoints, totals, wildForHand, wildLabel, type WildRummyGame } from './rules'

const players = [
  { id: 'a', name: 'Ann', color: '' },
  { id: 'b', name: 'Bob', color: '' },
]

function game(points: [number, number][]): WildRummyGame {
  return {
    id: 'g', type: 'wild-rummy', schemaVersion: 1, createdAt: 0, updatedAt: 0, updatedBy: 't',
    status: 'active', players, settings: {},
    rounds: points.map(([a, b], i) => ({
      id: 'r' + i, createdAt: 0, updatedAt: 0, updatedBy: 't',
      data: { wild: wildForHand(i), byPlayer: { a: { points: a }, b: { points: b } } },
    })),
  }
}

describe('wild rummy', () => {
  it('rotates the wild rank A through K over 13 hands', () => {
    expect(wildForHand(0)).toBe('A')
    expect(wildForHand(1)).toBe('2')
    expect(wildForHand(9)).toBe('10')
    expect(wildForHand(12)).toBe('K')
    expect(wildLabel('A')).toBe('Aces')
    expect(wildLabel('7')).toBe('7s')
  })

  it('values cards per house rules', () => {
    expect(cardValue('7', 'K')).toBe(7)
    expect(cardValue('10', 'K')).toBe(10)
    expect(cardValue('J', 'K')).toBe(10)
    expect(cardValue('A', 'K')).toBe(1)
    expect(cardValue('JOKER', 'K')).toBe(20)
    expect(cardValue('K', 'K')).toBe(20)
    expect(cardValue('A', 'A')).toBe(20) // hand 1: aces are wild
  })

  it('totals a tally using the hand wild rank', () => {
    // 5s wild: A(1) + 5(20) + 5(20) + Q(10) + 9(9) + Joker(20)
    expect(tallyPoints({ A: 1, '5': 2, Q: 1, '9': 1, JOKER: 1 }, '5')).toBe(80)
  })

  it('ranks lowest score first and finishes after 13 hands', () => {
    const g = game(Array.from({ length: 12 }, () => [10, 0] as [number, number]))
    expect(standings(g)[0].player.id).toBe('b')
    expect(outcome(g)).toMatchObject({ kind: 'playing', nextHand: 13, wild: 'K' })
    g.rounds.push({ ...g.rounds[0], id: 'last', data: { wild: 'K', byPlayer: { a: { points: 0 }, b: { points: 5 } } } })
    expect(totals(g)).toEqual({ a: 120, b: 5 })
    expect(outcome(g)).toMatchObject({ kind: 'done', winners: [{ id: 'b' }], score: 5 })
  })

  it('reports co-winners on a tie', () => {
    const g = game(Array.from({ length: 13 }, () => [3, 3] as [number, number]))
    expect(outcome(g)).toMatchObject({ kind: 'done', score: 39 })
    expect((outcome(g) as { winners: unknown[] }).winners).toHaveLength(2)
  })

  it('lets several players go out in the same hand', () => {
    const g = game([[0, 0]])
    g.rounds[0].data.byPlayer = { a: { points: 0, wentOut: true }, b: { points: 0, wentOut: true } }
    expect(totals(g)).toEqual({ a: 0, b: 0 })
  })
})

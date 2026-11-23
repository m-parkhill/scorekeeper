import { describe, expect, it, vi } from 'vitest'

vi.mock('../../core/identity', () => ({ currentAuthorId: () => 'test' }))

import { outcome, roundPoints, runningTotals, standings, totals, type DutchBlitzGame } from './rules'

const players = [
  { id: 'a', name: 'Ann', color: '' },
  { id: 'b', name: 'Bob', color: '' },
]

function game(rounds: [number, number, number, number][], target = 75): DutchBlitzGame {
  return {
    id: 'g', type: 'dutch-blitz', schemaVersion: 1, createdAt: 0, updatedAt: 0, updatedBy: 'test',
    status: 'active', players, settings: { targetScore: target },
    rounds: rounds.map(([ac, ab, bc, bb], i) => ({
      id: 'r' + i, createdAt: 0, updatedAt: 0, updatedBy: 'test',
      data: { byPlayer: { a: { center: ac, blitzLeft: ab }, b: { center: bc, blitzLeft: bb } } },
    })),
  }
}

describe('dutch blitz scoring', () => {
  it('scores +1 per center card and -2 per blitz card', () => {
    expect(roundPoints({ center: 15, blitzLeft: 0 })).toBe(15)
    expect(roundPoints({ center: 8, blitzLeft: 6 })).toBe(-4)
  })

  it('accumulates running totals', () => {
    const g = game([[20, 0, 10, 3], [5, 4, 18, 0]])
    expect(runningTotals(g)).toEqual([{ a: 20, b: 4 }, { a: 17, b: 22 }])
    expect(totals(g)).toEqual({ a: 17, b: 22 })
    expect(standings(g).map((s) => s.player.id)).toEqual(['b', 'a'])
  })

  it('is still playing below target', () => {
    expect(outcome(game([[20, 0, 10, 3]])).kind).toBe('playing')
    expect(outcome(game([])).kind).toBe('playing')
  })

  it('declares the highest total the winner once anyone reaches target', () => {
    const o = outcome(game([[40, 0, 30, 0], [36, 0, 50, 0]]))
    expect(o).toMatchObject({ kind: 'won', winner: { id: 'b' } })
  })

  it('reports a tie at the top over target', () => {
    expect(outcome(game([[80, 0, 80, 0]])).kind).toBe('tied')
  })
})
